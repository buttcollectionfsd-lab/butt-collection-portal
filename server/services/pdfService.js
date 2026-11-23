/**
 * PDF Generation Service using PDFKit
 * Generates Order Work Orders and 4 Distinct Carton Label Templates:
 * 1. 'screenshot_bold' (DEFAULT - Exact replica of user screenshot: Double border, SP Imports, Style Set, Table, Bottom Left TOTAL SETS, Bottom Right CTN# box)
 * 2. 'classic_box' (Design 1: Header description + top right CTN# box + full width bottom total)
 * 3. 'minimal_clean' (Design 3: Rounded corners, horizontal lines, modern minimalist typography)
 * 4. 'top_ctn' (Design 4: Large CTN# box on very top, dual buyer/sets middle box, sizing table, bottom total)
 */
const PDFDocument = require('pdfkit');

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
      doc.fontSize(12).font('Helvetica-Bold').text('MERCHANDISER WORK ORDER', 350, 55, { align: 'right', width: 190 });
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 350, 72, { align: 'right', width: 190 });

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
      doc.text(`Received (Wasool):  £${Number(order.amountReceived || 0).toFixed(2)}`, 55, y + 26);
      doc.fillColor('#DC2626').text(`Balance Due (Bakaya):  £${Number(order.balance || (totalAmount - (order.amountReceived || 0))).toFixed(2)}`, 55, y + 40);

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica');
      doc.text(`Notes: ${order.notes || 'None'}`, 300, y + 12, { width: 240 });

      // Signature Block
      y += 80;
      doc.strokeColor('#CBD5E1').lineWidth(1);
      doc.moveTo(60, y + 20).lineTo(200, y + 20).stroke();
      doc.moveTo(350, y + 20).lineTo(490, y + 20).stroke();
      doc.fillColor('#64748B').fontSize(9).font('Helvetica');
      doc.text('Prepared by Merchandiser', 60, y + 25, { width: 140, align: 'center' });
      doc.text('Authorized Signature / Factory', 350, y + 25, { width: 140, align: 'center' });

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

module.exports = {
  generateOrderPdfBuffer,
  generateCartonLabelPdfBuffer
};
