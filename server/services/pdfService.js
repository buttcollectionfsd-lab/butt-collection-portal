/**
 * PDF Generation Service using PDFKit
 * Generates Order Work Orders and 4 Distinct Carton Label Templates:
 * 1. 'screenshot_bold' (DEFAULT - Exact replica of user screenshot: Double border, SP Imports, Style Set, Table, Bottom Left TOTAL SETS, Bottom Right CTN# box)
 * 2. 'classic_box' (Design 1: Header description + top right CTN# box + full width bottom total)
 * 3. 'minimal_clean' (Design 3: Rounded corners, horizontal lines, modern minimalist typography)
 * 4. 'top_ctn' (Design 4: Large CTN# box on very top, dual buyer/sets middle box, sizing table, bottom total)
 */
const PDFDocument = require('pdfkit');
const { getGatePassMeta, getGatePassTotals } = require('../utils/gatePass');
const { getPackingTotals } = require('../utils/packingList');
const { getInvoiceMeta } = require('../utils/invoice');
const { getCompanyAddress } = require('../utils/companyInfo');

function generateOrderPdfBuffer(order, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.rect(40, 40, 515, 65).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text(company?.name || 'BUTT COLLECTION', 55, 52);
      doc.fontSize(10).font('Helvetica').text(`${company?.tagline || 'Garment Manufacturing & Exports'} | Faisalabad, Pakistan`, 55, 76);
      doc.fontSize(7.5).font('Helvetica').text(getCompanyAddress(company), 55, 89, { width: 250 });
      const docTitle = order.docTitle ?? 'MERCHANDISER WORK ORDER';
      const docTitleSize = docTitle.length > 34 ? 9 : docTitle.length > 24 ? 10 : 12;
      doc.fontSize(docTitleSize).font('Helvetica-Bold').text(docTitle, 300, 52, { align: 'right', width: 235 });
      const docStatus = (order.docStatus || '').trim().slice(0, 28);
      if (docStatus) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FDE68A').text(docStatus.toUpperCase(), 300, 68, { align: 'right', width: 235 });
      }
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 350, 84, { align: 'right', width: 190 });

      // Order Details Box
      let y = 120;
      doc.rect(40, y, 515, 75).strokeColor('#CBD5E1').lineWidth(1).stroke();

      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold');
      doc.text('Order #:', 50, y + 10);
      doc.text('Customer / Buyer:', 50, y + 25);
      doc.text('Order Date:', 50, y + 40);
      doc.text('Deadline:', 50, y + 55);

      doc.font('Helvetica');
      doc.text(order.orderNumber, 150, y + 10);
      doc.text(order.customer, 150, y + 25);
      doc.text(order.orderDate || 'N/A', 150, y + 40);
      doc.text(order.deadline || 'N/A', 150, y + 55);

      doc.font('Helvetica-Bold');
      doc.text('Manufacturer:', 320, y + 10);
      doc.text('Dispatch City:', 320, y + 25);
      doc.text('Status:', 320, y + 40);
      doc.text('Shipped On:', 320, y + 55);

      doc.font('Helvetica');
      doc.text(order.manufacturer || 'Butt Collection', 410, y + 10);
      doc.text(order.dispatchCity || 'Faisalabad', 410, y + 25);

      const statusColor = order.status === 'Shipped' ? '#16A34A' : '#D97706';
      doc.fillColor(statusColor).font('Helvetica-Bold').text(order.status.toUpperCase(), 410, y + 40);
      doc.fillColor('#1E293B').font('Helvetica').text(order.shippedOn || '-', 410, y + 55);

      // Items Table Header
      y = 210;
      doc.rect(40, y, 515, 24).fill('#2563EB');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('STYLE / DESCRIPTION', 48, y + 7, { width: 140 });
      doc.text('GSM', 195, y + 7, { width: 40, align: 'center' });
      doc.text('COLOR', 240, y + 7, { width: 65 });
      doc.text('CARTONS', 310, y + 7, { width: 50, align: 'right' });
      doc.text('QTY (PCS)', 365, y + 7, { width: 50, align: 'right' });
      doc.text('RATE (£)', 420, y + 7, { width: 55, align: 'right' });
      doc.text('AMOUNT (£)', 480, y + 7, { width: 65, align: 'right' });

      // Rows
      y += 24;
      let totalQty = 0;
      let totalAmount = 0;
      (order.items || []).forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(40, y, 515, 22).fill('#F8FAFC');
        }
        doc.rect(40, y, 515, 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
        doc.text(item.style, 48, y + 6, { width: 140 });
        doc.font('Helvetica');
        doc.text(item.gsm || '-', 195, y + 6, { width: 40, align: 'center' });
        doc.text(item.color || 'Assorted', 240, y + 6, { width: 65 });
        doc.text(String(item.cartons || '-'), 310, y + 6, { width: 50, align: 'right' });
        doc.text(Number(item.qty || 0).toLocaleString(), 365, y + 6, { width: 50, align: 'right' });
        doc.text(`£${Number(item.rate || 0).toFixed(2)}`, 420, y + 6, { width: 55, align: 'right' });
        doc.text(`£${Number(item.amount || 0).toFixed(2)}`, 480, y + 6, { width: 65, align: 'right' });

        totalQty += Number(item.qty || 0);
        totalAmount += Number(item.amount || 0);
        y += 22;
      });

      // Table Totals
      doc.rect(40, y, 515, 24).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL PIECES & ORDER VALUE:', 48, y + 7);
      doc.text(totalQty.toLocaleString(), 365, y + 7, { width: 50, align: 'right' });
      doc.text(`£${totalAmount.toFixed(2)}`, 480, y + 7, { width: 65, align: 'right' });

      // Size Breakdown Matrix if present
      y += 40;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('SIZE & RATIO BREAKDOWN (PCS)', 40, y);
      y += 18;
      doc.rect(40, y, 515, 20).fill('#3B82F6');
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
      doc.text('ITEM / STYLE', 45, y + 5, { width: 150 });
      doc.text('XS', 200, y + 5, { width: 45, align: 'center' });
      doc.text('S', 255, y + 5, { width: 45, align: 'center' });
      doc.text('M', 310, y + 5, { width: 45, align: 'center' });
      doc.text('L', 365, y + 5, { width: 45, align: 'center' });
      doc.text('XL', 420, y + 5, { width: 45, align: 'center' });
      doc.text('TOTAL', 475, y + 5, { width: 65, align: 'center' });

      y += 20;
      (order.items || []).forEach(item => {
        const sb = item.sizeBreakdown || {};
        const itemTotal = (Number(sb.xs) || 0) + (Number(sb.s) || 0) + (Number(sb.m) || 0) + (Number(sb.l) || 0) + (Number(sb.xl) || 0);
        doc.rect(40, y, 515, 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
        doc.text(item.style, 45, y + 4, { width: 150 });
        doc.text(String(sb.xs || 0), 200, y + 4, { width: 45, align: 'center' });
        doc.text(String(sb.s || 0), 255, y + 4, { width: 45, align: 'center' });
        doc.text(String(sb.m || 0), 310, y + 4, { width: 45, align: 'center' });
        doc.text(String(sb.l || 0), 365, y + 4, { width: 45, align: 'center' });
        doc.text(String(sb.xl || 0), 420, y + 4, { width: 45, align: 'center' });
        doc.font('Helvetica-Bold').text(String(itemTotal || item.qty), 475, y + 4, { width: 65, align: 'center' });
        y += 18;
      });

      // Financial Summary Box
      y += 25;
      doc.rect(40, y, 515, 60).fill('#F1F5F9');
      doc.rect(40, y, 515, 60).strokeColor('#94A3B8').lineWidth(1).stroke();

      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Order Value:  £${Number(order.totalAmount || totalAmount).toFixed(2)}`, 55, y + 12);
      doc.text(`Received:  £${Number(order.amountReceived || 0).toFixed(2)}`, 55, y + 26);
      doc.fillColor('#DC2626').text(`Balance Due:  £${Number(order.balance || (totalAmount - (order.amountReceived || 0))).toFixed(2)}`, 55, y + 40);

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica');
      doc.text(`Notes: ${order.notes || 'None'}`, 300, y + 12, { width: 240 });

      // Signature Block
      y += 80;
      doc.strokeColor('#CBD5E1').lineWidth(1);
      doc.moveTo(60, y + 20).lineTo(200, y + 20).stroke();
      doc.moveTo(350, y + 20).lineTo(490, y + 20).stroke();
      doc.fillColor('#64748B').fontSize(9).font('Helvetica');
      doc.text(order.footerLeft ?? 'Prepared by Merchandiser', 60, y + 25, { width: 140, align: 'center' });
      doc.text(order.footerRight ?? 'Authorized Signature / Factory', 350, y + 25, { width: 140, align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Multi-Template Carton Label PDF Generator
 * Exactly reproduces the user's uploaded screenshot as default!
 */
function generateCartonLabelPdfBuffer(label, company, templateId = 'screenshot_bold') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 25, size: 'A4' });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const rows = label.rows && label.rows.length > 0 ? label.rows : [
        { color: 'Black', xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 },
        { color: 'Gray', xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 }
      ];

      const perCartonSum = rows.reduce((sum, r) => {
        const rowTot = (Number(r.xs) || 0) + (Number(r.s) || 0) + (Number(r.m) || 0) + (Number(r.l) || 0) + (Number(r.xl) || 0);
        return sum + (r.total || rowTot);
      }, 0);

      const totalSetsNum = label.setsPerCarton || perCartonSum || 30;

      // -------------------------------------------------------------
      // TEMPLATE 1: SCREENSHOT BOLD (DEFAULT)
      // Exactly matches the user's uploaded screenshot!
      // Double border, SP IMPORTS, line, STYLE SET, line, table,
      // bottom left TOTAL XX SETS box, bottom right CTN # box.
      // -------------------------------------------------------------
      if (templateId === 'screenshot_bold') {
        // Outer Double Border
        doc.rect(35, 35, 525, 770).lineWidth(4.5).strokeColor('#000000').stroke();
        doc.rect(42, 42, 511, 756).lineWidth(1.5).strokeColor('#000000').stroke();

        // Buyer Header: SP IMPORTS
        doc.fillColor('#000000').fontSize(34).font('Helvetica-Bold')
          .text((label.buyer || 'SP IMPORTS').toUpperCase(), 42, 68, { align: 'center', width: 511 });

        // First horizontal dividing line
        doc.lineWidth(2.5).strokeColor('#000000').moveTo(70, 115).lineTo(525, 115).stroke();

        // Style Title: e.g. ALOO7 SET
        const styleText = label.style ? (label.style.toUpperCase().endsWith('SET') ? label.style.toUpperCase() : `${label.style.toUpperCase()} SET`) : 'ALOO7 SET';
        doc.fontSize(36).font('Helvetica-Bold')
          .text(styleText, 42, 132, { align: 'center', width: 511 });

        // Second horizontal dividing line
        doc.lineWidth(2.5).strokeColor('#000000').moveTo(70, 185).lineTo(525, 185).stroke();

        // Sizing Table (Centered, width = 450, x = 72.5)
        const tableX = 72.5;
        const tableW = 450;
        let tableY = 225;

        const colW = {
          color: 85,
          xs: 50,
          s: 50,
          m: 50,
          l: 50,
          xl: 50,
          total: 65
        };

        // Table Header
        const headerH = 48;
        doc.rect(tableX, tableY, tableW, headerH).lineWidth(2).strokeColor('#000000').stroke();

        // Vertical lines for header
        let curX = tableX;
        [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
          curX += w;
          doc.moveTo(curX, tableY).lineTo(curX, tableY + headerH).stroke();
        });

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text('COLOUR', tableX, tableY + 18, { width: colW.color, align: 'center' });
        doc.text('XS', tableX + colW.color, tableY + 18, { width: colW.xs, align: 'center' });
        doc.text('S', tableX + colW.color + colW.xs, tableY + 18, { width: colW.s, align: 'center' });
        doc.text('M', tableX + colW.color + colW.xs + colW.s, tableY + 18, { width: colW.m, align: 'center' });
        doc.text('L', tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 18, { width: colW.l, align: 'center' });
        doc.text('XL', tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 18, { width: colW.xl, align: 'center' });
        doc.text('TOTAL', tableX + tableW - colW.total, tableY + 18, { width: colW.total, align: 'center' });

        tableY += headerH;

        // Table Data Rows
        const rowH = 65;
        rows.forEach(r => {
          const rowTot = (Number(r.xs) || 0) + (Number(r.s) || 0) + (Number(r.m) || 0) + (Number(r.l) || 0) + (Number(r.xl) || 0);
          const displayTotal = r.total || rowTot;

          doc.rect(tableX, tableY, tableW, rowH).lineWidth(2).strokeColor('#000000').stroke();

          // Vertical dividers
          let rCurX = tableX;
          [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
            rCurX += w;
            doc.moveTo(rCurX, tableY).lineTo(rCurX, tableY + rowH).stroke();
          });

          // Color Label
          doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold');
          doc.text(r.color || 'Black', tableX, tableY + 24, { width: colW.color, align: 'center' });

          // Big Bold Numbers
          doc.fontSize(24).font('Helvetica-Bold');
          doc.text(String(r.xs || 0), tableX + colW.color, tableY + 20, { width: colW.xs, align: 'center' });
          doc.text(String(r.s || 0), tableX + colW.color + colW.xs, tableY + 20, { width: colW.s, align: 'center' });
          doc.text(String(r.m || 0), tableX + colW.color + colW.xs + colW.s, tableY + 20, { width: colW.m, align: 'center' });
          doc.text(String(r.l || 0), tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 20, { width: colW.l, align: 'center' });
          doc.text(String(r.xl || 0), tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 20, { width: colW.xl, align: 'center' });
          doc.text(String(displayTotal), tableX + tableW - colW.total, tableY + 20, { width: colW.total, align: 'center' });

          tableY += rowH;
        });

        // Bottom Section: Two Boxes Side-by-Side (Matching Screenshot!)
        const bottomY = tableY + 28;
        const leftBoxW = 190;
        const gap = 16;
        const rightBoxX = tableX + leftBoxW + gap;
        const rightBoxW = tableW - leftBoxW - gap;
        const bottomH = 130;

        // Left Box: TOTAL / XX SETS
        doc.rect(tableX, bottomY, leftBoxW, bottomH).lineWidth(2.5).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
          .text('TOTAL', tableX, bottomY + 25, { width: leftBoxW, align: 'center' });
        doc.fontSize(28).font('Helvetica-Bold')
          .text(`${totalSetsNum} SETS`, tableX, bottomY + 60, { width: leftBoxW, align: 'center' });

        // Right Box: CTN # Header + Blank Stamping Area
        doc.rect(rightBoxX, bottomY, rightBoxW, bottomH).lineWidth(2.5).strokeColor('#000000').stroke();
        
        // Header partition inside right box
        doc.rect(rightBoxX, bottomY, rightBoxW, 35).lineWidth(2).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
          .text('CTN #', rightBoxX, bottomY + 10, { width: rightBoxW, align: 'center' });

        // Lower area inside right box is left completely blank for writing / stamping
        if (label.cartonNo && label.cartonNo !== '1 OF 4') {
          doc.fontSize(20).font('Helvetica-Bold')
            .text(label.cartonNo, rightBoxX, bottomY + 65, { width: rightBoxW, align: 'center' });
        }
      }

      // -------------------------------------------------------------
      // TEMPLATE 2: CLASSIC BOX (Design 1)
      // Top header with description + top right CTN# box + full width bottom total
      // -------------------------------------------------------------
      else if (templateId === 'classic_box') {
        doc.rect(35, 35, 525, 770).lineWidth(4).strokeColor('#000000').stroke();
        doc.rect(42, 42, 511, 756).lineWidth(1.5).strokeColor('#000000').stroke();

        // SP IMPORTS
        doc.fillColor('#000000').fontSize(32).font('Helvetica-Bold')
          .text((label.buyer || 'SP IMPORTS').toUpperCase(), 70, 65);
        doc.lineWidth(2).moveTo(70, 105).lineTo(525, 105).stroke();

        // Left: DESCRIPTION / ALOO7 Set
        doc.fontSize(11).font('Helvetica-Bold').text('DESCRIPTION', 70, 125);
        doc.fontSize(32).font('Helvetica-Bold').text(label.style || 'ALOO7 Set', 70, 145);

        // Right: CTN # Box
        doc.rect(360, 120, 165, 80).lineWidth(2).stroke();
        doc.rect(360, 120, 165, 24).fill('#000000');
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold')
          .text('CTN #', 360, 126, { width: 165, align: 'center' });

        // Sizing Table
        const tableX = 70;
        const tableW = 455;
        let tableY = 230;
        const colW = { color: 85, xs: 50, s: 50, m: 50, l: 50, xl: 50, total: 70 };

        doc.rect(tableX, tableY, tableW, 45).lineWidth(2).strokeColor('#000000').stroke();
        let curX = tableX;
        [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
          curX += w;
          doc.moveTo(curX, tableY).lineTo(curX, tableY + 45).stroke();
        });

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text('COLOUR', tableX, tableY + 16, { width: colW.color, align: 'center' });
        doc.text('XS', tableX + colW.color, tableY + 16, { width: colW.xs, align: 'center' });
        doc.text('S', tableX + colW.color + colW.xs, tableY + 16, { width: colW.s, align: 'center' });
        doc.text('M', tableX + colW.color + colW.xs + colW.s, tableY + 16, { width: colW.m, align: 'center' });
        doc.text('L', tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 16, { width: colW.l, align: 'center' });
        doc.text('XL', tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 16, { width: colW.xl, align: 'center' });
        doc.text('TOTAL', tableX + tableW - colW.total, tableY + 16, { width: colW.total, align: 'center' });

        tableY += 45;
        rows.forEach(r => {
          const rowTot = (Number(r.xs) || 0) + (Number(r.s) || 0) + (Number(r.m) || 0) + (Number(r.l) || 0) + (Number(r.xl) || 0);
          doc.rect(tableX, tableY, tableW, 60).lineWidth(2).strokeColor('#000000').stroke();
          let rCurX = tableX;
          [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
            rCurX += w;
            doc.moveTo(rCurX, tableY).lineTo(rCurX, tableY + 60).stroke();
          });

          doc.fillColor('#000000').fontSize(15).font('Helvetica-Bold')
            .text(r.color || 'Black', tableX, tableY + 22, { width: colW.color, align: 'center' });
          doc.fontSize(22).font('Helvetica-Bold');
          doc.text(String(r.xs || 0), tableX + colW.color, tableY + 20, { width: colW.xs, align: 'center' });
          doc.text(String(r.s || 0), tableX + colW.color + colW.xs, tableY + 20, { width: colW.s, align: 'center' });
          doc.text(String(r.m || 0), tableX + colW.color + colW.xs + colW.s, tableY + 20, { width: colW.m, align: 'center' });
          doc.text(String(r.l || 0), tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 20, { width: colW.l, align: 'center' });
          doc.text(String(r.xl || 0), tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 20, { width: colW.xl, align: 'center' });
          doc.text(String(r.total || rowTot), tableX + tableW - colW.total, tableY + 20, { width: colW.total, align: 'center' });
          tableY += 60;
        });

        // Bottom Double-Boxed TOTAL: 30 SETS
        const bY = tableY + 35;
        doc.rect(tableX, bY, tableW, 70).lineWidth(3).strokeColor('#000000').stroke();
        doc.rect(tableX + 4, bY + 4, tableW - 8, 62).lineWidth(1).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold')
          .text(`TOTAL: ${totalSetsNum} SETS`, tableX, bY + 20, { width: tableW, align: 'center' });
      }

      // -------------------------------------------------------------
      // TEMPLATE 3: MINIMAL ROUNDED (Design 3)
      // Rounded outer border, minimalist ruled lines, modern aesthetic
      // -------------------------------------------------------------
      else if (templateId === 'minimal_clean') {
        doc.roundedRect(40, 40, 515, 760, 24).lineWidth(2.5).strokeColor('#000000').stroke();

        // Header: SP IMPORTS & CTN #
        doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold').text(label.buyer || 'SP IMPORTS', 75, 75);
        doc.fontSize(14).font('Helvetica-Bold').text('CTN #  __________', 355, 82);
        doc.lineWidth(1).moveTo(75, 110).lineTo(520, 110).stroke();

        // Style Title
        doc.fontSize(11).font('Helvetica-Bold').text('STYLE', 75, 135);
        doc.fontSize(38).font('Helvetica-Bold').text(label.style ? `${label.style} Set` : 'ALOO7 Set', 75, 155);
        doc.lineWidth(2).moveTo(75, 215).lineTo(520, 215).stroke();

        // Table Header
        let tY = 245;
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('COLOUR', 75, tY, { width: 90 });
        doc.text('XS', 180, tY, { width: 45, align: 'center' });
        doc.text('S', 235, tY, { width: 45, align: 'center' });
        doc.text('M', 290, tY, { width: 45, align: 'center' });
        doc.text('L', 345, tY, { width: 45, align: 'center' });
        doc.text('XL', 400, tY, { width: 45, align: 'center' });
        doc.text('TOTAL', 455, tY, { width: 65, align: 'center' });

        doc.lineWidth(1.5).moveTo(75, tY + 20).lineTo(520, tY + 20).stroke();
        tY += 25;

        // Table Rows with ruled lines
        rows.forEach(r => {
          const rowTot = (Number(r.xs) || 0) + (Number(r.s) || 0) + (Number(r.m) || 0) + (Number(r.l) || 0) + (Number(r.xl) || 0);
          tY += 20;
          doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold').text(r.color || 'Black', 75, tY, { width: 90 });
          doc.fontSize(22).font('Helvetica-Bold');
          doc.text(String(r.xs || 0), 180, tY - 4, { width: 45, align: 'center' });
          doc.text(String(r.s || 0), 235, tY - 4, { width: 45, align: 'center' });
          doc.text(String(r.m || 0), 290, tY - 4, { width: 45, align: 'center' });
          doc.text(String(r.l || 0), 345, tY - 4, { width: 45, align: 'center' });
          doc.text(String(r.xl || 0), 400, tY - 4, { width: 45, align: 'center' });
          doc.text(String(r.total || rowTot), 455, tY - 4, { width: 65, align: 'center' });

          tY += 35;
          doc.lineWidth(1).moveTo(75, tY).lineTo(520, tY).stroke();
        });

        // Bottom Grand Total
        tY += 45;
        doc.fontSize(16).font('Helvetica-Bold').text('TOTAL', 75, tY + 10);
        doc.fontSize(40).font('Helvetica-Bold').text(`${totalSetsNum} SETS`, 250, tY - 8, { width: 270, align: 'right' });
        doc.lineWidth(1.5).moveTo(75, tY + 45).lineTo(520, tY + 45).stroke();
      }

      // -------------------------------------------------------------
      // TEMPLATE 4: TOP CTN MASTER (Design 4)
      // Large CTN # box at very top, dual boxes for buyer & sets
      // -------------------------------------------------------------
      else if (templateId === 'top_ctn') {
        doc.rect(35, 35, 525, 770).lineWidth(3).strokeColor('#000000').stroke();

        // Top Box: CTN #
        doc.rect(60, 60, 475, 80).lineWidth(2).stroke();
        doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold').text('CTN #  ________________________', 80, 85);

        // Second Row: Left Box (Buyer & Style) + Right Box (Sets count)
        const midY = 155;
        doc.rect(60, midY, 320, 75).lineWidth(2).stroke();
        doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold').text(label.buyer || 'SP IMPORTS', 75, midY + 12);
        doc.fontSize(22).font('Helvetica-Bold').text(label.style ? `${label.style} Set` : 'ALOO7 Set', 75, midY + 38);

        doc.rect(395, midY, 140, 75).lineWidth(2).stroke();
        doc.fontSize(11).font('Helvetica-Bold').text('SETS', 395, midY + 12, { width: 140, align: 'center' });
        doc.fontSize(32).font('Helvetica-Bold').text(String(totalSetsNum), 395, midY + 30, { width: 140, align: 'center' });

        // Table
        const tableX = 60;
        const tableW = 475;
        let tableY = 250;
        const colW = { color: 95, xs: 52, s: 52, m: 52, l: 52, xl: 52, total: 70 };

        doc.rect(tableX, tableY, tableW, 45).lineWidth(2).stroke();
        let curX = tableX;
        [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
          curX += w;
          doc.moveTo(curX, tableY).lineTo(curX, tableY + 45).stroke();
        });

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text('COLOUR', tableX, tableY + 16, { width: colW.color, align: 'center' });
        doc.text('XS', tableX + colW.color, tableY + 16, { width: colW.xs, align: 'center' });
        doc.text('S', tableX + colW.color + colW.xs, tableY + 16, { width: colW.s, align: 'center' });
        doc.text('M', tableX + colW.color + colW.xs + colW.s, tableY + 16, { width: colW.m, align: 'center' });
        doc.text('L', tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 16, { width: colW.l, align: 'center' });
        doc.text('XL', tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 16, { width: colW.xl, align: 'center' });
        doc.text('TOTAL', tableX + tableW - colW.total, tableY + 16, { width: colW.total, align: 'center' });

        tableY += 45;
        rows.forEach(r => {
          const rowTot = (Number(r.xs) || 0) + (Number(r.s) || 0) + (Number(r.m) || 0) + (Number(r.l) || 0) + (Number(r.xl) || 0);
          doc.rect(tableX, tableY, tableW, 60).lineWidth(2).stroke();
          let rCurX = tableX;
          [colW.color, colW.xs, colW.s, colW.m, colW.l, colW.xl].forEach(w => {
            rCurX += w;
            doc.moveTo(rCurX, tableY).lineTo(rCurX, tableY + 60).stroke();
          });

          doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold').text(r.color || 'Black', tableX, tableY + 20, { width: colW.color, align: 'center' });
          doc.fontSize(22).font('Helvetica-Bold');
          doc.text(String(r.xs || 0), tableX + colW.color, tableY + 18, { width: colW.xs, align: 'center' });
          doc.text(String(r.s || 0), tableX + colW.color + colW.xs, tableY + 18, { width: colW.s, align: 'center' });
          doc.text(String(r.m || 0), tableX + colW.color + colW.xs + colW.s, tableY + 18, { width: colW.m, align: 'center' });
          doc.text(String(r.l || 0), tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 18, { width: colW.l, align: 'center' });
          doc.text(String(r.xl || 0), tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 18, { width: colW.xl, align: 'center' });
          doc.text(String(r.total || rowTot), tableX + tableW - colW.total, tableY + 18, { width: colW.total, align: 'center' });
          tableY += 60;
        });

        // Bottom Box
        const botY = tableY + 30;
        doc.rect(tableX, botY, tableW, 65).lineWidth(2).stroke();
        doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold')
          .text(`TOTAL: ${totalSetsNum} SETS`, tableX, botY + 18, { width: tableW, align: 'center' });
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Dispatch Gate Pass (factory gate / driver hand-over document).
 * Mirrors the approved sample layout: blue header, 8-field meta box,
 * style/GSM/colour/cartons/qty/remarks table, totals + remarks and
 * four signature lines.
 */
function generateGatePassPdfBuffer(order, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const meta = getGatePassMeta(order);
      const totals = getGatePassTotals(order);
      const companyName = meta.companyName || company?.name || 'BUTT COLLECTION';
      const companyTagline = meta.companyTagline
        || `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`;
      const companyAddress = meta.companyAddress || getCompanyAddress(company);

      const drawHeader = () => {
        doc.rect(40, 40, 515, 65).fill('#1E3A8A');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
          .text(companyName, 55, 52);
        doc.fontSize(9).font('Helvetica')
          .text(companyTagline, 55, 77, { width: 260 });
        doc.fontSize(7.5).font('Helvetica')
          .text(companyAddress, 55, 89, { width: 250 });
        doc.fontSize(18).font('Helvetica-Bold')
          .text(meta.title, 300, 52, { align: 'right', width: 235 });
        doc.fontSize(9).font('Helvetica')
          .text(`Generated: ${meta.generatedOn}`, 350, 84, { align: 'right', width: 190 });
      };

      const drawTableHeader = (top) => {
        doc.rect(40, top, 515, 24).fill('#2563EB');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('STYLE / DESCRIPTION', 46, top + 7, { width: 140 });
        doc.text('GSM', 190, top + 7, { width: 42, align: 'center' });
        doc.text('COLOR', 236, top + 7, { width: 72 });
        doc.text('CARTONS', 310, top + 7, { width: 50, align: 'right' });
        doc.text('QTY (PCS)', 365, top + 7, { width: 55, align: 'right' });
        doc.text('REMARKS', 428, top + 7, { width: 120 });
      };

      drawHeader();

      // Meta box (2 columns x 4 rows)
      let y = 120;
      doc.rect(40, y, 515, 82).strokeColor('#CBD5E1').lineWidth(1).stroke();

      const leftRows = [
        ['Gate Pass #:', meta.no],
        ['Date:', meta.date],
        ['Customer / Buyer:', meta.customer || '-'],
        ['Order #:', meta.orderNo || '-']
      ];
      const rightRows = [
        ['Vehicle No.:', meta.vehicleNo || '-'],
        ['Driver Name:', meta.driverName || '-'],
        ['Destination:', meta.destination || '-'],
        ['Purpose:', meta.purpose || '-']
      ];

      leftRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 50, rowY);
        doc.fillColor('#0F172A').font('Helvetica').text(String(value || '-'), 145, rowY, { width: 155, height: 11, ellipsis: true });
      });
      rightRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 315, rowY);
        doc.fillColor('#0F172A').font('Helvetica').fontSize(index === 3 ? 8 : 9)
          .text(String(value || '-'), 405, rowY, { width: 145, height: 11, ellipsis: true });
      });

      // Items table
      y = 216;
      drawTableHeader(y);
      y += 24;

      const items = meta.items;

      let totalCartons = 0;
      let totalQty = 0;

      items.forEach((item, index) => {
        if (y + 24 > 700) {
          doc.addPage();
          drawHeader();
          drawTableHeader(118);
          y = 142;
        }

        if (index % 2 === 0) {
          doc.rect(40, y, 515, 22).fill('#F8FAFC');
        }
        doc.rect(40, y, 515, 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        const cartons = Number(item.cartons) || 0;
        const qty = Number(item.qty) || 0;
        totalCartons += cartons;
        totalQty += qty;

        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
          .text(item.style || '-', 46, y + 6, { width: 140, height: 11, ellipsis: true });
        doc.font('Helvetica').fontSize(8)
          .text(item.gsm || '-', 190, y + 6, { width: 42, align: 'center' })
          .text(item.color || 'Assorted', 236, y + 6, { width: 72, height: 11, ellipsis: true })
          .text(cartons ? String(cartons) : '-', 310, y + 6, { width: 50, align: 'right' })
          .text(qty.toLocaleString(), 365, y + 6, { width: 55, align: 'right' })
          .text(item.remarks || '-', 428, y + 6, { width: 120, height: 11, ellipsis: true });

        y += 22;
      });

      // Table totals
      doc.rect(40, y, 515, 24).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL', 46, y + 7, { width: 220 });
      doc.text(totalCartons ? totalCartons.toLocaleString() : '-', 310, y + 7, { width: 50, align: 'right' });
      doc.text(totalQty.toLocaleString(), 365, y + 7, { width: 55, align: 'right' });
      doc.text('', 428, y + 7, { width: 120 });

      // Totals + remarks summary
      y += 38;
      doc.rect(40, y, 515, 82).strokeColor('#CBD5E1').lineWidth(1).stroke();

      doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
      doc.text('Total Pieces:', 55, y + 14);
      doc.text('Total Cartons:', 55, y + 34);
      doc.text('Remarks:', 280, y + 14);

      doc.fillColor('#0F172A').font('Helvetica');
      doc.text(totalQty.toLocaleString(), 155, y + 14);
      doc.text(totalCartons ? totalCartons.toLocaleString() : '-', 155, y + 34);
      doc.fontSize(8.5).text(meta.remarks || '-', 335, y + 14, { width: 205, height: 58 });

      // Signatures
      let sigY = y + 140;
      if (sigY > 720) {
        doc.addPage();
        drawHeader();
        sigY = 160;
      }

      const signatures = [
        meta.preparedBy,
        meta.gateKeeper,
        meta.receivedBy,
        meta.authorizedBy
      ];

      signatures.forEach((label, index) => {
        const x = 45 + index * 130;
        doc.moveTo(x, sigY).lineTo(x + 110, sigY)
          .lineWidth(0.8).strokeColor('#64748B').stroke();
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
          .text(label, x - 4, sigY + 6, { width: 118, align: 'center' });
      });

      doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
        .text(meta.footerNote, 40, 800, {
          width: 515,
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Packing List: colour/size breakdown + carton details + weight/volume box.
 */
function generatePackingListPdfBuffer(order, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const data = getPackingTotals(order);

      const drawHeader = () => {
        doc.rect(40, 40, 515, 65).fill('#1E3A8A');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
          .text(company?.name || 'BUTT COLLECTION', 55, 51);
        doc.fontSize(8.5).font('Helvetica')
          .text(`${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`, 55, 76, { width: 260 });
        doc.fontSize(7.5).font('Helvetica')
          .text(getCompanyAddress(company), 55, 88, { width: 250 });
        doc.fontSize(16).font('Helvetica-Bold')
          .text('PACKING LIST', 300, 52, { align: 'right', width: 235 });
        doc.fontSize(8.5).font('Helvetica')
          .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 350, 85, { align: 'right', width: 190 });
      };

      drawHeader();

      // Meta box
      let y = 120;
      doc.rect(40, y, 515, 82).strokeColor('#CBD5E1').lineWidth(1).stroke();

      const leftRows = [
        ['Packing List #:', data.no],
        ['Customer / Buyer:', order.customer || '-'],
        ['Order #:', order.orderNumber || '-'],
        ['Order Date:', order.orderDate || '-']
      ];
      const rightRows = [
        ['Manufacturer:', order.manufacturer || 'Butt Collection'],
        ['Dispatch City:', order.dispatchCity || 'Faisalabad'],
        ['Deadline:', order.deadline || '-'],
        ['Packing Date:', data.date || '-']
      ];

      leftRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 50, rowY);
        doc.fillColor('#0F172A').font('Helvetica').text(String(value), 150, rowY, { width: 155, height: 11, ellipsis: true });
      });
      rightRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 320, rowY);
        doc.fillColor('#0F172A').font('Helvetica').text(String(value), 410, rowY, { width: 140, height: 11, ellipsis: true });
      });

      // Colour & size breakdown
      y = 216;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold')
        .text('PACKING BREAKDOWN BY COLOUR & SIZE (PCS)', 40, y);
      y += 17;

      doc.rect(40, y, 515, 22).fill('#2563EB');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('COLOUR / STYLE', 45, y + 7, { width: 165 });
      doc.text('XS', 215, y + 7, { width: 45, align: 'center' });
      doc.text('S', 270, y + 7, { width: 45, align: 'center' });
      doc.text('M', 325, y + 7, { width: 45, align: 'center' });
      doc.text('L', 380, y + 7, { width: 45, align: 'center' });
      doc.text('XL', 435, y + 7, { width: 45, align: 'center' });
      doc.text('TOTAL', 485, y + 7, { width: 60, align: 'right' });
      y += 22;

      data.rows.forEach((row, index) => {
        if (index % 2 === 1) {
          doc.rect(40, y, 515, 20).fill('#F8FAFC');
        }
        doc.rect(40, y, 515, 20).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
          .text(row.label, 45, y + 6, { width: 165, height: 11, ellipsis: true });
        doc.font('Helvetica').fontSize(8.5);
        row.sizes.forEach((value, sizeIndex) => {
          doc.fillColor('#0F172A').text(String(value || 0), 215 + sizeIndex * 55, y + 6, { width: 45, align: 'center' });
        });
        doc.font('Helvetica-Bold').fillColor('#0F172A')
          .text(String(row.total || 0), 485, y + 6, { width: 60, align: 'right' });
        y += 20;
      });

      doc.rect(40, y, 515, 22).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL', 45, y + 6, { width: 165 });
      data.sizeTotals.forEach((value, sizeIndex) => {
        doc.text(String(value || 0), 215 + sizeIndex * 55, y + 6, { width: 45, align: 'center' });
      });
      doc.text(data.totalPieces.toLocaleString(), 485, y + 6, { width: 60, align: 'right' });
      y += 22;

      // Carton details
      if (y > 560) {
        doc.addPage();
        drawHeader();
        y = 120;
      }

      y += 30;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('CARTON DETAILS', 40, y);
      y += 17;

      doc.rect(40, y, 515, 24).fill('#2563EB');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('CARTON NO.', 45, y + 8, { width: 90 });
      doc.text('DESCRIPTION', 140, y + 8, { width: 165 });
      doc.text('PCS / CARTON', 310, y + 8, { width: 70, align: 'right' });
      doc.text('NO. OF CARTONS', 390, y + 8, { width: 70, align: 'right' });
      doc.text('TOTAL PCS', 470, y + 8, { width: 75, align: 'right' });
      y += 24;

      data.groups.forEach((group, index) => {
        if (index % 2 === 1) {
          doc.rect(40, y, 515, 30).fill('#F8FAFC');
        }
        doc.rect(40, y, 515, 30).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
          .text(group.cartonRange, 45, y + 9, { width: 90, align: 'center' });
        doc.font('Helvetica').fontSize(8)
          .text(group.description, 140, y + 6, { width: 165, height: 22 });
        doc.text(String(group.pcsPerCarton || 0), 310, y + 9, { width: 70, align: 'right' });
        doc.text(String(group.cartons || 0), 390, y + 9, { width: 70, align: 'right' });
        doc.font('Helvetica-Bold').text(group.totalPcs.toLocaleString(), 470, y + 9, { width: 75, align: 'right' });
        y += 30;
      });

      doc.rect(40, y, 515, 22).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL', 45, y + 6, { width: 200 });
      doc.text(String(data.totalCartons), 390, y + 6, { width: 70, align: 'right' });
      doc.text(data.totalPieces.toLocaleString(), 470, y + 6, { width: 75, align: 'right' });
      y += 22;

      // Weight & volume
      y += 30;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold')
        .text('WEIGHT & VOLUME (fill after packing)', 40, y);
      y += 17;
      doc.rect(40, y, 515, 82).strokeColor('#94A3B8').lineWidth(1).stroke();

      const valueLine = (x, lineY, value, unit, width = 50) => {
        doc.moveTo(x, lineY).lineTo(x + width, lineY)
          .lineWidth(0.8).strokeColor('#94A3B8').stroke();
        if (Number(value) > 0) {
          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold')
            .text(String(value), x, lineY - 9, { width, align: 'center' });
        }
        if (unit) {
          doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
            .text(unit, x + width + 4, lineY - 6);
        }
      };

      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('Net Weight / Carton:', 55, y + 14);
      valueLine(175, y + 18, data.netWeight, 'kg');
      doc.text('Total Net Weight:', 300, y + 14);
      valueLine(400, y + 18, data.totalNetWeight, 'kg');

      doc.text('Gross Weight / Carton:', 55, y + 34);
      valueLine(175, y + 38, data.grossWeight, 'kg');
      doc.text('Total Gross Weight:', 300, y + 34);
      valueLine(400, y + 38, data.totalGrossWeight, 'kg');

      doc.text('Carton Size (L x W x H):', 55, y + 54);
      valueLine(175, y + 58, data.cartonLength, '', 26);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text('x', 205, y + 52);
      valueLine(211, y + 58, data.cartonWidth, '', 26);
      doc.text('x', 241, y + 52);
      valueLine(247, y + 58, data.cartonHeight, 'cm', 26);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('Total CBM:', 300, y + 54);
      valueLine(400, y + 58, data.totalCbm, '');

      const notesY = y + 96;
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(`Notes: ${data.notes}`, 40, notesY, { width: 515 });

      // Signatures
      let sigY = notesY + 55;
      if (sigY > 760) {
        doc.addPage();
        drawHeader();
        sigY = 200;
      }

      doc.moveTo(60, sigY).lineTo(200, sigY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
      doc.moveTo(350, sigY).lineTo(490, sigY).stroke();
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
        .text('Prepared by Merchandiser', 60, sigY + 7, { width: 140, align: 'center' })
        .text('Authorized Signature / Factory', 350, sigY + 7, { width: 140, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Commercial invoice with order line items, received payment and balance.
 */
function generateInvoicePdfBuffer(order, company) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const invoice = getInvoiceMeta(order);

      const drawHeader = () => {
        doc.rect(40, 40, 515, 65).fill('#1E3A8A');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
          .text(company?.name || 'BUTT COLLECTION', 55, 51);
        doc.fontSize(8.5).font('Helvetica')
          .text(`${company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan`, 55, 76, { width: 260 });
        doc.fontSize(7.5).font('Helvetica')
          .text(getCompanyAddress(company), 55, 88, { width: 250 });
        doc.fontSize(19).font('Helvetica-Bold')
          .text('INVOICE', 300, 52, { align: 'right', width: 235 });
        doc.fontSize(8.5).font('Helvetica')
          .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 350, 85, { align: 'right', width: 190 });
      };

      drawHeader();

      // Meta box
      let y = 120;
      doc.rect(40, y, 515, 82).strokeColor('#CBD5E1').lineWidth(1).stroke();

      const leftRows = [
        ['Invoice #:', invoice.no],
        ['Order #:', order.orderNumber || '-'],
        ['Customer / Buyer:', order.customer || '-'],
        ['Payment Terms:', invoice.terms]
      ];
      const rightRows = [
        ['Invoice Date:', invoice.date],
        ['Order Date:', order.orderDate || '-'],
        ['Destination:', order.dispatchCity || 'Faisalabad'],
        ['Status:', invoice.paymentStatus]
      ];

      leftRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 50, rowY);
        doc.fillColor('#0F172A').font('Helvetica').text(String(value || '-'), 155, rowY, { width: 150, height: 11, ellipsis: true });
      });
      rightRows.forEach(([label, value], index) => {
        const rowY = y + 10 + index * 18;
        doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(label, 320, rowY);
        if (label === 'Status:') {
          const color = value === 'PAID' ? '#16A34A' : value === 'PARTIAL' ? '#D97706' : '#DC2626';
          doc.fillColor(color).font('Helvetica-Bold').text(String(value), 405, rowY, { width: 140 });
        } else {
          doc.fillColor('#0F172A').font('Helvetica').text(String(value || '-'), 405, rowY, { width: 140, height: 11, ellipsis: true });
        }
      });

      // Bill to
      y = 216;
      doc.rect(40, y, 515, 48).fill('#F8FAFC').strokeColor('#CBD5E1').lineWidth(1).stroke();
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('BILL TO / SHIP TO', 50, y + 8);
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(order.customer || '-', 50, y + 19);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(`${order.dispatchCity || 'Faisalabad'} • ${invoice.terms}`, 50, y + 33);

      // Items table
      y = 282;
      doc.rect(40, y, 515, 24).fill('#2563EB');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('STYLE / DESCRIPTION', 48, y + 8, { width: 150 });
      doc.text('GSM', 200, y + 8, { width: 40, align: 'center' });
      doc.text('COLOR', 245, y + 8, { width: 75 });
      doc.text('QTY (PCS)', 320, y + 8, { width: 55, align: 'right' });
      doc.text('RATE (£)', 380, y + 8, { width: 60, align: 'right' });
      doc.text('AMOUNT (£)', 445, y + 8, { width: 100, align: 'right' });
      y += 24;

      let totalQty = 0;
      let totalAmount = 0;
      const items = Array.isArray(order.items) && order.items.length
        ? order.items
        : [{ style: '-', gsm: '', color: '-', qty: 0, rate: 0, amount: 0 }];

      items.forEach((item, index) => {
        if (y + 24 > 660) {
          doc.addPage();
          drawHeader();
          y = 120;
          doc.rect(40, y, 515, 24).fill('#2563EB');
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          doc.text('STYLE / DESCRIPTION', 48, y + 8, { width: 150 });
          doc.text('GSM', 200, y + 8, { width: 40, align: 'center' });
          doc.text('COLOR', 245, y + 8, { width: 75 });
          doc.text('QTY (PCS)', 320, y + 8, { width: 55, align: 'right' });
          doc.text('RATE (£)', 380, y + 8, { width: 60, align: 'right' });
          doc.text('AMOUNT (£)', 445, y + 8, { width: 100, align: 'right' });
          y += 24;
        }

        if (index % 2 === 0) {
          doc.rect(40, y, 515, 22).fill('#F8FAFC');
        }
        doc.rect(40, y, 515, 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        const qty = Number(item.qty) || 0;
        const amount = Number(item.amount) || 0;
        totalQty += qty;
        totalAmount += amount;

        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold')
          .text(item.style || '-', 48, y + 6, { width: 150, height: 11, ellipsis: true });
        doc.font('Helvetica').fontSize(8)
          .text(item.gsm || '-', 200, y + 6, { width: 40, align: 'center' })
          .text(item.color || 'Assorted', 245, y + 6, { width: 75, height: 11, ellipsis: true })
          .text(qty.toLocaleString(), 320, y + 6, { width: 55, align: 'right' })
          .text(`£${Number(item.rate || 0).toFixed(2)}`, 380, y + 6, { width: 60, align: 'right' })
          .text(`£${amount.toFixed(2)}`, 445, y + 6, { width: 100, align: 'right' });
        y += 22;
      });

      doc.rect(40, y, 515, 24).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('TOTAL', 48, y + 7, { width: 220 });
      doc.text(totalQty.toLocaleString(), 320, y + 7, { width: 55, align: 'right' });
      doc.text(`£${totalAmount.toFixed(2)}`, 445, y + 7, { width: 100, align: 'right' });

      // Financial summary
      y += 40;
      const cardWidth = 165;
      const cardGap = 10;
      const cards = [
        { label: 'Subtotal', value: invoice.total, color: '#0F172A', border: '#CBD5E1', bg: '#F8FAFC' },
        { label: 'Received', value: invoice.received, color: '#15803D', border: '#BBF7D0', bg: '#F0FDF4' },
        { label: 'Balance Due', value: invoice.balance, color: '#B91C1C', border: '#FECACA', bg: '#FEF2F2' }
      ];

      cards.forEach((card, index) => {
        const x = 40 + index * (cardWidth + cardGap);
        doc.rect(x, y, cardWidth, 56).fill(card.bg).strokeColor(card.border).lineWidth(1).stroke();
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
          .text(card.label.toUpperCase(), x + 10, y + 9, { width: cardWidth - 20 });
        doc.fillColor(card.color).fontSize(14).font('Helvetica-Bold')
          .text(`£${card.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, x + 10, y + 24, { width: cardWidth - 20 });
      });

      // Notes / bank
      y += 76;
      doc.rect(40, y, 515, 72).strokeColor('#CBD5E1').lineWidth(1).stroke();
      doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text('Notes / Terms', 52, y + 10);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(invoice.notes || invoice.terms || '-', 52, y + 22, { width: 240, height: 40 });

      doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text('Bank / Payment Details', 310, y + 10);
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(invoice.bankDetails || 'Please contact the merchandiser for bank transfer details.', 310, y + 22, { width: 230, height: 40 });

      // Signature
      let sigY = y + 120;
      if (sigY > 770) {
        doc.addPage();
        drawHeader();
        sigY = 200;
      }
      doc.moveTo(350, sigY).lineTo(490, sigY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
        .text('Authorized Signature / Factory', 350, sigY + 7, { width: 140, align: 'center' });

      doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
        .text('Thank you for your business.', 40, 800, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateOrderPdfBuffer,
  generateCartonLabelPdfBuffer,
  generateGatePassPdfBuffer,
  generatePackingListPdfBuffer,
  generateInvoicePdfBuffer
};
