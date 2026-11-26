/**
 * Buyer / bank document formats:
 *  - buyer packing / weight list (AQA-style, 30 pcs carton mix blocks)
 *  - buyer commercial invoice (MG-style, shipping marks + statement of origin)
 *  - bank commercial invoice (AQA-style, PO/style/colour grid + bank details)
 */
const PDFDocument = require('pdfkit');
const {
  clean,
  formatDocDate,
  packingDateOf,
  money,
  poundsInWords,
  getSeller,
  gsmSuffix,
  buildPackingBlocks,
  buildInvoiceRows,
  getInvoiceDetails,
  itemTotals
} = require('../utils/exportFormats');

const PAGE_W = 595.28;
const PAGE_H = 841.89;

function bufferFromPdf(draw, title) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: title || 'Document' } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      draw(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function cell(doc, options) {
  const {
    x, y, w, h,
    text = '',
    font = 'Helvetica',
    size = 6.5,
    align = 'left',
    valign = 'middle',
    fill = null,
    stroke = '#1F2937',
    lineWidth = 0.5,
    padding = 2,
    color = '#111827',
    lineGap = 0
  } = options;

  if (fill) doc.rect(x, y, w, h).fill(fill);
  if (stroke) doc.rect(x, y, w, h).lineWidth(lineWidth).strokeColor(stroke).stroke();

  if (text !== '' && text !== null && text !== undefined) {
    doc.fillColor(color).font(font).fontSize(size);
    const innerWidth = Math.max(1, w - padding * 2);
    const textHeight = doc.heightOfString(String(text), { width: innerWidth, align, lineGap });
    let textY = y + padding;
    if (valign === 'middle') textY = y + Math.max(padding, (h - textHeight) / 2);
    if (valign === 'bottom') textY = y + h - textHeight - padding;
    doc.text(String(text), x + padding, textY, { width: innerWidth, align, lineGap });
  }
}

function hline(doc, x1, y, x2, width = 0.5, color = '#1F2937') {
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(width).strokeColor(color).stroke();
}

function vline(doc, x, y1, y2, width = 0.5, color = '#1F2937') {
  doc.moveTo(x, y1).lineTo(x, y2).lineWidth(width).strokeColor(color).stroke();
}

function sellerLines(company) {
  const seller = getSeller(company);
  return {
    seller,
    lines: [seller.tagline.toUpperCase(), seller.address + (seller.phone ? `, Phone: ${seller.phone}` : '') + (seller.email ? `, Email: ${seller.email}` : '')]
  };
}

/* ------------------------------------------------------------------ */
/* 1. Buyer packing / weight list                                      */
/* ------------------------------------------------------------------ */

function styleCodeOf(style) {
  const text = clean(style).toUpperCase();
  const short = text
    .replace(/\s+\d+\s*GSM$/i, '')
    .replace(/\s+(SET|SUIT|PCS)$/i, '')
    .trim();
  return short || text || 'STYLE';
}

function generateBuyerPackingListPdf(order, company) {
  return bufferFromPdf(doc => {
    const { seller } = sellerLines(company);
    const { blocks, totalCartons, totalPieces } = buildPackingBlocks(order);
    const margin = 26;
    const frame = 14;
    const contentW = PAGE_W - margin * 2;
    const city = clean(company?.city, 'Faisalabad').toUpperCase();
    const country = clean(company?.country, 'Pakistan').toUpperCase();
    const customer = clean(order?.customer || order?.invoiceConsignee, '-');
    const poNumber = clean(order?.orderNumber, '-');
    let y = 0;

    const drawFrame = () => {
      doc.rect(frame, frame, PAGE_W - frame * 2, PAGE_H - frame * 2)
        .lineWidth(0.9).strokeColor('#111827').stroke();
    };

    const drawLetterhead = (continued = false) => {
      y = 24;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(19)
        .text(seller.name, margin, y, { width: contentW, align: 'center' });
      y += 23;
      doc.font('Helvetica-Bold').fontSize(7)
        .text(seller.tagline.toUpperCase(), margin, y, { width: contentW, align: 'center' });
      y += 10;
      doc.font('Helvetica-Bold').fontSize(7.4)
        .text(`${city} - ${country}`, margin, y, { width: contentW, align: 'center' });
      y += 11;
      hline(doc, margin, y, margin + contentW, 1.1);
      y += 3;
      hline(doc, margin, y, margin + contentW, 0.5);
      y += 9;

      if (continued) {
        cell(doc, {
          x: margin, y, w: contentW, h: 18, text: 'PACKING / WEIGHT LIST (CONTINUED)',
          font: 'Helvetica-Bold', size: 10, align: 'center', fill: '#DCE6F1'
        });
        y += 22;
        return;
      }

      const labelW = 128;
      const rowH = 13.5;
      const rows = [
        ['ORDER #', poNumber],
        ['CUSTOMER', customer],
        ['DATED', packingDateOf(order)],
        ['TOTAL CARTONS', String(totalCartons)],
        ['TOTAL PCS', String(totalPieces)]
      ];
      rows.forEach(([label, value]) => {
        cell(doc, { x: margin, y, w: labelW, h: rowH, text: label, font: 'Helvetica-Bold', size: 7.4, padding: 3 });
        cell(doc, { x: margin + labelW, y, w: contentW - labelW, h: rowH, text: value, font: 'Helvetica-Bold', size: 7.6, padding: 3 });
        y += rowH;
      });
      y += 6;

      cell(doc, {
        x: margin, y, w: contentW, h: 20, text: 'PACKING / WEIGHT LIST',
        font: 'Helvetica-Bold', size: 13, align: 'center', fill: '#DCE6F1'
      });
      y += 20;
    };

    const drawBlock = (block) => {
      const baseCols = [26, 16, 24, 28, 40, 44, 96, 56];
      const tailCols = [30, 32, 32];
      const sizeKeys = block.sizeKeys;
      const sizeCount = Math.max(1, sizeKeys.length);
      const fixed = baseCols.reduce((a, b) => a + b, 0) + tailCols.reduce((a, b) => a + b, 0);
      const sizeW = Math.max(15, (contentW - fixed) / sizeCount);
      const raw = [...baseCols, ...Array(sizeCount).fill(sizeW), ...tailCols];
      const sum = raw.reduce((a, b) => a + b, 0);
      const widths = raw.map(value => (value * contentW) / sum);
      const xs = [];
      let cursor = margin;
      widths.forEach(width => {
        xs.push(cursor);
        cursor += width;
      });
      const sizeX = xs[8];
      const tailX = 8 + sizeCount;

      const bodyRowH = 13.5;
      const headerH = 23;
      const totalH = 14;
      const blockH = headerH + block.rows.length * bodyRowH + totalH;

      if (y + blockH > 776) {
        doc.addPage();
        drawFrame();
        drawLetterhead(true);
      }

      const top = y;
      const headers = [
        ['Ctn.', 'No.'], ['TO', ''], ['Ctn.', 'No.'], ['Total', 'Ctns.'],
        ['STYLE NO', ''], ['PO NUMBER', ''], ['PRODUCT NAME', ''], ['BODY', 'COLOR']
      ];
      headers.forEach(([line1, line2], i) => {
        cell(doc, { x: xs[i], y: top, w: widths[i], h: 12, text: line1, font: 'Helvetica-Bold', size: 6, align: 'center', padding: 1 });
        cell(doc, { x: xs[i], y: top + 12, w: widths[i], h: headerH - 12, text: line2, font: 'Helvetica-Bold', size: 6, align: 'center', padding: 1 });
      });

      cell(doc, { x: sizeX, y: top, w: sizeW * sizeCount, h: 12, text: '', font: 'Helvetica-Bold', size: 6 });
      sizeKeys.forEach((key, i) => {
        cell(doc, {
          x: sizeX + i * sizeW, y: top + 12, w: sizeW, h: headerH - 12,
          text: key.toUpperCase(), font: 'Helvetica-Bold', size: 6.4, align: 'center',
          fill: '#1F1F1F', color: '#FFFFFF', padding: 1
        });
      });

      const tailLabels = ['Pcs / Colour', 'Total Pcs / Carton', 'Total PCS'];
      tailLabels.forEach((label, i) => {
        cell(doc, {
          x: xs[tailX + i], y: top, w: widths[tailX + i], h: headerH,
          text: label, font: 'Helvetica-Bold', size: 5.6, align: 'center', padding: 1
        });
      });

      const bodyTop = top + headerH;
      const cardH = block.rows.length * bodyRowH;
      const styleCode = styleCodeOf(block.style);
      const gsmLabel = gsmSuffix(block.style, block.gsm);
      const productName = gsmLabel
        ? `${clean(block.style).toUpperCase()} (${gsmLabel})`
        : clean(block.style).toUpperCase();

      cell(doc, { x: xs[0], y: bodyTop, w: widths[0], h: cardH, text: String(block.start), font: 'Helvetica', size: 8, align: 'center' });
      cell(doc, { x: xs[1], y: bodyTop, w: widths[1], h: cardH, text: 'TO', font: 'Helvetica', size: 6.4, align: 'center', padding: 0.5 });
      cell(doc, { x: xs[2], y: bodyTop, w: widths[2], h: cardH, text: String(block.end), font: 'Helvetica', size: 8, align: 'center' });
      cell(doc, { x: xs[3], y: bodyTop, w: widths[3], h: cardH, text: String(block.cartons), font: 'Helvetica-Bold', size: 8, align: 'center' });
      cell(doc, { x: xs[4], y: bodyTop, w: widths[4], h: cardH, text: styleCode, font: 'Helvetica', size: 6.8, align: 'center', padding: 1 });
      cell(doc, { x: xs[5], y: bodyTop, w: widths[5], h: cardH, text: poNumber, font: 'Helvetica', size: 6.4, align: 'center', padding: 1 });
      cell(doc, { x: xs[6], y: bodyTop, w: widths[6], h: cardH, text: productName, font: 'Helvetica', size: 6.4, align: 'center', padding: 1 });
      cell(doc, { x: xs[tailX], y: bodyTop, w: widths[tailX], h: cardH, text: String(block.perCartonTotal), font: 'Helvetica', size: 8, align: 'center' });

      block.rows.forEach((row, i) => {
        const rowY = bodyTop + i * bodyRowH;
        cell(doc, { x: xs[7], y: rowY, w: widths[7], h: bodyRowH, text: row.color, font: 'Helvetica-Bold', size: 5.4, align: 'center', padding: 1 });
        sizeKeys.forEach((key, si) => {
          cell(doc, {
            x: sizeX + si * sizeW, y: rowY, w: sizeW, h: bodyRowH,
            text: String(row.sizes[key] || 0), font: 'Helvetica', size: 7, align: 'center'
          });
        });
        cell(doc, {
          x: xs[tailX + 1], y: rowY, w: widths[tailX + 1], h: bodyRowH,
          text: String(row.pcsPerCarton), font: 'Helvetica', size: 7, align: 'center'
        });
        cell(doc, {
          x: xs[tailX + 2], y: rowY, w: widths[tailX + 2], h: bodyRowH,
          text: String(row.totalPcs), font: 'Helvetica', size: 7, align: 'center'
        });
      });

      const totalY = bodyTop + cardH;
      cell(doc, { x: xs[0], y: totalY, w: widths[0] + widths[1] + widths[2], h: totalH, text: 'TOTAL', font: 'Helvetica-Bold', size: 7.4, align: 'center' });
      cell(doc, { x: xs[3], y: totalY, w: widths[3], h: totalH, text: String(block.cartons), font: 'Helvetica-Bold', size: 8, align: 'center' });
      cell(doc, { x: xs[4], y: totalY, w: widths[4] + widths[5], h: totalH, text: '', font: 'Helvetica-Bold', size: 8 });
      cell(doc, { x: xs[6], y: totalY, w: widths[6], h: totalH, text: '.', font: 'Helvetica-Bold', size: 8, align: 'center' });
      cell(doc, { x: xs[7], y: totalY, w: widths[7], h: totalH, text: '', font: 'Helvetica-Bold', size: 8 });
      cell(doc, { x: sizeX, y: totalY, w: sizeW * sizeCount + widths[tailX], h: totalH, text: '', font: 'Helvetica-Bold', size: 8 });
      cell(doc, { x: xs[tailX + 1], y: totalY, w: widths[tailX + 1], h: totalH, text: '', font: 'Helvetica-Bold', size: 8 });
      cell(doc, { x: xs[tailX + 2], y: totalY, w: widths[tailX + 2], h: totalH, text: String(block.qty), font: 'Helvetica-Bold', size: 8, align: 'center' });

      y = totalY + totalH + 3.5;
    };

    drawFrame();
    drawLetterhead(false);
    blocks.forEach(drawBlock);

    const requiredH = 52 + 24;
    if (y + requiredH > 800) {
      doc.addPage();
      drawFrame();
      drawLetterhead(true);
    }
    y += 8;

    const gross = Number(order?.packingGrossWeight) > 0
      ? Number(order.packingGrossWeight) * totalCartons
      : (Number(order?.invoiceGrossWeight) || 0);
    const net = Number(order?.packingNetWeight) > 0
      ? Number(order.packingNetWeight) * totalCartons
      : (Number(order?.invoiceNetWeight) || 0);
    const summary = [
      ['TOTAL CARTON', String(totalCartons)],
      ['TOTAL PCS', String(totalPieces)],
      ['GROSS WEIGHT', `${gross ? Number(gross.toFixed(1)) : '-'} KGS`],
      ['NET WEIGHT', `${net ? Number(net.toFixed(1)) : '-'} KGS`]
    ];
    summary.forEach(([label, value], i) => {
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8.4)
        .text(label, margin, y + i * 12.5, { width: 140 });
      doc.font('Helvetica-Bold').fontSize(8.4)
        .text(value, margin + 92, y + i * 12.5, { width: 100, align: 'right' });
    });

    const notes = [
      clean(order?.packingSizeNote1),
      clean(order?.packingSizeNote2)
    ].filter(Boolean);
    if (!notes.length) {
      const l = Number(order?.packingCartonLength) > 0 ? order.packingCartonLength : '__';
      const w = Number(order?.packingCartonWidth) > 0 ? order.packingCartonWidth : '__';
      const h = Number(order?.packingCartonHeight) > 0 ? order.packingCartonHeight : '__';
      notes.push(`CARTON SIZE (L-${l} ,W-${w} ,H-${h} )   ${totalCartons} CARTONS`);
    }
    notes.slice(0, 2).forEach((note, i) => {
      cell(doc, {
        x: margin + 250, y: y + i * 18 - 1, w: contentW - 250, h: 15, text: note,
        font: 'Helvetica-Bold', size: 7.2, align: 'center', fill: '#FFFF00', stroke: '#FFFF00', padding: 2
      });
    });

    const mixBlock = blocks.find(block => block.rows.length > 1);
    if (mixBlock) {
      const pcsPerColour = mixBlock.rows[0]?.pcsPerCarton || 0;
      const note = `Cartons are assorted: every carton holds ${pcsPerColour} pcs of each colour (${mixBlock.perCartonTotal} pcs). Size mix per carton is shown in each block above.`;
      doc.fillColor('#111827').font('Helvetica').fontSize(6.6)
        .text(note, margin, y + 53, { width: contentW - 20, align: 'left' });
    }
  }, 'Buyer Packing List');
}

/* ------------------------------------------------------------------ */
/* 2. Buyer commercial invoice (MG style)                              */
/* ------------------------------------------------------------------ */

function drawBuyerInvoiceHeader(doc, seller, lines, margin, contentW) {
  let y = 20;
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(20)
    .text(seller.name, margin, y, { width: contentW, align: 'center' });
  y += 24;
  doc.font('Helvetica-Bold').fontSize(7)
    .text(lines[0], margin, y, { width: contentW, align: 'center' });
  y += 9;
  doc.font('Helvetica-BoldOblique').fontSize(7.2)
    .text(lines[1], margin, y, { width: contentW, align: 'center' });
  y += 12;
  hline(doc, margin, y, margin + contentW, 1.2);
  y += 3;
  hline(doc, margin, y, margin + contentW, 0.6);
  return y + 10;
}

function drawConsigneeBox(doc, x, y, w, title, name, address, height = 48) {
  doc.roundedRect(x, y, w, height, 8).lineWidth(0.7).strokeColor('#1F2937').stroke();
  cell(doc, { x: x + 6, y: y + 5, w: w - 12, h: 10, text: title, font: 'Helvetica-Bold', size: 6.5, stroke: null });
  cell(doc, { x: x + 6, y: y + 16, w: w - 12, h: 10, text: name, font: 'Helvetica-Bold', size: 7.4, stroke: null });
  cell(doc, { x: x + 6, y: y + 27, w: w - 12, h: height - 33, text: address, font: 'Helvetica', size: 6.8, stroke: null });
}

function generateBuyerInvoicePdf(order, company) {
  return bufferFromPdf(doc => {
    const { seller, lines } = sellerLines(company);
    const details = getInvoiceDetails(order, company);
    const rows = buildInvoiceRows(order);
    const totals = itemTotals(order);
    const margin = 24;
    const contentW = PAGE_W - margin * 2;

    const drawMeta = (startY) => {
      const labelX = 300;
      const labelW = 105;
      const valueX = labelX + labelW;
      const valueW = 240;
      let my = startY;
      const metaRows = [
        ['INVOICE NO', details.invoiceNo, false],
        ['DATE', formatDocDate(details.invoiceDate), false],
        ['SHIPMENT FROM', details.shipFrom, false],
        ['SHIPMENT TO', details.shipTo, false],
        ['BY SEA / AIR', details.transport, false],
        ['AWB / B.L', details.awbBl, false],
        ['BANK NAME', details.bankName, true],
        ['F.I NUMBER', details.fiNo, true],
        ['DELIVERY TERM', details.deliveryTerm, false],
        ['PAYMENT', details.paymentCurrency, false],
        ['TERM OF SHIPMENT', details.termOfShipment, false],
        ['GROSS WEIGHT', details.grossWeight ? `${details.grossWeight.toFixed(2)} KGS.` : '', false],
        ['NET WEIGHT', details.netWeight ? `${details.netWeight.toFixed(2)} KGS.` : '', false]
      ];
      metaRows.forEach(([label, value, highlight]) => {
        cell(doc, { x: labelX, y: my, w: labelW, h: 13, text: label, font: 'Helvetica-Bold', size: 6, stroke: null, padding: 0 });
        if (highlight) {
          doc.rect(valueX, my + 1, valueW, 12).fill('#FFFF00');
        }
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.6)
          .text(value || '', valueX, my + 2, { width: valueW, height: 10, ellipsis: true });
        hline(doc, valueX, my + 13, valueX + valueW, 0.6);
        my += 16;
      });
      return my;
    };

    let y = drawBuyerInvoiceHeader(doc, seller, lines, margin, contentW);
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9)
      .text('COMMERCIAL INVOICE', margin, y, { width: contentW, align: 'center' });
    doc.moveTo(270, y + 12).lineTo(325, y + 12).lineWidth(0.7).strokeColor('#000').stroke();
    y += 22;

    const leftW = 245;
    drawConsigneeBox(doc, margin, y, leftW, 'CONSIGNEE:', details.consignee, details.consigneeAddress, 52);
    drawConsigneeBox(doc, margin, y + 58, leftW, 'NOTIFY :', details.notify || details.consignee, details.notifyAddress || details.consigneeAddress, 62);
    const metaBottom = drawMeta(y - 2);
    y = Math.max(y + 126, metaBottom) + 10;

    const cols = [52, 64, 74, 163, 34, 44, 58, 58];
    const widths = cols.map(w => (w * contentW) / cols.reduce((a, b) => a + b, 0));
    const xs = [];
    let cursorX = margin;
    widths.forEach(w => { xs.push(cursorX); cursorX += w; });
    const tableRight = cursorX;
    const headerH = 22;

    const drawTableHeader = (topY) => {
      const headerCells = [
        ['SHIPPING MARKS', 0], ['STYLE #', 1], ['ORDER #', 2], ['PRODUCT NAME', 3],
        ['CARTON', 4], ['QUANTITY', 5], ['UNIT PRICE', 6], ['TOTAL VALUE', 7]
      ];
      headerCells.forEach(([label, i]) => {
        cell(doc, { x: xs[i], y: topY, w: widths[i], h: headerH, text: label, font: 'Helvetica-Bold', size: 6.2, align: 'center', fill: '#F3F4F6' });
      });
      cell(doc, { x: xs[0], y: topY + headerH - 10, w: widths[0], h: 10, text: 'ORDER NO.', font: 'Helvetica-Bold', size: 5.6, align: 'center', fill: '#F3F4F6' });
    };

    let rowY = y;
    drawTableHeader(rowY);
    rowY += headerH;

    const rowH = 18;

    const ensureSpace = (needed) => {
      if (rowY + needed > 760) {
        doc.addPage();
        rowY = 30;
        drawTableHeader(rowY);
        rowY += headerH;
      }
    };

    let i = 0;
    while (i < rows.length) {
      let span = 1;
      while (i + span < rows.length && rows[i + span].groupKey === rows[i].groupKey) span += 1;
      ensureSpace(rowH * span);
      const groupY = rowY;
      const groupH = rowH * span;

      for (let r = 0; r < span; r += 1) {
        const row = rows[i + r];
        const currentY = groupY + r * rowH;
        cell(doc, { x: xs[0], y: currentY, w: widths[0], h: rowH, text: r === 0 ? row.po : '', font: 'Helvetica', size: 6.2, align: 'center' });
        cell(doc, { x: xs[1], y: currentY, w: widths[1], h: rowH, text: clean(order?.manufacturer, 'BUTT COLLECTION'), font: 'Helvetica', size: 6.2, align: 'center' });
        cell(doc, { x: xs[2], y: currentY, w: widths[2], h: rowH, text: row.po, font: 'Helvetica', size: 6.2, align: 'center' });
        cell(doc, { x: xs[3], y: currentY, w: widths[3], h: rowH, text: row.product, font: 'Helvetica', size: 6.4 });
        cell(doc, { x: xs[5], y: currentY, w: widths[5], h: rowH, text: String(row.qty), font: 'Helvetica', size: 6.4, align: 'center' });
        cell(doc, { x: xs[6], y: currentY, w: widths[6], h: rowH, text: row.rate ? money(row.rate) : '', font: 'Helvetica', size: 6.4, align: 'center' });
        cell(doc, { x: xs[7], y: currentY, w: widths[7], h: rowH, text: row.amount ? money(row.amount) : '', font: 'Helvetica', size: 6.4, align: 'center' });
      }

      // merged carton cell for the whole group
      doc.rect(xs[4], groupY, widths[4], groupH).fill('#FFFFFF');
      cell(doc, {
        x: xs[4], y: groupY, w: widths[4], h: groupH,
        text: rows[i].cartonRange === '-' ? '' : String(rows[i].cartons),
        font: 'Helvetica', size: 6.4, align: 'center'
      });

      rowY = groupY + groupH;
      i += span;
    }

    // totals row
    ensureSpace(22);
    cell(doc, { x: margin, y: rowY, w: widths[0] + widths[1] + widths[2] + widths[3], h: 18, text: 'TOTAL:', font: 'Helvetica-Bold', size: 7, align: 'right', fill: '#F3F4F6' });
    cell(doc, { x: xs[4], y: rowY, w: widths[4] + widths[5], h: 18, text: `${totals.cartons} CTNS   ${totals.qty} SET`, font: 'Helvetica-Bold', size: 6.6, align: 'center', fill: '#F3F4F6' });
    cell(doc, { x: xs[6], y: rowY, w: widths[6], h: 18, text: '', font: 'Helvetica-Bold', size: 6.6, fill: '#F3F4F6' });
    cell(doc, { x: xs[7], y: rowY, w: widths[7], h: 18, text: money(totals.amount || order?.totalAmount), font: 'Helvetica-Bold', size: 7, align: 'center', fill: '#F3F4F6' });
    rowY += 26;

    // Statement on origin
    ensureSpace(110);
    cell(doc, { x: margin, y: rowY, w: 92, h: 12, text: 'Statement on Origin', font: 'Helvetica-Bold', size: 6.4 });
    rowY += 12;
    const statement = details.originStatement ||
      `The Exporter ${seller.name} [REX NO. ${details.rexNo || '________'}] of the product covered by this document declares that, except where otherwise clearly indicated, these products are of Pakistan preferential origin according to rules of the Generalized System of Preferences of the United Kingdom and that the origin criterion met is ${details.hsCode || '________'}, `;
    cell(doc, { x: margin, y: rowY, w: contentW, h: 42, text: statement, font: 'Helvetica', size: 6.2, valign: 'top', padding: 3 });
    rowY += 50;

    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7)
      .text('NATIONAL TAX #', margin, rowY, { width: 200 });
    rowY += 9;
    doc.font('Helvetica-BoldOblique').fontSize(6.6)
      .text('IT IS CERTIFIED THAT THE GOODS ARE OF PAKISTAN ORIGIN', margin, rowY, { width: 300 });
  }, 'Buyer Commercial Invoice');
}

/* ------------------------------------------------------------------ */
/* 3. Bank commercial invoice (AQA style)                              */
/* ------------------------------------------------------------------ */

function generateBankInvoicePdf(order, company) {
  return bufferFromPdf(doc => {
    const { seller, lines } = sellerLines(company);
    const details = getInvoiceDetails(order, company);
    const rows = buildInvoiceRows(order);
    const totals = itemTotals(order);
    const grandTotal = totals.amount || Number(order?.totalAmount) || 0;
    const margin = 24;
    const contentW = PAGE_W - margin * 2;
    const tableRight = margin + contentW;

    const drawPageHeader = () => {
      let y = 22;
      const gradient = doc.linearGradient(margin, y, margin + contentW, y + 28);
      gradient.stop(0, '#B8CBD9').stop(0.45, '#7FA2BA').stop(1, '#2E5B74');
      doc.rect(margin, y, contentW, 28).fill(gradient);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15)
        .text(seller.name, margin, y + 8, { width: contentW - 14, align: 'right' });
      y += 28;
      cell(doc, { x: margin, y, w: contentW, h: 15, text: lines[1], font: 'Helvetica', size: 6.8, align: 'center' });
      y += 15;
      cell(doc, { x: margin, y, w: contentW, h: 15, text: 'COMMERCIAL INVOICE', font: 'Helvetica-Bold', size: 9.5, align: 'center', fill: '#DCE6F1' });
      return y + 15;
    };

    let y = drawPageHeader();

    // Left column: shipper / consignee / notify (compact, reference style)
    const leftX = margin;
    const leftW = 215;
    const drawParty = (label, name, address) => {
      cell(doc, { x: leftX, y, w: leftW, h: 11, text: label, font: 'Helvetica-Bold', size: 6.4, fill: '#E8EDF3' });
      y += 11 + 3;
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.2)
        .text(name || '', leftX + 2, y, { width: leftW - 4 });
      const nameH = doc.heightOfString(name || ' ', { width: leftW - 4 });
      y += nameH + 1.5;
      doc.font('Helvetica').fontSize(6.5)
        .text(address || '', leftX + 2, y, { width: leftW - 4 });
      const addressH = doc.heightOfString(address || ' ', { width: leftW - 4 });
      y += addressH + 5;
    };

    drawParty('SHIPPER / EXPORTER', seller.name, seller.address);
    drawParty('CONSIGNEE / IMPORTER', details.consignee, details.consigneeAddress);
    drawParty('NOTIFY', details.notify || details.consignee, details.notifyAddress || details.consigneeAddress);
    const leftBottom = y;

    // Right column: invoice meta grid
    const rightX = leftX + leftW + 12;
    const rightW = tableRight - rightX;
    const labelW = 90;
    let rightY = 84;
    const metaRows = [
      ['INVOICE NO.', details.invoiceNo],
      ['INVOICE DATE:', formatDocDate(details.invoiceDate)],
      ['CONTRACT NO.', details.contractNo],
      ['DELIVERY TERMS.', details.deliveryTerm],
      ['SHIPMENT FROM.', details.shipFrom],
      ['SHIPMENT TO.', details.shipTo],
      ['INCOTERMS.', details.incoterms],
      ['PAYMENT TERMS.', details.paymentTerms],
      ['L/C#', details.lcNo],
      ['L/C DATE:', details.lcDate],
      ['F.I#', details.fiNo],
      ['PRODUCT:', details.productDesc || rows[0]?.style || '']
    ];
    metaRows.forEach(([label, value]) => {
      cell(doc, { x: rightX, y: rightY, w: labelW, h: 12.5, text: label, font: 'Helvetica-Bold', size: 6.2, fill: '#F1F5F9' });
      cell(doc, { x: rightX + labelW, y: rightY, w: rightW - labelW, h: 12.5, text: value, font: 'Helvetica', size: 6.6 });
      rightY += 12.5;
    });

    y = Math.max(leftBottom, rightY) + 7;

    // Table geometry (weights match the AQA reference proportions)
    const weights = [27, 48, 31, 70, 41, 34, 82, 31, 31, 24, 26, 22, 62];
    const sum = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map(w => (w * contentW) / sum);
    const xs = [];
    let cursorX = margin;
    widths.forEach(w => { xs.push(cursorX); cursorX += w; });
    const headerH = 20;

    const drawTableHeader = (topY) => {
      cell(doc, { x: xs[0], y: topY, w: widths[0] + widths[1], h: 10, text: 'MARKS & NOS.', font: 'Helvetica-Bold', size: 6, align: 'center', fill: '#EDF1F7' });
      cell(doc, { x: xs[2], y: topY, w: widths[2], h: 10, text: '', font: 'Helvetica-Bold', size: 6, fill: '#EDF1F7' });
      cell(doc, { x: xs[0], y: topY + 10, w: widths[0], h: 10, text: 'PO#', font: 'Helvetica-Bold', size: 5.6, align: 'center', fill: '#EDF1F7' });
      cell(doc, { x: xs[1], y: topY + 10, w: widths[1], h: 10, text: 'STYLE#', font: 'Helvetica-Bold', size: 5.6, align: 'center', fill: '#EDF1F7' });
      cell(doc, { x: xs[2], y: topY + 10, w: widths[2], h: 10, text: 'CTN #', font: 'Helvetica-Bold', size: 5.6, align: 'center', fill: '#EDF1F7' });
      const labels = [['COMPOSITION', 3], ['COLOR', 4], ['LINE', 5], ['DESCRIPTION', 6], ['H.S.CODE', 7],
        ['CTNS', 8], ['QTY', 9], ['UNIT', 10], ['GBP / PCS', 11], ['VALUE C&F-GBP', 12]];
      labels.forEach(([label, i]) => {
        cell(doc, { x: xs[i], y: topY, w: widths[i], h: headerH, text: label, font: 'Helvetica-Bold', size: i === 7 ? 5.2 : i >= 8 ? 5.5 : 5.9, align: 'center', padding: i === 7 ? 0.5 : 2, fill: '#EDF1F7' });
      });
    };

    let rowY = y;
    drawTableHeader(rowY);
    rowY += headerH;

    const colorRowH = 15;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      let span = 1;
      while (i + span < rows.length && rows[i + span].groupKey === row.groupKey) span += 1;
      const groupH = Math.max(colorRowH * span, 24);

      if (rowY + groupH > 660) {
        doc.addPage();
        rowY = drawPageHeader();
        drawTableHeader(rowY);
        rowY += headerH;
      }

      const groupY = rowY;
      cell(doc, { x: xs[0], y: groupY, w: widths[0], h: groupH, text: row.po, font: 'Helvetica', size: 5.6, align: 'center', padding: 1 });
      cell(doc, { x: xs[1], y: groupY, w: widths[1], h: groupH, text: row.style, font: 'Helvetica', size: 5.7, align: 'center', padding: 1.5 });
      cell(doc, { x: xs[2], y: groupY, w: widths[2], h: groupH, text: row.cartonRange, font: 'Helvetica', size: 5.7, align: 'center' });
      cell(doc, { x: xs[3], y: groupY, w: widths[3], h: groupH, text: row.composition || details.composition, font: 'Helvetica', size: 5.7, align: 'center' });
      cell(doc, { x: xs[5], y: groupY, w: widths[5], h: groupH, text: row.line || details.line, font: 'Helvetica', size: 5.7, align: 'center' });
      cell(doc, { x: xs[6], y: groupY, w: widths[6], h: groupH, text: row.product, font: 'Helvetica', size: 5.6, align: 'center' });
      cell(doc, { x: xs[7], y: groupY, w: widths[7], h: groupH, text: row.hsCode || details.hsCode, font: 'Helvetica', size: 5.7, align: 'center' });
      cell(doc, { x: xs[8], y: groupY, w: widths[8], h: groupH, text: String(row.cartons || ''), font: 'Helvetica', size: 5.9, align: 'center' });

      for (let r = 0; r < span; r += 1) {
        const colorRow = rows[i + r];
        const colorY = groupY + r * colorRowH;
        cell(doc, { x: xs[4], y: colorY, w: widths[4], h: colorRowH, text: colorRow.color, font: 'Helvetica', size: 5.6, align: 'center', padding: 1 });
        cell(doc, { x: xs[9], y: colorY, w: widths[9], h: colorRowH, text: String(colorRow.qty), font: 'Helvetica', size: 5.9, align: 'center' });
        cell(doc, { x: xs[10], y: colorY, w: widths[10], h: colorRowH, text: colorRow.unit, font: 'Helvetica', size: 5.2, align: 'center', padding: 0.5 });
        cell(doc, { x: xs[11], y: colorY, w: widths[11], h: colorRowH, text: colorRow.rate ? colorRow.rate.toFixed(4) : '', font: 'Helvetica', size: 5.4, align: 'center', padding: 0.5 });
        cell(doc, { x: xs[12], y: colorY, w: widths[12], h: colorRowH, text: colorRow.amount ? money(colorRow.amount) : '', font: 'Helvetica', size: 5.6, align: 'center', padding: 0.5 });
      }

      rowY = groupY + groupH;
      i += span - 1;
    }

    // Totals row
    cell(doc, { x: margin, y: rowY, w: xs[8] - margin, h: 16, text: '', font: 'Helvetica-Bold', size: 6 });
    cell(doc, { x: xs[8], y: rowY, w: widths[8], h: 16, text: String(totals.cartons), font: 'Helvetica-Bold', size: 6.4, align: 'center' });
    cell(doc, { x: xs[9], y: rowY, w: widths[9], h: 16, text: String(totals.qty), font: 'Helvetica-Bold', size: 6.4, align: 'center' });
    cell(doc, { x: xs[10], y: rowY, w: widths[10] + widths[11], h: 16, text: '', font: 'Helvetica-Bold', size: 6 });
    cell(doc, { x: xs[12], y: rowY, w: widths[12], h: 16, text: money(grandTotal), font: 'Helvetica-Bold', size: 6.4, align: 'center' });
    rowY += 16;

    doc.fillColor('#000').font('Helvetica-Bold').fontSize(6.4)
      .text('TOTAL NET PAYBLE AMOUNT', xs[6], rowY + 2, { width: xs[12] - xs[6] - 4, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(6.6)
      .text(money(grandTotal), xs[12], rowY + 2, { width: widths[12], align: 'center' });
    rowY += 14;

    // Say value
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7)
      .text('SAY VALUE : -', margin, rowY + 1, { width: 90 });
    doc.font('Helvetica-Bold').fontSize(7)
      .text(`TOTAL POUNDS STERLING ${poundsInWords(grandTotal)} ONLY`, margin + 95, rowY + 1, { width: contentW - 95, align: 'center' });
    rowY += 14;

    cell(doc, { x: margin, y: rowY, w: contentW, h: 13, text: 'HERE BY WE CERTIFY THAT THE GOODS ARE OF PAKISTAN ORIGIN', font: 'Helvetica-Bold', size: 6.4, fill: '#EDF1F7' });
    rowY += 13;

    // Weight / shipment grid
    const colA = contentW * 0.53;
    const colB = contentW * 0.15;
    const labelPart = 120;
    const weightRows = [
      ['NET WEIGHT', details.netWeight ? `${details.netWeight.toFixed(0)} KGS` : '', 'CBM', details.cbm ? details.cbm.toFixed(3) : ''],
      ['GROSS WEIGHT', details.grossWeight ? `${details.grossWeight.toFixed(0)} KGS` : '', 'G.D#', details.gdNo]
    ];
    weightRows.forEach(([label, value, label2, value2]) => {
      cell(doc, { x: margin, y: rowY, w: labelPart, h: 12.5, text: label, font: 'Helvetica-Bold', size: 6.2, fill: '#F8FAFC' });
      cell(doc, { x: margin + labelPart, y: rowY, w: colA - labelPart, h: 12.5, text: value, font: 'Helvetica', size: 6.4 });
      cell(doc, { x: margin + colA, y: rowY, w: colB, h: 12.5, text: label2, font: 'Helvetica-Bold', size: 6.2, fill: '#F8FAFC' });
      cell(doc, { x: margin + colA + colB, y: rowY, w: contentW - colA - colB, h: 12.5, text: value2, font: 'Helvetica', size: 6.4 });
      rowY += 12.5;
    });
    cell(doc, { x: margin, y: rowY, w: colA, h: 12.5, text: `CONTAINER#   ${details.containerNo || ''}`, font: 'Helvetica-Bold', size: 6.2 });
    cell(doc, { x: margin + colA, y: rowY, w: contentW - colA, h: 12.5, text: `SEAL#   ${details.sealNo || ''}`, font: 'Helvetica-Bold', size: 6.2 });
    rowY += 15;

    // DCTS declaration
    cell(doc, { x: margin, y: rowY, w: contentW, h: 11, text: 'DCTS Declaration of Origin Statement', font: 'Helvetica-Bold', size: 6, fill: '#EDF1F7' });
    rowY += 11;
    const dcts = `The exporter of the products covered by this document (Customs Identification No. ${details.rexNo || '________'}) declares that, except where otherwise clearly indicated, these products are of (P) preferential origin in accordance with the rules of origin of the Developing Countries Trading Scheme of the UK and that the origin criterion met is P'(${details.hsCode || '________'})`;
    cell(doc, { x: margin, y: rowY, w: contentW, h: 34, text: dcts, font: 'Helvetica', size: 6, valign: 'top', padding: 3 });
    rowY += 38;

    // Bank details + signature
    if (rowY + 110 > PAGE_H - 20) {
      doc.addPage();
      rowY = 30;
    }
    const bankW = contentW * 0.68;
    cell(doc, { x: margin, y: rowY, w: bankW, h: 11, text: 'BANK ACCOUNT DETAILS.', font: 'Helvetica-Bold', size: 6.4, fill: '#EDF1F7' });
    rowY += 11;
    const bankRows = [
      ['ACCOUNT TITLE:', details.bankAccountTitle],
      ['BANK NAME:', details.bankName],
      ['ADDRESS:', details.bankAddress],
      ['A/C#', details.bankAccountNo],
      ['IBAN#', details.bankIban],
      ['SWIFT CODE:', details.bankSwift]
    ];
    bankRows.forEach(([label, value]) => {
      cell(doc, { x: margin, y: rowY, w: bankW * 0.32, h: 11.5, text: label, font: 'Helvetica-Bold', size: 6, fill: '#F8FAFC' });
      cell(doc, { x: margin + bankW * 0.32, y: rowY, w: bankW * 0.68, h: 11.5, text: value, font: 'Helvetica', size: 6.2 });
      rowY += 11.5;
    });

    const signX = margin + bankW + 16;
    const signW = contentW - bankW - 16;
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7)
      .text(`FOR ${seller.name}`, signX, rowY - 80, { width: signW, align: 'center' });
    doc.moveTo(signX + 20, rowY - 42).lineTo(signX + signW - 20, rowY - 42).lineWidth(0.4).stroke();
    doc.font('Helvetica-Bold').fontSize(6.6)
      .text('EXPORT MANAGER', signX, rowY - 38, { width: signW, align: 'center' });
  }, 'Bank Commercial Invoice');
}

module.exports = {
  generateBuyerPackingListPdf,
  generateBuyerInvoicePdf,
  generateBankInvoicePdf
};
