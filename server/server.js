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
const {
  generateOrderPdfBuffer,
  generateCartonLabelPdfBuffer,
  generateGatePassPdfBuffer,
  generateGatePassFormPdfBuffer,
  generatePackingListPdfBuffer,
  generateInvoicePdfBuffer,
  generateBankDetailsPdfBuffer
} = require('./services/pdfService');
const {
  generateOrderDocx,
  generateGatePassDocx,
  generatePackingListDocx,
  generateInvoiceDocx
} = require('./services/docxService');
const {
  generateBuyerPackingListPdf,
  generateBuyerInvoicePdf,
  generateBankInvoicePdf
} = require('./services/buyerDocsPdf');
const {
  findArabicFields,
  sanitizeTextFields,
  collectChangedFields
} = require('./utils/arabicScript');
const { formatOrderNumber } = require('./utils/orderNumber');
const { formatGatePassNumber } = require('./utils/gatePass');
const { formatPackingListNumber } = require('./utils/packingList');
const { formatInvoiceNumber } = require('./utils/invoice');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Exported documents (PDF/DOCX) rozana badalte hain — browser cache mein purani
// copy na atke, is liye export routes par caching band hai.
app.use('/api/export', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

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

async function getAllOrders({ includeStandalone = false } = {}) {
  if (getIsConnected()) {
    const query = includeStandalone ? {} : { isStandalone: { $ne: true } };
    const list = await Order.find(query).sort({ orderDate: -1 }).lean();
    return list.map(o => ({ ...o, id: o._id.toString() }));
  }
  const orders = readDb().orders || [];
  return includeStandalone ? orders : orders.filter(o => !o.isStandalone);
}

async function findAnyOrder(id) {
  const all = await getAllOrders({ includeStandalone: true });
  return all.find(o => o.id === id) || null;
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

// -------------------------------------------------------------
// STANDALONE DOCUMENTS (created without an existing order)
// They live in the orders store behind `isStandalone` so the same
// editors, PDF and Word generators can be reused, but they are
// filtered out of every order list / dashboard / Excel export.
// -------------------------------------------------------------
const STANDALONE_TYPES = {
  gatePass: { label: 'Gate Pass', prefix: 'GP' },
  packingList: { label: 'Packing List', prefix: 'PL' },
  invoice: { label: 'Commercial Invoice', prefix: 'INV' }
};

app.get('/api/standalone-documents', async (req, res) => {
  try {
    const all = await getAllOrders({ includeStandalone: true });
    const type = String(req.query.type || '').trim();
    const docs = all
      .filter(o => o.isStandalone)
      .filter(o => !type || o.standaloneType === type)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/standalone-documents', rejectArabicPayload, async (req, res) => {
  try {
    const type = String(req.body.type || '').trim();
    const config = STANDALONE_TYPES[type];
    if (!config) {
      return res.status(400).json({ error: 'type must be gatePass, packingList or invoice' });
    }

    const customer = String(req.body.customer || '').trim() || 'Walk-in Customer';
    const reference = String(req.body.reference || '').trim();

    const all = await getAllOrders({ includeStandalone: true });
    const usedNumbers = all
      .filter(o => o.isStandalone && o.standaloneType === type)
      .map(o => {
        const raw = type === 'gatePass' ? o.gatePassNo : type === 'packingList' ? o.packingListNo : o.invoiceNo;
        const match = String(raw || '').match(/(\d+)/);
        return match ? Number(match[1]) : 0;
      });
    const seq = String(Math.max(0, ...usedNumbers) + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const requestedDate = String(req.body.date || '').trim();
    const docDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today;
    const docNo = `${config.prefix}-${seq}`;

    const base = {
      orderNumber: reference || `MANUAL-${seq}`,
      customer,
      manufacturer: 'Butt Collection',
      dispatchCity: 'Faisalabad',
      orderDate: docDate,
      deadline: '',
      shippedOn: '',
      status: 'In Progress',
      isStandalone: true,
      standaloneType: type,
      totalPieces: 0,
      totalAmount: 0,
      amountReceived: 0,
      balance: 0,
      notes: '',
      docTitle: 'MERCHANDISER WORK ORDER',
      docStatus: '',
      footerLeft: 'Prepared by Merchandiser',
      footerRight: 'Authorized Signature / Factory',
      items: []
    };

    const typeFields = type === 'gatePass'
      ? {
          gatePassNo: docNo,
          gatePassDate: docDate,
          gatePassCustomer: customer,
          gatePassPurpose: 'Dispatch of finished goods',
          gatePassTitle: 'GATE PASS',
          gatePassItems: []
        }
      : type === 'packingList'
        ? { packingListNo: docNo, packingDate: docDate }
        : {
            invoiceNo: docNo,
            invoiceDate: docDate,
            invoiceTerms: 'Payment due on receipt'
          };

    const payload = { ...base, ...typeFields, createdAt: new Date().toISOString() };

    if (getIsConnected()) {
      const created = await Order.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    }

    const db = readDb();
    const record = { id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...payload };
    db.orders = db.orders || [];
    db.orders.push(record);
    writeDb(db);
    res.status(201).json(record);
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
      docTitle = 'MERCHANDISER WORK ORDER',
      docStatus = '',
      footerLeft = 'Prepared by Merchandiser',
      footerRight = 'Authorized Signature / Factory',
      gatePassNo = '',
      gatePassDate = '',
      gatePassVehicle = '',
      gatePassDriver = '',
      gatePassDestination = '',
      gatePassPurpose = 'Dispatch of finished goods',
      gatePassRemarks = '',
      packingListNo = '',
      packingDate = '',
      packingNetWeight = '',
      packingGrossWeight = '',
      packingCartonLength = '',
      packingCartonWidth = '',
      packingCartonHeight = '',
      packingCbm = '',
      packingNotes = '',
      invoiceNo = '',
      invoiceDate = '',
      invoiceTerms = 'Payment due on receipt',
      invoiceBankDetails = '',
      invoiceNotes = '',
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
      docTitle,
      docStatus,
      footerLeft,
      footerRight,
      gatePassNo,
      gatePassDate,
      gatePassVehicle,
      gatePassDriver,
      gatePassDestination,
      gatePassPurpose,
      gatePassRemarks,
      packingListNo,
      packingDate,
      packingNetWeight,
      packingGrossWeight,
      packingCartonLength,
      packingCartonWidth,
      packingCartonHeight,
      packingCbm,
      packingNotes,
      invoiceNo,
      invoiceDate,
      invoiceTerms,
      invoiceBankDetails,
      invoiceNotes,
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
      `${req.query.inline ? 'inline' : 'attachment'}; filename="${order.orderNumber.replace(/\s+/g, '_')}_Order_Sheet.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Order PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Export Dispatch Gate Pass as PDF (.pdf)
app.get('/api/export/pdf/gate-pass/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const layout = String(req.query.layout || 'form').toLowerCase();
    const isForm = layout !== 'legacy';
    const twoPages = ['2pages', 'twopage', 'pages'].includes(layout);
    const isTwoUp = ['landscape-2up', '2up', 'landscape'].includes(layout);
    const isCompact = ['compact', 'short', 'khali'].includes(layout);
    const buffer = isForm
      ? await generateGatePassFormPdfBuffer(order, company, {
          copies: twoPages ? 'pages' : isTwoUp ? 2 : 1,
          blank: req.query.blank === '1' || req.query.blank === 'true',
          compact: isCompact
        })
      : await generateGatePassPdfBuffer(order, company);
    const gateNo = formatGatePassNumber(order).replace(/\s+/g, '_');
    const layoutSuffix = isCompact ? '_Compact' : twoPages ? '_2copies' : isTwoUp ? '_Landscape_2up' : '';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.inline ? 'inline' : 'attachment'}; filename="${gateNo}_Gate_Pass${layoutSuffix}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Gate Pass PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Export Dispatch Gate Pass as Microsoft Word (.docx)
app.get('/api/export/docx/gate-pass/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const buffer = await generateGatePassDocx(order, company);
    const gateNo = formatGatePassNumber(order).replace(/\s+/g, '_');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${gateNo}_Gate_Pass.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Gate Pass Word document:', err);
    res.status(500).json({ error: 'Failed to generate Gate Pass document' });
  }
});

// 5. Export Packing List as PDF (.pdf)
app.get('/api/export/pdf/packing-list/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const format = String(req.query.format || 'form').toLowerCase();
    const buffer = format === 'buyer'
      ? await generateBuyerPackingListPdf(order, company)
      : await generatePackingListPdfBuffer(order, company);
    const listNo = formatPackingListNumber(order).replace(/\s+/g, '_');
    const formatSuffix = format === 'buyer' ? '_Buyer_Format' : '';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.inline ? 'inline' : 'attachment'}; filename="${listNo}_Packing_List${formatSuffix}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Packing List PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Export Packing List as Microsoft Word (.docx)
app.get('/api/export/docx/packing-list/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const buffer = await generatePackingListDocx(order, company);
    const listNo = formatPackingListNumber(order).replace(/\s+/g, '_');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${listNo}_Packing_List.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Packing List Word document:', err);
    res.status(500).json({ error: 'Failed to generate Packing List document' });
  }
});

// 7. Export Commercial Invoice as PDF (.pdf)
app.get('/api/export/pdf/invoice/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const format = String(req.query.format || 'form').toLowerCase();
    const layout = String(req.query.layout || 'form').toLowerCase();
    let buffer;
    let formatSuffix = '';
    if (format === 'buyer') {
      buffer = await generateBuyerInvoicePdf(order, company);
      formatSuffix = '_Buyer_Format';
    } else if (format === 'bank') {
      buffer = await generateBankInvoicePdf(order, company);
      formatSuffix = '_Bank_Format';
    } else {
      const copies = layout === 'landscape-2up' || layout === '2up' || layout === 'landscape' ? 2 : 1;
      buffer = await generateInvoicePdfBuffer(order, company, { copies });
      formatSuffix = copies === 2 ? '_Landscape_2up' : '';
    }
    const invoiceNo = formatInvoiceNumber(order).replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.inline ? 'inline' : 'attachment'}; filename="${invoiceNo}_Invoice${formatSuffix}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Invoice PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Export Commercial Invoice as Microsoft Word (.docx)
app.get('/api/export/docx/invoice/:id', async (req, res) => {
  try {
    const order = await findAnyOrder(req.params.id);
    const company = await getCompanyInfo();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const buffer = await generateInvoiceDocx(order, company);
    const invoiceNo = formatInvoiceNumber(order).replace(/\s+/g, '_');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoiceNo}_Invoice.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Invoice Word document:', err);
    res.status(500).json({ error: 'Failed to generate Invoice document' });
  }
});

// 9. Export Carton Label as PDF (.pdf) with multi-template support
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
      `${req.query.inline ? 'inline' : 'attachment'}; filename="${label.style || 'Carton'}_Label_${template}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Label PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Bank / Payment Details one-pager (client ko bhejne ke liye)
app.get('/api/export/pdf/bank-details', async (req, res) => {
  try {
    const company = await getCompanyInfo();
    const buffer = await generateBankDetailsPdfBuffer(company, {
      ref: req.query.ref,
      amount: req.query.amount,
      currency: req.query.currency
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.inline ? 'inline' : 'attachment'}; filename="Butt_Collection_Bank_Payment_Details.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    console.error('Error generating Bank Details PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Export Order as Microsoft Word (.docx)
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
