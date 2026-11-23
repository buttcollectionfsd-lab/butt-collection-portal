/**
 * Excel Export Service using ExcelJS
 * Generates styled spreadsheets matching the exact 5 orders of Shahid Sahib
 */
const ExcelJS = require('exceljs');

async function generateFullTrackerWorkbook(orders, payments, company) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = company?.name || 'Butt Collection';
  workbook.created = new Date();

  // Filter only valid orders (total 5 orders)
  const validOrders = (orders || []).filter(o => o.orderNumber);

  // -------------------------------------------------------------
  // Sheet 1: ORDER TRACKER
  // -------------------------------------------------------------
  const trackerSheet = workbook.addWorksheet('Order Tracker', {
    views: [{ showGridLines: true }]
  });

  // Title Row
  trackerSheet.mergeCells('A1:J1');
  const titleCell = trackerSheet.getCell('A1');
  titleCell.value = `${company?.name || 'BUTT COLLECTION'} - MERCHANDISER SHIPMENT & ORDER TRACKER`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  trackerSheet.getRow(1).height = 36;

  // Dashboard Summary Cards Row 3-4
  const totalOrders = validOrders.length;
  const shippedOrders = validOrders.filter(o => o.status === 'Shipped').length;
  const inProgressOrders = validOrders.filter(o => o.status === 'In Progress').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const lateOrders = validOrders.filter(o => {
    if (o.status === 'Shipped') return false;
    return o.deadline && o.deadline < todayStr;
  }).length;

  const cards = [
    { range: 'B3:C4', title: 'TOTAL ORDERS', val: totalOrders, color: 'FF4F81BD' },
    { range: 'D3:E4', title: 'SHIPPED', val: shippedOrders, color: 'FF4FBD6E' },
    { range: 'F3:G4', title: 'IN PROGRESS', val: inProgressOrders, color: 'FFF2A900' },
    { range: 'H3:I4', title: 'LATE / ATTENTION', val: lateOrders, color: 'FFC00000' }
  ];

  cards.forEach(card => {
    trackerSheet.mergeCells(card.range);
    const cell = trackerSheet.getCell(card.range.split(':')[0]);
    cell.value = `${card.title}\n${card.val}`;
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.color } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  trackerSheet.getRow(3).height = 20;
  trackerSheet.getRow(4).height = 20;

  // Tracker Table Headers (Row 6)
  const trackerHeaders = [
    'Order #', 'Customer / Buyer', 'Items / Styles in this Order', 'Total Pieces', 'Cartons',
    'Order Date', 'Deadline', 'Shipped On', 'Status', 'Balance (£)'
  ];
  const hRow = trackerSheet.getRow(6);
  hRow.values = trackerHeaders;
  hRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  hRow.alignment = { vertical: 'middle', horizontal: 'center' };
  hRow.height = 25;

  for (let c = 1; c <= trackerHeaders.length; c++) {
    hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF243F60' } };
    hRow.getCell(c).border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' }
    };
  }

  // Populate Tracker Rows
  let currentRow = 7;
  validOrders.forEach(order => {
    const row = trackerSheet.getRow(currentRow);
    const itemsSummary = (order.items || []).map(i => `${i.style} (${i.qty})`).join(', ') || 'N/A';
    const totalCartons = (order.items || []).reduce((sum, i) => sum + (Number(i.cartons) || 0), 0);

    row.values = [
      order.orderNumber,
      order.customer,
      itemsSummary,
      order.totalPieces || 0,
      totalCartons > 0 ? totalCartons : '-',
      order.orderDate || '',
      order.deadline || '',
      order.shippedOn || '-',
      order.status,
      order.balance || 0
    ];

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(9).alignment = { horizontal: 'center' };
    row.getCell(10).alignment = { horizontal: 'right' };
    row.getCell(10).numFmt = '£#,##0.00';

    const statusCell = row.getCell(9);
    statusCell.font = { bold: true };
    if (order.status === 'Shipped') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      statusCell.font = { color: { argb: 'FF385723' }, bold: true };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      statusCell.font = { color: { argb: 'FFB25900' }, bold: true };
    }

    for (let c = 1; c <= trackerHeaders.length; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      };
    }
    currentRow++;
  });

  trackerSheet.columns = [
    { width: 14 }, { width: 20 }, { width: 45 }, { width: 14 }, { width: 12 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 }
  ];

  // -------------------------------------------------------------
  // Sheet 2: ORDER DETAILS & ALL LINE ITEMS (Every line item)
  // -------------------------------------------------------------
  const detailsSheet = workbook.addWorksheet('Order Details', {
    views: [{ showGridLines: true }]
  });

  detailsSheet.mergeCells('A1:J1');
  const dTitle = detailsSheet.getCell('A1');
  dTitle.value = 'PRODUCTION & ORDER LINE ITEMS BREAKDOWN (EVERY LINE ITEM)';
  dTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  detailsSheet.getRow(1).height = 30;

  const dHeaders = [
    'Order #', 'Order Date', 'Customer', 'Style / Item Name (from Notebook)', 'GSM / Fabric', 'Color',
    'Qty (Pcs)', 'Rate (£)', 'Amount (£)', 'Notes'
  ];
  const dHRow = detailsSheet.getRow(3);
  dHRow.values = dHeaders;
  dHRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dHRow.height = 24;
  for (let c = 1; c <= dHeaders.length; c++) {
    dHRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
    dHRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  }

  let dCurrentRow = 4;
  validOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const row = detailsSheet.getRow(dCurrentRow);
      row.values = [
        order.orderNumber,
        order.orderDate || '',
        order.customer,
        item.style,
        item.gsm || '-',
        item.color || 'Assorted',
        Number(item.qty) || 0,
        Number(item.rate) || 0,
        Number(item.amount) || 0,
        order.notes || ''
      ];

      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '£#,##0.00';
      row.getCell(9).numFmt = '£#,##0.00';

      for (let c = 1; c <= dHeaders.length; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      }
      dCurrentRow++;
    });
  });

  detailsSheet.columns = [
    { width: 14 }, { width: 14 }, { width: 18 }, { width: 42 }, { width: 14 },
    { width: 16 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 35 }
  ];

  // -------------------------------------------------------------
  // Sheet 3: PAYMENT LEDGER
  // -------------------------------------------------------------
  const ledgerSheet = workbook.addWorksheet('Payment Ledger', {
    views: [{ showGridLines: true }]
  });

  ledgerSheet.mergeCells('A1:G1');
  const lTitle = ledgerSheet.getCell('A1');
  lTitle.value = 'MERCHANDISER PAYMENT LEDGER (WASOOL / BAKAYA KHATA)';
  lTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  lTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4E38' } };
  lTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  ledgerSheet.getRow(1).height = 32;

  // Financial totals cards
  const totalBilled = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalReceived = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = totalBilled - totalReceived;

  ledgerSheet.mergeCells('A3:B4');
  ledgerSheet.getCell('A3').value = `TOTAL BILLED\n£${totalBilled.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  ledgerSheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
  ledgerSheet.getCell('A3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ledgerSheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  ledgerSheet.mergeCells('C3:D4');
  ledgerSheet.getCell('C3').value = `TOTAL RECEIVED (WASOOL)\n£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  ledgerSheet.getCell('C3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4FBD6E' } };
  ledgerSheet.getCell('C3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ledgerSheet.getCell('C3').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  ledgerSheet.mergeCells('E3:F4');
  ledgerSheet.getCell('E3').value = `BALANCE DUE (BAKAYA)\n£${balanceDue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  ledgerSheet.getCell('E3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
  ledgerSheet.getCell('E3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ledgerSheet.getCell('E3').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Payments Table (Row 6)
  const pHeaders = ['Date', 'Customer', 'Order #', 'Payment (Wasool £)', 'Method', 'Reference / Slip', 'Notes'];
  const pHRow = ledgerSheet.getRow(6);
  pHRow.values = pHeaders;
  pHRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  pHRow.height = 24;
  for (let c = 1; c <= pHeaders.length; c++) {
    pHRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4E38' } };
    pHRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  }

  let pCurrentRow = 7;
  (payments || []).forEach(pay => {
    const row = ledgerSheet.getRow(pCurrentRow);
    row.values = [
      pay.date,
      pay.customer,
      pay.orderNumber || '-',
      Number(pay.amount) || 0,
      pay.method || 'Bank Transfer',
      pay.reference || '',
      pay.notes || ''
    ];
    row.getCell(4).numFmt = '£#,##0.00';
    row.getCell(4).font = { bold: true, color: { argb: 'FF1E4E38' } };

    for (let c = 1; c <= pHeaders.length; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
    pCurrentRow++;
  });

  ledgerSheet.columns = [
    { width: 14 }, { width: 20 }, { width: 14 }, { width: 22 }, { width: 18 }, { width: 24 }, { width: 35 }
  ];

  return workbook;
}

module.exports = {
  generateFullTrackerWorkbook
};
