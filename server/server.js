/**
 * Butt Collection Merchandiser Portal - Express Server
 * Powered by MongoDB (Mongoose) with Auto-Seeding & Excel/PDF/DOCX Document Generation
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { connectDB, getIsConnected, models } = require('./config/db');
const { Order, Payment, CartonLabel, Company } = models;
const { readDb, writeDb } = require('./db');

const { generateFullTrackerWorkbook } = require('./services/excelService');
const { generateOrderPdfBuffer, generateCartonLabelPdfBuffer } = require('./services/pdfService');
const { generateOrderDocx } = require('./services/docxService');
const {
  findArabicFields,
  sanitizeTextFields,
  collectChangedFields
} = require('./utils/arabicScript');
const { formatOrderNumber } = require('./utils/orderNumber');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection
connectDB();

// -------------------------------------------------------------
// Helper Calculation & Data Fetching Helpers
// -------------------------------------------------------------
function calculateDaysLeft(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getAllOrders() {
  if (getIsConnected()) {
    const list = await Order.find().sort({ orderDate: -1 }).lean();
    return list.map(o => ({ ...o, id: o._id.toString() }));
  }
  return readDb().orders || [];
}

async function getAllPayments() {
  if (getIsConnected()) {
    const list = await Payment.find().sort({ date: -1 }).lean();
    return list.map(p => ({ ...p, id: p._id.toString() }));
  }
  return readDb().payments || [];
}

async function getAllLabels() {
  if (getIsConnected()) {
    const list = await CartonLabel.find().sort({ createdAt: -1 }).lean();
    return list.map(l => ({ ...l, id: l._id.toString() }));
  }
  return readDb().cartonLabels || [];
}

async function getCompanyInfo() {
  if (getIsConnected()) {
    const comp = await Company.findOne().lean();
    if (comp) return { ...comp, id: comp._id.toString() };
  }
  return readDb().company;
}

// -------------------------------------------------------------
// URDU / ARABIC SCRIPT GUARD
// Arabic-script characters break the PDF / Word / Excel exports, so
// they are rejected on write and stripped by the maintenance route.
// -------------------------------------------------------------
function rejectArabicPayload(req, res, next) {
  const fields = findArabicFields(req.body || {});
  if (fields.length > 0) {
    return res.status(400).json({
      error: 'Urdu / Arabic script is not allowed in these fields. Use English or Roman Urdu.',
      fields
    });
  }
  next();
}

async function cleanArabicRecords() {
  const summary = { orders: 0, payments: 0, labels: 0, fields: 0 };

  if (getIsConnected()) {
    const collections = [
      { model: Order, key: 'orders' },
      { model: Payment, key: 'payments' },
      { model: CartonLabel, key: 'labels' }
    ];

    for (const { model, key } of collections) {
      const docs = await model.find().lean();
      for (const doc of docs) {
        const { _id, __v, ...rest } = doc;
        const cleaned = sanitizeTextFields(rest);
        const patch = collectChangedFields(rest, cleaned);
        const changedCount = Object.keys(patch).length;
        if (changedCount === 0) continue;
        await model.findByIdAndUpdate(_id, { $set: patch }, { runValidators: false });
        summary[key] += 1;
        summary.fields += changedCount;
      }
    }
    return summary;
  }

  const db = readDb();
  const collections = [
    { records: db.orders || [], key: 'orders' },
    { records: db.payments || [], key: 'payments' },
    { records: db.cartonLabels || [], key: 'labels' }
  ];

  collections.forEach(({ records, key }) => {
    records.forEach((record, index) => {
      const cleaned = sanitizeTextFields(record);
      const patch = collectChangedFields(record, cleaned);
      const changedCount = Object.keys(patch).length;
      if (changedCount === 0) return;
      records[index] = { ...record, ...patch };
      summary[key] += 1;
      summary.fields += changedCount;
    });
  });

  writeDb(db);
  return summary;
}

// -------------------------------------------------------------
// HEALTH & DB STATUS
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const isMongo = getIsConnected();
  res.json({
    status: 'ok',
    database: isMongo ? 'MongoDB' : 'Local Storage (MongoDB Pending)',
    mongoConnected: isMongo,
    port: PORT,
    timestamp: new Date()
  });
});

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    const company = await getCompanyInfo();
    const orders = await getAllOrders();
    const payments = await getAllPayments();

    const todayStr = new Date().toISOString().split('T')[0];

    const totalOrders = orders.length;
    const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
    const inProgressOrders = orders.filter(o => o.status === 'In Progress').length;
    const lateOrders = orders.filter(o => {
      if (o.status === 'Shipped') return false;
      return o.deadline && o.deadline < todayStr;
    }).length;
    const urgentOrders = orders.filter(o => {
      if (o.status === 'Shipped') return false;
      const days = calculateDaysLeft(o.deadline);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    const totalBilled = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const balanceDue = totalBilled - totalReceived;
    const totalPieces = orders.reduce((sum, o) => sum + (Number(o.totalPieces) || 0), 0);

    const annotatedOrders = orders.map(o => {
      const daysLeft = calculateDaysLeft(o.deadline);
      let alert = 'Normal';
      if (o.status === 'Shipped') {
        alert = 'Shipped';
      } else if (o.deadline && o.deadline < todayStr) {
        alert = 'LATE';
      } else if (daysLeft !== null && daysLeft <= 7) {
        alert = `Urgent (${daysLeft} days)`;
      } else if (daysLeft !== null) {
        alert = `On time (${daysLeft} days)`;
      }
      return { ...o, daysLeft, alert };
    });

    res.json({
      company,
      database: getIsConnected() ? 'MongoDB' : 'Local Storage',
      stats: {
        totalOrders,
        shippedOrders,
        inProgressOrders,
        lateOrders,
        urgentOrders,
        totalBilled,
        totalReceived,
        balanceDue,
        totalPieces
      },
      orders: annotatedOrders,
      recentPayments: payments.slice(-5),
      todayDate: todayStr
    });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ error: 'Server error loading dashboard' });
  }
});

// -------------------------------------------------------------
// ORDERS CRUD
// -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  try {
    let orders = await getAllOrders();
    const { status, customer, search } = req.query;

    if (status && status !== 'All') {
      orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }
    if (customer) {
      orders = orders.filter(o => o.customer.toLowerCase().includes(customer.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        (o.items || []).some(i => i.style && i.style.toLowerCase().includes(q))
      );
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (getIsConnected()) {
      const order = await Order.findById(req.params.id).lean();
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json({ ...order, id: order._id.toString() });
    }

    const db = readDb();
    const order = (db.orders || []).find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', rejectArabicPayload, async (req, res) => {
  try {
    const {
      orderNumber,
      customer,
      manufacturer = 'Butt Collection',
      dispatchCity = 'Faisalabad',
      orderDate,
      deadline,
      status = 'In Progress',
      notes = '',
      items = []
    } = req.body;

    if (!orderNumber || !customer) {
      return res.status(400).json({ error: 'Order number and Customer name are required' });
    }

    let totalPieces = 0;
    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const amount = Number(item.amount) || (qty * rate);
      totalPieces += qty;
      totalAmount += amount;
      return {
        style: item.style || 'Standard Style',
        gsm: item.gsm || '',
        color: item.color || 'Assorted',
        sizeBreakdown: item.sizeBreakdown || { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
        cartons: Number(item.cartons) || 0,
        setsPerCarton: Number(item.setsPerCarton) || 0,
        qty,
        rate,
        amount
      };
    });

    const orderData = {
      orderNumber: formatOrderNumber(orderNumber),
      customer,
      manufacturer,
      dispatchCity,
      orderDate: orderDate || new Date().toISOString().split('T')[0],
      deadline: deadline || '',
      shippedOn: status === 'Shipped' ? (req.body.shippedOn || orderDate) : '',
      status,
      totalPieces,
      totalAmount,
      amountReceived: 0,
      balance: totalAmount,
      notes,
      items: processedItems
    };

    if (getIsConnected()) {
      const created = await Order.create(orderData);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    }

    const db = readDb();
    const newOrder = { id: `ord-${Date.now()}`, ...orderData };
    db.orders.push(newOrder);
    writeDb(db);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', rejectArabicPayload, async (req, res) => {
  try {
    const updatedItems = req.body.items ? req.body.items.map(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const amount = Number(item.amount) || (qty * rate);
      return { ...item, qty, rate, amount };
    }) : undefined;

    let totalPieces = undefined;
    let totalAmount = undefined;
    let balance = undefined;

    if (updatedItems) {
      totalPieces = updatedItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      totalAmount = updatedItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const received = Number(req.body.amountReceived) || 0;
      balance = totalAmount - received;
    }

    // Remove id/_id fields from payload to avoid MongoDB conflict
    const { id: _ignoredId, _id: _ignoredMongoId, __v, ...cleanBody } = req.body;

    if (typeof cleanBody.orderNumber === 'string') {
      cleanBody.orderNumber = formatOrderNumber(cleanBody.orderNumber);
    }

    const payload = {
      ...cleanBody,
      ...(updatedItems && { items: updatedItems, totalPieces, totalAmount, balance })
    };

    if (getIsConnected()) {
      const updated = await Order.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: false }).lean();
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      return res.json({ ...updated, id: updated._id.toString() });
    }

    const db = readDb();
    const idx = db.orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    db.orders[idx] = { ...db.orders[idx], ...payload };
    writeDb(db);
    res.json(db.orders[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    if (getIsConnected()) {
      await Order.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Order deleted from MongoDB' });
    }

    const db = readDb();
    db.orders = db.orders.filter(o => o.id !== req.params.id);
    writeDb(db);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PAYMENTS CRUD
// -------------------------------------------------------------
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', rejectArabicPayload, async (req, res) => {
  try {
    const { orderId, orderNumber, customer, date, amount, method, reference, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const numAmount = Number(amount);
    const paymentData = {
      orderId: orderId || '',
      orderNumber: orderNumber || 'General',
      customer: customer || 'Shahid Sab',
      date: date || new Date().toISOString().split('T')[0],
      amount: numAmount,
      method: method || 'Bank Transfer',
      reference: reference || 'Wasool',
      notes: notes || ''
    };

    if (getIsConnected()) {
      const newPay = await Payment.create(paymentData);
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.amountReceived = (Number(order.amountReceived) || 0) + numAmount;
          order.balance = (Number(order.totalAmount) || 0) - order.amountReceived;
          await order.save();
        }
      }
      return res.status(201).json({ ...newPay.toObject(), id: newPay._id.toString() });
    }

    const db = readDb();
    const newPay = { id: `pay-${Date.now()}`, ...paymentData };
    db.payments.push(newPay);

    if (orderId) {
      const order = db.orders.find(o => o.id === orderId);
      if (order) {
        order.amountReceived = (Number(order.amountReceived) || 0) + numAmount;
        order.balance = (Number(order.totalAmount) || 0) - order.amountReceived;
      }
    }

    writeDb(db);
    res.status(201).json(newPay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    if (getIsConnected()) {
      const pay = await Payment.findById(req.params.id);
      if (pay && pay.orderId) {
        const order = await Order.findById(pay.orderId);
        if (order) {
          order.amountReceived = Math.max(0, (Number(order.amountReceived) || 0) - (Number(pay.amount) || 0));
          order.balance = (Number(order.totalAmount) || 0) - order.amountReceived;
          await order.save();
        }
      }
      await Payment.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Payment deleted from MongoDB' });
    }

    const db = readDb();
    const pay = (db.payments || []).find(p => p.id === req.params.id);
    if (pay && pay.orderId) {
      const order = db.orders.find(o => o.id === pay.orderId);
      if (order) {
        order.amountReceived = Math.max(0, (Number(order.amountReceived) || 0) - (Number(pay.amount) || 0));
        order.balance = (Number(order.totalAmount) || 0) - order.amountReceived;
      }
    }
    db.payments = db.payments.filter(p => p.id !== req.params.id);
    writeDb(db);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// CARTON LABELS CRUD
// -------------------------------------------------------------
app.get('/api/labels', async (req, res) => {
  try {
    const labels = await getAllLabels();
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labels', rejectArabicPayload, async (req, res) => {
  try {
    if (getIsConnected()) {
      const newLabel = await CartonLabel.create(req.body);
      return res.status(201).json({ ...newLabel.toObject(), id: newLabel._id.toString() });
    }
    const db = readDb();
    const newLabel = { id: `lbl-${Date.now()}`, ...req.body };
    db.cartonLabels.push(newLabel);
    writeDb(db);
    res.status(201).json(newLabel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labels/:id', rejectArabicPayload, async (req, res) => {
  try {
    const { id: _ignoredId, _id: _ignoredMongoId, __v, ...cleanBody } = req.body;
    if (getIsConnected()) {
      const updated = await CartonLabel.findByIdAndUpdate(req.params.id, { $set: cleanBody }, { new: true, runValidators: false }).lean();
      if (!updated) return res.status(404).json({ error: 'Label not found' });
      return res.json({ ...updated, id: updated._id.toString() });
    }
    const db = readDb();
    const idx = db.cartonLabels.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Label not found' });
    db.cartonLabels[idx] = { ...db.cartonLabels[idx], ...cleanBody };
    writeDb(db);
    res.json(db.cartonLabels[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MAINTENANCE — URDU / ARABIC SCRIPT CLEANUP
// -------------------------------------------------------------
app.get('/api/maintenance/arabic-scan', async (req, res) => {
  try {
    const orders = await getAllOrders();
    const payments = await getAllPayments();
    const labels = await getAllLabels();

    const fields = [
      ...findArabicFields(orders).map(f => ({ ...f, collection: 'orders' })),
      ...findArabicFields(payments).map(f => ({ ...f, collection: 'payments' })),
      ...findArabicFields(labels).map(f => ({ ...f, collection: 'labels' }))
    ];

    res.json({ total: fields.length, fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance/arabic-clean', async (req, res) => {
  try {
    const summary = await cleanArabicRecords();
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// FILE EXPORT ENDPOINTS (EXCEL, PDF, WORD DOCX)
// -------------------------------------------------------------

// 1. Export Excel Workbook (.xlsx)
app.get('/api/export/excel', async (req, res) => {
  try {
    const orders = await getAllOrders();
    const payments = await getAllPayments();
    const company = await getCompanyInfo();

    const workbook = await generateFullTrackerWorkbook(orders, payments, company);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Butt_Collection_Order_Tracker.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating Excel:', err);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

// 2. Export Order Sheet as PDF (.pdf)
app.get('/api/export/pdf/order/:id', async (req, res) => {
  try {
    const orders = await getAllOrders();
    const company = await getCompanyInfo();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const buffer = await generateOrderPdfBuffer(order, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${order.orderNumber.replace(/\s+/g, '_')}_Order_Sheet.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Order PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Export Carton Label as PDF (.pdf) with multi-template support
app.get('/api/export/pdf/label/:id', async (req, res) => {
  try {
    const labels = await getAllLabels();
    const company = await getCompanyInfo();
    const label = labels.find(l => l.id === req.params.id);
    if (!label) return res.status(404).json({ error: 'Label not found' });

    const template = req.query.template || 'screenshot_bold';
    const buffer = await generateCartonLabelPdfBuffer(label, company, template);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${label.style || 'Carton'}_Label_${template}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Label PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Export Order as Microsoft Word (.docx)
app.get('/api/export/docx/order/:id', async (req, res) => {
  try {
    const orders = await getAllOrders();
    const company = await getCompanyInfo();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const buffer = await generateOrderDocx(order, company);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${order.orderNumber.replace(/\s+/g, '_')}_Work_Order.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Word document:', err);
    res.status(500).json({ error: 'Failed to generate Word document' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Butt Collection Merchandiser API (MongoDB Enabled)`);
  console.log(` Port: ${PORT} | http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
