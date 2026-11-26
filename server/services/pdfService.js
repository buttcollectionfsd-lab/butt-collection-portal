/**
 * PDF Generation Service using PDFKit
 * Generates Order Work Orders and 4 Distinct Carton Label Templates:
 * 1. 'screenshot_bold' (DEFAULT - Exact replica of user screenshot: Double border, SP Imports, Style Set, Table, Bottom Left TOTAL SETS, Bottom Right CTN# box)
 * 2. 'classic_box' (Design 1: Header description + top right CTN# box + full width bottom total)
 * 3. 'minimal_clean' (Design 3: Rounded corners, horizontal lines, modern minimalist typography)
 * 4. 'top_ctn' (Design 4: Large CTN# box on very top, dual buyer/sets middle box, sizing table, bottom total)
 */
const PDFDocument = require('pdfkit');
const { getGatePassMeta, getGatePassTotals, formatGatePassDate, formatGatePassWeight } = require('../utils/gatePass');
const { getPackingTotals } = require('../utils/packingList');
const { getInvoiceMeta } = require('../utils/invoice');
const { getCompanyAddress } = require('../utils/companyInfo');
const { getBankDetails } = require('../utils/bankDetails');

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

      // Style title ka aakhri lafz (SET / SUIT / PCS) label record se aata hai.
      // Purane records ke liye default 'SET'; khali chhora jaye to title
      // mein kuch nahi judta (exactly jo type kiya wohi chhapta hai).
      const suffixRaw = label.styleSuffix;
      const styleSuffix = (suffixRaw === undefined || suffixRaw === null ? 'SET' : String(suffixRaw)).trim().toUpperCase();
      const styleBase = String(label.style || '').trim().toUpperCase();
      const styleHasSuffix = Boolean(styleSuffix)
        && new RegExp(`(^|\\s)${styleSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(styleBase);
      const styleDisplay = styleBase
        ? (styleHasSuffix ? styleBase : [styleBase, styleSuffix].filter(Boolean).join(' '))
        : ['ALOO7', styleSuffix].filter(Boolean).join(' ');
      const unitPlural = styleSuffix ? `${styleSuffix}S` : '';
      const setsText = (count) => `${count}${unitPlural ? ` ${unitPlural}` : ''}`;

      // Master line optional hai: value ho to MASTER box/line print hoti hai,
      // khali ho to kuch bhi nahi chhapta.
      const masterLabelText = String(label.masterLabel === undefined || label.masterLabel === null ? 'MASTER' : label.masterLabel).trim();
      const masterValueText = String(label.masterValue || '').trim();
      const hasMaster = Boolean(masterValueText);
      const masterText = masterLabelText ? `${masterLabelText}: ${masterValueText}` : masterValueText;

      // Colour names (CHARCOAL, LIGHT GREY...) cell se bahar na niklen:
      // text ko cell ki width mein fit hone tak chhota karte hain, wrap nahi hota.
      const fitColorSize = (text, maxWidth, startSize, minSize = 9) => {
        let size = Math.max(startSize, minSize);
        doc.font('Helvetica-Bold').fontSize(size);
        while (size > minSize && doc.widthOfString(String(text)) > maxWidth) {
          size -= 1;
          doc.fontSize(size);
        }
        return size;
      };

      // -------------------------------------------------------------
      // TEMPLATE 1: SCREENSHOT BOLD (DEFAULT)
      // Exactly matches the user's uploaded screenshot!
      // Double border, SP IMPORTS, line, STYLE SET, line, table,
      // bottom left TOTAL XX SETS box, bottom right CTN # box.
      // -------------------------------------------------------------
      if (templateId === 'screenshot_bold') {        // Outer Double Border
        doc.rect(35, 35, 525, 770).lineWidth(4.5).strokeColor('#000000').stroke();
        doc.rect(42, 42, 511, 756).lineWidth(1.5).strokeColor('#000000').stroke();

        // Buyer Header: SP IMPORTS
        doc.fillColor('#000000').fontSize(34).font('Helvetica-Bold')
          .text((label.buyer || 'SP IMPORTS').toUpperCase(), 42, 68, { align: 'center', width: 511 });

        // First horizontal dividing line
        doc.lineWidth(2.5).strokeColor('#000000').moveTo(70, 115).lineTo(525, 115).stroke();

        // Style Title: e.g. ALOO7 SET
        const styleText = styleDisplay;
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

        // Page bhar ke design: A4 ki height ke hisaab se table rows aur
        // bottom boxes stretch hote hain taake neeche khali jagah na bache.
        const headerH = 48;
        const innerBottom = 782;   // inner border (798) se 16pt pehle
        const boxGap = 28;
        const rowCount = Math.max(rows.length, 1);
        const rowH = Math.min(
          130,
          Math.max(58, Math.floor((innerBottom - tableY - headerH - boxGap - 120) / rowCount))
        );
        const numberFont = rowH >= 120 ? 34 : rowH >= 90 ? 30 : rowH >= 70 ? 26 : 24;
        const colorFont = rowH >= 90 ? 18 : 16;

        // Table Header
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

        // Table Data Rows (rowH page ki height ke hisaab se adjust hota hai)
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

          const textOffset = (size) => tableY + (rowH - size) / 2 - 2;

          // Color Label (long names cell ke andar fit ho jate hain)
          const colorText = String(r.color || 'Black');
          const fittedColorSize = fitColorSize(colorText, colW.color - 8, colorFont);
          doc.fillColor('#000000').fontSize(fittedColorSize).font('Helvetica-Bold');
          doc.text(colorText, tableX, textOffset(fittedColorSize), { width: colW.color, align: 'center', lineBreak: false });

          // Big Bold Numbers
          doc.fontSize(numberFont).font('Helvetica-Bold');
          const numY = textOffset(numberFont);
          doc.text(String(r.xs || 0), tableX + colW.color, numY, { width: colW.xs, align: 'center' });
          doc.text(String(r.s || 0), tableX + colW.color + colW.xs, numY, { width: colW.s, align: 'center' });
          doc.text(String(r.m || 0), tableX + colW.color + colW.xs + colW.s, numY, { width: colW.m, align: 'center' });
          doc.text(String(r.l || 0), tableX + colW.color + colW.xs + colW.s + colW.m, numY, { width: colW.l, align: 'center' });
          doc.text(String(r.xl || 0), tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, numY, { width: colW.xl, align: 'center' });
          doc.text(String(displayTotal), tableX + tableW - colW.total, numY, { width: colW.total, align: 'center' });

          tableY += rowH;
        });

        // Bottom Section: TOTAL (+ optional MASTER) + right CTN # box.
        // Boxes page ke bottom tak stretch hote hain (max 320pt).
        const bottomYBase = tableY + boxGap;
        let bottomY = bottomYBase;
        let bottomH = innerBottom - bottomYBase;
        if (bottomH > 320) {
          bottomY = innerBottom - 320;
          bottomH = 320;
        }
        const bottomCenterY = bottomY + bottomH / 2;
        const gap = 14;
        // TOTAL aur MASTER thore kam, CTN # ko zyada jagah.
        const leftBoxW = hasMaster ? 144 : 176;
        const masterBoxW = 110;
        const masterBoxX = tableX + leftBoxW + gap;
        const rightBoxX = tableX + leftBoxW + gap + (hasMaster ? masterBoxW + gap : 0);
        const rightBoxW = tableX + tableW - rightBoxX;

        // Left Box: TOTAL / XX SETS
        doc.rect(tableX, bottomY, leftBoxW, bottomH).lineWidth(2.5).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
          .text('TOTAL', tableX, bottomCenterY - 38, { width: leftBoxW, align: 'center' });
        doc.fontSize(hasMaster ? 24 : 30).font('Helvetica-Bold')
          .text(setsText(totalSetsNum), tableX, bottomCenterY + 2, { width: leftBoxW, align: 'center', height: 40 });

        // Middle Box: MASTER (optional)
        if (hasMaster) {
          doc.rect(masterBoxX, bottomY, masterBoxW, bottomH).lineWidth(2.5).strokeColor('#000000').stroke();
          doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold')
            .text(masterLabelText || 'MASTER', masterBoxX, bottomCenterY - 38, { width: masterBoxW, align: 'center', height: 20, ellipsis: true });
          doc.fontSize(24).font('Helvetica-Bold')
            .text(masterValueText, masterBoxX, bottomCenterY + 2, { width: masterBoxW, align: 'center', height: 40, ellipsis: true });
        }

        // Right Box: CTN # Header + Blank Stamping Area
        doc.rect(rightBoxX, bottomY, rightBoxW, bottomH).lineWidth(2.5).strokeColor('#000000').stroke();
        
        // Header partition inside right box
        doc.rect(rightBoxX, bottomY, rightBoxW, 35).lineWidth(2).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
          .text('CTN #', rightBoxX, bottomY + 10, { width: rightBoxW, align: 'center' });

        // Lower area inside right box is always blank for writing / stamping
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
        doc.fontSize(32).font('Helvetica-Bold').text(styleDisplay, 70, 145);

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

          const colorText = String(r.color || 'Black');
          const fittedColorSize = fitColorSize(colorText, colW.color - 8, 15);
          doc.fillColor('#000000').fontSize(fittedColorSize).font('Helvetica-Bold')
            .text(colorText, tableX, tableY + 22, { width: colW.color, align: 'center', lineBreak: false });
          doc.fontSize(22).font('Helvetica-Bold');
          doc.text(String(r.xs || 0), tableX + colW.color, tableY + 20, { width: colW.xs, align: 'center' });
          doc.text(String(r.s || 0), tableX + colW.color + colW.xs, tableY + 20, { width: colW.s, align: 'center' });
          doc.text(String(r.m || 0), tableX + colW.color + colW.xs + colW.s, tableY + 20, { width: colW.m, align: 'center' });
          doc.text(String(r.l || 0), tableX + colW.color + colW.xs + colW.s + colW.m, tableY + 20, { width: colW.l, align: 'center' });
          doc.text(String(r.xl || 0), tableX + colW.color + colW.xs + colW.s + colW.m + colW.l, tableY + 20, { width: colW.xl, align: 'center' });
          doc.text(String(r.total || rowTot), tableX + tableW - colW.total, tableY + 20, { width: colW.total, align: 'center' });
          tableY += 60;
        });

        // Bottom Double-Boxed TOTAL: 30 SETS (+ optional MASTER line)
        const bY = tableY + 35;
        const totalBoxH = hasMaster ? 92 : 70;
        doc.rect(tableX, bY, tableW, totalBoxH).lineWidth(3).strokeColor('#000000').stroke();
        doc.rect(tableX + 4, bY + 4, tableW - 8, totalBoxH - 8).lineWidth(1).strokeColor('#000000').stroke();
        doc.fillColor('#000000').fontSize(26).font('Helvetica-Bold')
          .text(`TOTAL: ${setsText(totalSetsNum)}`, tableX, bY + (hasMaster ? 16 : 20), { width: tableW, align: 'center' });
        if (hasMaster) {
          doc.fontSize(13).font('Helvetica-Bold')
            .text(masterText, tableX, bY + 58, { width: tableW, align: 'center', height: 18, ellipsis: true });
        }
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
        doc.fontSize(38).font('Helvetica-Bold').text(styleDisplay, 75, 155);
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
          const colorText = String(r.color || 'Black');
          const fittedColorSize = fitColorSize(colorText, 82, 16);
          doc.fillColor('#000000').fontSize(fittedColorSize).font('Helvetica-Bold')
            .text(colorText, 75, tY, { width: 90, lineBreak: false });
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
        doc.fontSize(40).font('Helvetica-Bold').text(setsText(totalSetsNum), 250, tY - 8, { width: 270, align: 'right' });
        doc.lineWidth(1.5).moveTo(75, tY + 45).lineTo(520, tY + 45).stroke();
        if (hasMaster) {
          doc.fontSize(14).font('Helvetica-Bold').text(masterText, 75, tY + 55, { width: 445, align: 'right', height: 18, ellipsis: true });
        }
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
        doc.fontSize(22).font('Helvetica-Bold').text(styleDisplay, 75, midY + 38);

        doc.rect(395, midY, 140, 75).lineWidth(2).stroke();
        doc.fontSize(11).font('Helvetica-Bold').text(unitPlural, 395, midY + 12, { width: 140, align: 'center' });
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

          const colorText = String(r.color || 'Black');
          const fittedColorSize = fitColorSize(colorText, colW.color - 8, 16);
          doc.fillColor('#000000').fontSize(fittedColorSize).font('Helvetica-Bold')
            .text(colorText, tableX, tableY + 20, { width: colW.color, align: 'center', lineBreak: false });
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
          .text(`TOTAL: ${setsText(totalSetsNum)}`, tableX, botY + 18, { width: tableW, align: 'center' });
        if (hasMaster) {
          doc.fontSize(12).font('Helvetica-Bold')
            .text(masterText, tableX, botY + 47, { width: tableW, align: 'center', height: 16, ellipsis: true });
        }
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
/**
 * Compact gate pass form matching the pre-printed factory stationery
 * (BUTT COLLECTION / GATE PASS / OUTWARD-RETURNABLE / 12-row table).
 *
 * - Default: A4 portrait, one form.
 * - `copies: 2`: A4 landscape sheet with two forms side by side + cut guide.
 * - `blank: true` (or no order): empty fields/table for handwriting.
 */
function generateGatePassFormPdfBuffer(order, company, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const copies = Number(options.copies) === 2 ? 2 : 1;
      // `copies: 'pages'` — do full-size copies, har ek apne A4 page par.
      const twoPages = options.copies === 'pages' || options.pages === 2;
      const blank = Boolean(options.blank) || !order;
      // Compact: sirf zaroori rows (jitne items) + signatures qareeb — khali rows nahi.
      const compact = Boolean(options.compact);
      const meta = order ? getGatePassMeta(order) : null;
      const orderTotals = order ? getGatePassTotals(order) : { pieces: 0, rowPieces: 0, cartons: 0, weight: 0 };
      const pcsTotalOnly = String(order?.gatePassPcsMode || '') === 'total';
      const isTwoUp = copies === 2;

      const doc = new PDFDocument({
        size: 'A4',
        layout: isTwoUp ? 'landscape' : 'portrait',
        margin: 0
      });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const companyName = meta?.companyName || company?.name || 'BUTT COLLECTION';
      let tagline = company?.tagline || 'Quality Apparel Manufacturing & Export';
      let cityLine = `${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`;
      if (meta?.companyTagline) {
        const parts = String(meta.companyTagline).split('|').map(part => part.trim());
        if (parts[0]) tagline = parts[0];
        if (parts[1]) cityLine = parts[1];
      }
      const companyAddress = meta?.companyAddress || getCompanyAddress(company);

      const allItems = !blank && meta?.items ? meta.items : [];
      const chunks = [];
      for (let i = 0; i < allItems.length; i += 12) {
        chunks.push(allItems.slice(i, i + 12));
      }
      if (!chunks.length) chunks.push([]);

      const drawForm = (pageItems, pageIndex = 0) => {
        const left = 36;
        const right = 559;
        const width = right - left;

        doc.fillColor('#000000').strokeColor('#000000');

        // ---------- Company header ----------
        doc.font('Helvetica-Bold').fontSize(26)
          .text(String(companyName).toUpperCase(), left, 44, { width: 330, height: 32, ellipsis: true });
        doc.font('Helvetica').fontSize(10.5)
          .text(tagline, left, 82, { width: 330, height: 14, ellipsis: true })
          .text(cityLine, left, 96, { width: 330, height: 14, ellipsis: true });
        doc.fontSize(7.5)
          .text(companyAddress, left, 108, { width: 340, height: 12, ellipsis: true });

        // ---------- GATE PASS box ----------
        doc.lineWidth(1.6).rect(380, 36, 179, 86).stroke();
        doc.font('Helvetica-Bold').fontSize(12)
          .text('GATE PASS', 380, 44, { width: 171, align: 'right' });

        doc.lineWidth(1).moveTo(380, 60).lineTo(559, 60).stroke();
        doc.font('Helvetica-Bold').fontSize(10)
          .text('OUTWARD', 388, 66)
          .text('RETURNABLE', 388, 82);
        doc.lineWidth(1).rect(533, 65, 12, 12).stroke();
        doc.lineWidth(1).rect(533, 81, 12, 12).stroke();
        if (!blank) {
          doc.moveTo(536, 68).lineTo(542, 74).moveTo(542, 68).lineTo(536, 74)
            .lineWidth(1.1).stroke();
        }

        doc.lineWidth(1).moveTo(380, 98).lineTo(559, 98).stroke();
        doc.font('Helvetica-Bold').fontSize(10)
          .text('SR. NO.', 388, 104);
        if (!blank && meta?.no) {
          doc.font('Helvetica').fontSize(9)
            .text(meta.no, 470, 105, { width: 82, align: 'right' });
        }

        doc.lineWidth(2.5).moveTo(left, 130).lineTo(right, 130).stroke();

        // ---------- Party / transport fields ----------
        const fieldValue = (value, x, y, widthValue) => {
          if (blank) return;
          const textValue = String(value || '').trim();
          if (!textValue) return;
          doc.font('Helvetica-Bold').fontSize(9)
            .text(textValue, x, y, { width: widthValue, height: 14, ellipsis: true });
        };

        doc.font('Helvetica-Bold').fontSize(10)
          .text('Party Name:', 36, 139)
          .text('Date:', 372, 139);
        doc.lineWidth(0.8)
          .moveTo(108, 156).lineTo(350, 156).stroke()
          .moveTo(404, 156).lineTo(559, 156).stroke();
        fieldValue(meta?.customer, 110, 140, 236);
        fieldValue(formatGatePassDate(meta?.date), 406, 140, 150);

        doc.font('Helvetica-Bold').fontSize(10)
          .text('Through Mr.:', 36, 163)
          .text('Vehicle #:', 372, 163);
        doc.lineWidth(0.8)
          .moveTo(108, 180).lineTo(350, 180).stroke()
          .moveTo(424, 180).lineTo(559, 180).stroke();
        fieldValue(meta?.through, 110, 164, 236);
        fieldValue(meta?.vehicleNo, 426, 164, 130);

        doc.font('Helvetica-Bold').fontSize(10)
          .text('Driver Name:', 36, 187)
          .text('Driver Cell No.:', 372, 187);
        doc.lineWidth(0.8)
          .moveTo(108, 204).lineTo(350, 204).stroke()
          .moveTo(462, 204).lineTo(559, 204).stroke();
        fieldValue(meta?.driverName, 110, 188, 236);
        fieldValue(meta?.driverCell, 464, 188, 92);

        // ---------- Items table ----------
        const tableTop = 222;
        const headerHeight = 26;
        const rowHeight = 29;
        const rowCount = compact ? Math.max(pageItems.length, 1) : 12;
        const tableBottom = tableTop + headerHeight + rowHeight * rowCount;
        const totalBottom = tableBottom + rowHeight;

        doc.lineWidth(1.6).rect(left, tableTop, width, totalBottom - tableTop).stroke();

        // Column separators
        doc.lineWidth(1);
        [66, 286, 342, 412, 470].forEach(x => {
          doc.moveTo(x, tableTop).lineTo(x, totalBottom).stroke();
        });

        // Header row
        doc.lineWidth(1.6).moveTo(left, tableTop + headerHeight).lineTo(right, tableTop + headerHeight).stroke();
        doc.font('Helvetica-Bold').fontSize(9.5);
        doc.text('SR', 36, tableTop + 10, { width: 30, align: 'center' });
        doc.text('DESCRIPTION', 66, tableTop + 10, { width: 220, align: 'center' });
        doc.fontSize(8.5).text('BORA / CTN', 286, tableTop + 11, { width: 56, align: 'center' });
        doc.fontSize(8.5).text('QTY (PCS)', 342, tableTop + 11, { width: 70, align: 'center' });
        doc.fontSize(8.5).text(`WEIGHT (${String(meta?.weightUnit || 'kg').toUpperCase()})`, 412, tableTop + 11, { width: 58, align: 'center' });
        doc.fontSize(9).text('REMARKS', 470, tableTop + 11, { width: 89, align: 'center' });

        // Numbered rows
        for (let i = 0; i < rowCount; i += 1) {
          const rowTop = tableTop + headerHeight + i * rowHeight;
          const rowBottom = rowTop + rowHeight;
          doc.lineWidth(i === rowCount - 1 ? 1.6 : 0.8)
            .moveTo(left, rowBottom).lineTo(right, rowBottom).stroke();

          doc.font('Helvetica').fontSize(9)
            .text(String(i + 1), 44, rowTop + 8, { width: 18, align: 'center' });

          const item = pageItems[i];
          if (!item) continue;

          const description = [
            item.style || '',
            item.gsm && !String(item.style || '').includes(String(item.gsm)) ? `${item.gsm} GSM` : '',
            item.color || ''
          ].filter(Boolean).join(' - ');
          const cartons = Number(item.cartons) || 0;
          const weight = Number(item.weight) || 0;

          doc.font('Helvetica').fontSize(8)
            .text(description || '-', 70, rowTop + 6, { width: 212, height: 20, ellipsis: true })
            .text(cartons ? cartons.toLocaleString() : '-', 288, rowTop + 9, { width: 52, align: 'center' })
            .text(Number(item.qty) ? Number(item.qty).toLocaleString() : '-', 344, rowTop + 9, { width: 66, align: 'right' })
            .text(formatGatePassWeight(weight, meta?.weightUnit) || '-', 414, rowTop + 9, { width: 54, align: 'right' });
          doc.fontSize(6.8)
            .text(item.remarks || '', 472, rowTop + 9, { width: 85, height: 18, ellipsis: true });
        }

        // Total row
        const totalQty = pcsTotalOnly
          ? orderTotals.pieces
          : pageItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        const totalBora = pageItems.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0);
        const totalWeight = pageItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        const manualTotalWeight = meta?.totalWeightValue || '';
        const autoTotalWeight = formatGatePassWeight(totalWeight, meta?.weightUnit) || '-';
        doc.font('Helvetica-Bold').fontSize(10.5)
          .text('Total', 222, tableBottom + 9, { width: 62, align: 'right' });
        if (!blank) {
          doc.fontSize(manualTotalWeight ? (manualTotalWeight.length > 9 ? 7.5 : 9) : 9.5)
            .text(totalBora ? totalBora.toLocaleString() : '-', 288, tableBottom + 10, { width: 52, align: 'center' })
            .text(totalQty.toLocaleString(), 344, tableBottom + 10, { width: 66, align: 'right' })
            .text(manualTotalWeight || autoTotalWeight, 414, tableBottom + 10, { width: 54, align: 'right', height: 20, ellipsis: true });
        }

        // Grand total weight line — label aur value dono editable
        const totalWeightLabel = meta?.totalWeightLabel || 'Total Weight';
        const totalWeightDisplay = manualTotalWeight
          || (totalWeight > 0 ? `${autoTotalWeight} ${meta?.weightUnit === 'g' ? 'g' : 'kg'}` : '');
        let refsY = totalBottom + 8;
        if (!blank && totalWeightDisplay) {
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000')
            .text(`${totalWeightLabel}: ${totalWeightDisplay}`, left + 4, totalBottom + 6, { width: width - 8 });
          refsY = totalBottom + 22;
        }

        // Dispatch references (small print, keeps the stationery layout)
        if (!blank) {
          const refs = [
            meta?.orderNo ? `${meta.orderLabel || 'Order #'}: ${meta.orderNo}` : '',
            meta?.destination ? `Destination: ${meta.destination}` : '',
            meta?.purpose ? `Purpose: ${meta.purpose}` : '',
            meta?.remarks ? `Remarks: ${meta.remarks}` : '',
            meta?.generatedOn ? `Generated: ${meta.generatedOn}` : '',
            chunks.length > 1 ? `Page ${pageIndex + 1} of ${chunks.length}` : ''
          ].filter(Boolean).join('   •   ');
          if (refs) {
            doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
              .text(refs, left, refsY, { width, height: 12, ellipsis: true });
            doc.fillColor('#000000');
          }
        }

        // ---------- Signatures ----------
        const signatureY = compact ? Math.min(totalBottom + 96, 700) : 695;
        doc.lineWidth(1);
        [
          [46, 171, meta?.preparedBy || 'Prepared by:'],
          [232, 357, meta?.authorizedBy || 'Approved by:'],
          [425, 550, meta?.receivedBy || 'Received by:']
        ].forEach(([x1, x2, label]) => {
          doc.moveTo(x1, signatureY).lineTo(x2, signatureY).stroke();
          doc.font('Helvetica-Bold').fontSize(10)
            .text(label, x1, signatureY + 7, { width: x2 - x1, align: 'center' });
        });
      };

      const drawCutGuide = () => {
        doc.save();
        doc.strokeColor('#94A3B8').lineWidth(0.5)
          .dash(4, { space: 4 })
          .moveTo(doc.page.width / 2, 10)
          .lineTo(doc.page.width / 2, doc.page.height - 10)
          .stroke();
        doc.undash();
        doc.restore();
      };

      chunks.forEach((chunk, chunkIndex) => {
        if (chunkIndex > 0) {
          doc.addPage({
            size: 'A4',
            layout: isTwoUp ? 'landscape' : 'portrait',
            margin: 0
          });
        }

        if (twoPages) {
          // Two full-size copies, one per A4 portrait page (same size as 1-up).
          drawForm(chunk, chunkIndex);
          doc.addPage({ size: 'A4', layout: 'portrait', margin: 0 });
          drawForm(chunk, chunkIndex);
        } else if (isTwoUp) {
          // The form is drawn in A4-portrait coordinates and scaled down, so tell
          // PDFKit the usable page is taller than the landscape page. Without
          // this, auto page-breaks split the copies mid-table.
          doc.page.margins.bottom = -(841.89 - doc.page.height + 60);

          // Two A5-ish copies on one A4 landscape sheet.
          const scale = 0.67;
          const copyWidth = 595.28 * scale;
          const copyHeight = 841.89 * scale;
          const gap = 20;
          const totalWidth = copyWidth * 2 + gap;
          const startX = (doc.page.width - totalWidth) / 2;
          const startY = (doc.page.height - copyHeight) / 2;

          doc.save();
          doc.translate(startX, startY);
          doc.scale(scale);
          drawForm(chunk, chunkIndex);
          doc.restore();

          doc.save();
          doc.translate(startX + copyWidth + gap, startY);
          doc.scale(scale);
          drawForm(chunk, chunkIndex);
          doc.restore();

          drawCutGuide();
        } else {
          drawForm(chunk, chunkIndex);
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

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
        ['Date:', formatGatePassDate(meta.date)],
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
function generateInvoicePdfBuffer(order, company, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const copies = Number(options.copies) === 2 ? 2 : 1;
      const invoice = getInvoiceMeta(order);

      const items = Array.isArray(order.items) && order.items.length
        ? order.items
        : [{ style: '-', gsm: '', color: '-', qty: 0, rate: 0, amount: 0 }];

      // Two copies on one sheet only when the invoice comfortably fits on a
      // single portrait page (12 line items tak).
      const isTwoUp = copies === 2 && items.length <= 12;

      const doc = new PDFDocument(
        isTwoUp
          ? { size: 'A4', layout: 'landscape', margin: 0 }
          : { margin: 40, size: 'A4' }
      );
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const drawCopy = ({ offsetX = 0, offsetY = 0, scale = 1, paginate = true, compact = false } = {}) => {
        const transformed = offsetX !== 0 || offsetY !== 0 || scale !== 1;
        if (transformed) {
          doc.save();
          doc.translate(offsetX, offsetY);
          doc.scale(scale);
        }

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
        const drawTableHead = (headY) => {
          doc.rect(40, headY, 515, 24).fill('#2563EB');
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          doc.text('STYLE / DESCRIPTION', 48, headY + 8, { width: 150 });
          doc.text('GSM', 200, headY + 8, { width: 40, align: 'center' });
          doc.text('COLOR', 245, headY + 8, { width: 75 });
          doc.text('QTY (PCS)', 320, headY + 8, { width: 55, align: 'right' });
          doc.text('RATE (£)', 380, headY + 8, { width: 60, align: 'right' });
          doc.text('AMOUNT (£)', 445, headY + 8, { width: 100, align: 'right' });
        };

        y = 282;
        drawTableHead(y);
        y += 24;

        let totalQty = 0;
        let totalAmount = 0;

        items.forEach((item, index) => {
          if (paginate && y + 24 > 660) {
            doc.addPage();
            drawHeader();
            y = 120;
            drawTableHead(y);
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
        y += compact ? 30 : 40;
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
        y += compact ? 66 : 76;
        doc.rect(40, y, 515, 72).strokeColor('#CBD5E1').lineWidth(1).stroke();
        doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text('Notes / Terms', 52, y + 10);
        doc.fillColor('#475569').fontSize(8).font('Helvetica')
          .text(invoice.notes || invoice.terms || '-', 52, y + 22, { width: 240, height: 40 });

        doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text('Bank / Payment Details', 310, y + 10);
        doc.fillColor('#475569').fontSize(8).font('Helvetica')
          .text(invoice.bankDetails || 'Please contact the merchandiser for bank transfer details.', 310, y + 22, { width: 230, height: 40 });

        // Signature
        let sigY = y + (compact ? 84 : 120);
        if (paginate && sigY > 750) {
          doc.addPage();
          drawHeader();
          sigY = 200;
        }
        doc.moveTo(350, sigY).lineTo(490, sigY).lineWidth(0.8).strokeColor('#94A3B8').stroke();
        doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
          .text('Authorized Signature / Factory', 350, sigY + 7, { width: 140, align: 'center' });

        if (compact) {
          if (sigY <= 795) {
            doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
              .text('Thank you for your business.', 40, 825, { width: 515, align: 'center' });
          }
        } else {
          doc.fillColor('#94A3B8').fontSize(7).font('Helvetica')
            .text('Thank you for your business.', 40, 780, { width: 515, align: 'center' });
        }

        if (transformed) doc.restore();
      };

      if (!isTwoUp) {
        drawCopy({ paginate: true });
        doc.end();
        return;
      }

      // A4 landscape: two identical invoices side by side + cut guide.
      doc.page.margins.bottom = -(841.89 - doc.page.height + 60);
      const scale = 0.67;
      const scaledWidth = 595.28 * scale;
      const gap = 30;
      const startX = (doc.page.width - (scaledWidth * 2 + gap)) / 2;
      const startY = 10;

      drawCopy({ offsetX: startX, offsetY: startY, scale, paginate: false, compact: true });
      drawCopy({ offsetX: startX + scaledWidth + gap, offsetY: startY, scale, paginate: false, compact: true });

      const midX = doc.page.width / 2;
      doc.save();
      doc.dash(4, { space: 3 })
        .moveTo(midX, 10)
        .lineTo(midX, doc.page.height - 10)
        .strokeColor('#94A3B8')
        .lineWidth(0.8)
        .stroke();
      doc.undash();
      doc.restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// -------------------------------------------------------------
// BANK / PAYMENT DETAILS (client ko bhejne ke liye one-pager)
// -------------------------------------------------------------
function generateBankDetailsPdfBuffer(company, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const bank = getBankDetails(company);
      const pageW = 595.28;
      const marginX = 50;
      const contentW = pageW - marginX * 2;
      const companyName = String((company && company.name) || 'Butt Collection').trim();
      const companyCity = String((company && company.city) || 'Faisalabad').trim();
      const companyCountry = String((company && company.country) || 'Pakistan').trim();
      const companyPhone = String((company && company.phone) || '').trim();
      // Seeded demo number client ko nahi bhejna chahiye.
      const phoneIsReal = Boolean(companyPhone) && companyPhone.replace(/[\s-]/g, '') !== '+923001234567';
      const companyAddress = getCompanyAddress(company);
      const tagline = String((company && company.tagline) || '').trim();
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      // ---------- Header band ----------
      doc.rect(0, 0, pageW, 152).fill('#0f172a');
      doc.rect(0, 152, pageW, 5).fill('#10b981');

      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(27)
        .text(companyName.toUpperCase(), marginX, 36, { width: contentW - 150, lineBreak: false });
      if (tagline) {
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(10)
          .text(tagline, marginX, 72, { width: contentW - 150, lineBreak: false });
      }
      doc.fillColor('#cbd5e1').fontSize(9)
        .text([companyAddress, companyCity, companyCountry].filter(Boolean).join(', '), marginX, 101, { width: contentW - 190, lineBreak: false });

      if (phoneIsReal) {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
          .text(companyPhone, pageW - marginX - 180, 40, { width: 180, align: 'right' });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
          .text('PHONE / WHATSAPP', pageW - marginX - 180, 56, { width: 180, align: 'right' });
      }
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
        .text(`ISSUED ${dateStr.toUpperCase()}`, pageW - marginX - 180, 101, { width: 180, align: 'right' });

      // ---------- Title ----------
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(20)
        .text('BANK PAYMENT DETAILS', marginX, 186, { width: contentW, align: 'center' });
      doc.fillColor('#64748b').font('Helvetica').fontSize(10)
        .text('For invoice / order payments — please transfer to the account below', marginX, 213, { width: contentW, align: 'center' });

      // ---------- Details card ----------
      const rows = [
        { label: 'ACCOUNT TITLE', value: bank.accountTitle, size: 15 },
        { label: 'BANK NAME', value: bank.bankName, size: 15 },
        { label: 'ACCOUNT NUMBER', value: bank.accountNo, size: 16 },
        { label: 'IBAN', value: bank.iban, size: 15, highlight: true },
        { label: 'BRANCH / CITY', value: [bank.branch, bank.city].filter(Boolean).join(', '), size: 15 }
      ];
      if (bank.swift) {
        rows.push({ label: 'SWIFT CODE', value: bank.swift, size: 15 });
      }

      const cardX = marginX;
      const cardY = 246;
      const rowH = 52;
      const cardH = rowH * rows.length;

      doc.roundedRect(cardX, cardY, contentW, cardH, 10).lineWidth(1).strokeColor('#cbd5e1').stroke();

      rows.forEach((row, i) => {
        const y = cardY + i * rowH;
        if (row.highlight) {
          doc.save();
          doc.roundedRect(cardX + 1, y + 1, contentW - 2, rowH - 2, 0).fill('#ecfdf5');
          doc.restore();
        } else if (i % 2 === 1) {
          doc.save();
          doc.rect(cardX + 1, y, contentW - 2, rowH).fill('#f8fafc');
          doc.restore();
        }
        if (i > 0) {
          doc.lineWidth(0.7).strokeColor('#e2e8f0')
            .moveTo(cardX + 14, y).lineTo(cardX + contentW - 14, y).stroke();
        }
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7.5)
          .text(row.label, cardX + 18, y + 12, { characterSpacing: 1.1, lineBreak: false });
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(row.size)
          .text(row.value, cardX + 18, y + 28, { width: contentW - 36, lineBreak: false });
      });

      // ---------- Payment reference ----------
      const refY = cardY + cardH + 18;
      const refH = 64;
      const refLabel = String(options.ref || '').trim();
      const amountText = String(options.amount || '').trim();
      const currency = String(options.currency || (company && company.currency) || '').trim();

      doc.roundedRect(marginX, refY, contentW, refH, 8).lineWidth(1).strokeColor('#cbd5e1').dash(4, { space: 3 }).stroke().undash();
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7.5)
        .text('PAYMENT REFERENCE (INVOICE / ORDER NO.)', marginX + 18, refY + 13, { characterSpacing: 1, lineBreak: false });
      if (refLabel) {
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14)
          .text(refLabel, marginX + 18, refY + 31, { width: contentW - 220, lineBreak: false });
      } else {
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(10)
          .text('Write your invoice / order number here before transferring', marginX + 18, refY + 33, { width: contentW - 220, lineBreak: false });
      }
      if (amountText) {
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7.5)
          .text('AMOUNT', pageW - marginX - 190, refY + 13, { width: 172, align: 'right', characterSpacing: 1 });
        doc.fillColor('#047857').font('Helvetica-Bold').fontSize(16)
          .text(`${currency}${amountText}`, pageW - marginX - 190, refY + 29, { width: 172, align: 'right' });
      }

      // ---------- Instructions ----------
      const notesY = refY + refH + 26;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9)
        .text('IMPORTANT', marginX, notesY, { characterSpacing: 1.2 });

      const notes = [
        'Please mention your Invoice / Order No. in the payment reference so we can trace your payment.',
        'After transferring, kindly share the payment receipt or transaction screenshot on WhatsApp.',
        'Pay only to the account details given above. Please verify the account title before transferring.'
      ];
      let nY = notesY + 18;
      notes.forEach(note => {
        doc.circle(marginX + 3.2, nY + 4.2, 1.8).fill('#10b981');
        doc.fillColor('#334155').font('Helvetica').fontSize(9)
          .text(note, marginX + 14, nY, { width: contentW - 14, lineBreak: true });
        nY += 21;
      });

      // ---------- Thank you strip ----------
      const stripY = 704;
      doc.roundedRect(marginX, stripY, contentW, 44, 8).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
        .text('Thank you for your business!', marginX + 18, stripY + 9, { width: contentW - 160, lineBreak: false });
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(8.5)
        .text('Payment confirmation will be shared once the transfer is received.', marginX + 18, stripY + 25, { width: contentW - 40, lineBreak: false });

      // ---------- Signature ----------
      const signY = 782;
      doc.lineWidth(1).strokeColor('#94a3b8').moveTo(marginX, signY).lineTo(marginX + 190, signY).stroke();
      doc.fillColor('#64748b').font('Helvetica').fontSize(8.5)
        .text('Authorized Signatory', marginX, signY + 6);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10)
        .text(companyName, pageW - marginX - 220, signY + 4, { width: 220, align: 'right' });
      doc.fillColor('#64748b').font('Helvetica').fontSize(8.5)
        .text(companyCity + ', ' + companyCountry, pageW - marginX - 220, signY + 19, { width: 220, align: 'right' });

      // ---------- Footer ----------
      doc.lineWidth(0.7).strokeColor('#e2e8f0').moveTo(marginX, 820).lineTo(pageW - marginX, 820).stroke();
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
        .text(`${companyName} — ${companyCity}, ${companyCountry}`, marginX, 826, { width: contentW / 2, lineBreak: false });
      doc.text('BANK PAYMENT DETAILS', pageW - marginX - contentW / 2, 826, { width: contentW / 2, align: 'right', lineBreak: false });

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
  generateGatePassFormPdfBuffer,
  generatePackingListPdfBuffer,
  generateInvoicePdfBuffer,
  generateBankDetailsPdfBuffer
};
