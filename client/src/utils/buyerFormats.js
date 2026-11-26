/**
 * Client-side shaping for the buyer / bank document formats.
 * Mirrors server/utils/exportFormats.js so the on-screen preview
 * matches the PDF layout.
 */
import { getInvoiceMeta } from './invoice';

const SIZE_KEYS = ['2/3', '3/4', '4/5', '5/6', '7/8', '9/10', '11/12', '13', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl'];

const clean = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

export const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

export const formatPackingDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')}/${months[date.getMonth()]}/${date.getFullYear()}`;
};

export const packingDateOf = (order) => formatPackingDate(order?.packingDate || order?.orderDate || new Date().toISOString().split('T')[0]);

export function getSeller(company) {
  return {
    name: clean(company?.name, 'BUTT COLLECTION').toUpperCase(),
    tagline: clean(company?.tagline, 'Quality Apparel Manufacturing & Export'),
    address: clean(company?.address, 'Ayub Colony, Fsd, Street No 9, Center Mill Road'),
    phone: clean(company?.phone),
    email: clean(company?.email)
  };
}

const itemColor = (item) => clean(item?.color, 'ASSORTED').toUpperCase();

const gsmSuffix = (style, gsm) => {
  const text = clean(style);
  const value = clean(gsm);
  if (!value) return '';
  return text.toLowerCase().includes(value.toLowerCase()) ? '' : `${value} GSM`;
};

export function buildInvoiceRows(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  let cursor = 1;
  return items.map(item => {
    const style = clean(item.style, 'STYLE');
    const gsm = clean(item.gsm);
    const gsmLabel = gsmSuffix(style, gsm);
    const cartons = Number(item.cartons) || 0;
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const start = cursor;
    const end = cartons > 0 ? cursor + cartons - 1 : cursor;
    cursor = end + 1;
    return {
      style,
      gsm,
      po: clean(item.poNumber, clean(order?.orderNumber)),
      product: `${style}${gsmLabel ? ` ${gsmLabel}` : ''} - ${itemColor(item)}`,
      color: itemColor(item),
      cartons,
      cartonRange: cartons > 0 ? (cartons === 1 ? String(start) : `${start}-${end}`) : '-',
      qty,
      unit: clean(item.unit, 'SET'),
      rate,
      amount: Number(item.amount) || qty * rate,
      composition: clean(item.composition, clean(order?.invoiceComposition)),
      hsCode: clean(item.hsCode, clean(order?.invoiceHsCode)),
      line: clean(item.line, clean(order?.invoiceLine)),
      groupKey: `${style}||${clean(item.poNumber, order?.orderNumber)}||${rate}||${clean(item.composition)}||${clean(item.hsCode)}`
    };
  });
}

const DEFAULT_PCS_PER_CARTON = 30;

function allocateSizeRanges(sizeTotals, sizeKeys, cartons) {
  const base = {};
  const ranges = {};
  let planCursor = 1;

  sizeKeys.forEach(key => {
    const total = Number(sizeTotals[key]) || 0;
    base[key] = Math.floor(total / cartons);
    let remaining = total - base[key] * cartons;
    ranges[key] = [];
    while (remaining > 0) {
      const start = planCursor;
      const take = Math.min(remaining, cartons - (start - 1));
      const end = start + take - 1;
      ranges[key].push({ start, end });
      remaining -= take;
      planCursor = end >= cartons ? 1 : end + 1;
    }
  });

  return { base, ranges };
}

export function buildPackingBlocks(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const groups = [];
  const index = new Map();

  items.forEach(item => {
    const style = clean(item.style, 'STYLE');
    const gsm = clean(item.gsm);
    const key = `${style}||${gsm}`;
    let group = index.get(key);
    if (!group) {
      group = { key, style, gsm, rows: [], cartons: 0, qty: 0 };
      index.set(key, group);
      groups.push(group);
    }
    const sizes = {};
    Object.entries(item.sizeBreakdown || {}).forEach(([size, value]) => {
      const qtyValue = Number(value) || 0;
      if (qtyValue > 0) sizes[String(size).trim().toLowerCase()] = qtyValue;
    });
    const qty = Number(item.qty) || 0;
    group.rows.push({
      color: itemColor(item),
      sizes,
      qty,
      cartons: Number(item.cartons) || 0,
      declaredPerCarton: Number(item.setsPerCarton) || 0,
      sizesTotal: Object.values(sizes).reduce((sum, value) => sum + value, 0)
    });
    group.cartons += Number(item.cartons) || 0;
    group.qty += qty;
  });

  const blocks = [];
  let cursor = 1;

  groups.forEach(group => {
    const keys = new Set();
    group.rows.forEach(row => Object.keys(row.sizes).forEach(size => keys.add(size)));
    const sizeKeys = SIZE_KEYS.filter(size => keys.has(size));
    keys.forEach(size => {
      if (!sizeKeys.includes(size)) sizeKeys.push(size);
    });

    const cartons = group.cartons > 0
      ? group.cartons
      : Math.max(1, Math.ceil(group.qty / DEFAULT_PCS_PER_CARTON));
    const declared = group.rows[0]?.declaredPerCarton || 0;
    const piecesPerCarton = declared > 0 ? declared : DEFAULT_PCS_PER_CARTON;

    const plans = group.rows.map(row => {
      const totals = {};
      sizeKeys.forEach(key => {
        totals[key] = Number(row.sizes[key]) || 0;
      });
      const allocated = allocateSizeRanges(totals, sizeKeys, cartons);
      return { row, base: allocated.base, ranges: allocated.ranges };
    });

    const boundaries = new Set([1, cartons + 1]);
    plans.forEach(plan => {
      sizeKeys.forEach(key => {
        plan.ranges[key].forEach(range => {
          boundaries.add(range.start);
          boundaries.add(range.end + 1);
        });
      });
    });
    const cuts = [...boundaries].filter(point => point >= 1 && point <= cartons + 1).sort((a, b) => a - b);

    for (let indexCut = 0; indexCut < cuts.length - 1; indexCut += 1) {
      const first = cuts[indexCut];
      const last = cuts[indexCut + 1];
      if (last <= first) continue;
      const count = last - first;

      const rows = plans.map(plan => {
        const vector = {};
        sizeKeys.forEach(key => {
          let pieces = plan.base[key] || 0;
          plan.ranges[key].forEach(range => {
            if (first >= range.start && first <= range.end) pieces += 1;
          });
          vector[key] = pieces;
        });
        let pcsPerCarton = sizeKeys.reduce((sum, key) => sum + vector[key], 0);
        if (!pcsPerCarton) {
          pcsPerCarton = plan.row.declaredPerCarton
            || (group.qty && cartons ? Math.round(plan.row.qty / cartons) : piecesPerCarton);
        }
        return { color: plan.row.color, sizes: vector, pcsPerCarton, totalPcs: pcsPerCarton * count };
      });

      blocks.push({
        key: `${group.key}-${indexCut}`,
        style: group.style,
        gsm: group.gsm,
        gsmLabel: gsmSuffix(group.style, group.gsm),
        sizeKeys,
        rows,
        cartons: count,
        start: cursor,
        end: cursor + count - 1,
        perCartonTotal: rows.reduce((sum, row) => sum + row.pcsPerCarton, 0),
        qty: rows.reduce((sum, row) => sum + row.totalPcs, 0)
      });
      cursor += count;
    }
  });

  const totalCartons = blocks.reduce((sum, block) => sum + block.cartons, 0);
  const totalPieces = blocks.reduce((sum, block) => sum + block.qty, 0);
  return { blocks, totalCartons, totalPieces };
}

export function getInvoiceDetails(order, company) {
  const invoice = getInvoiceMeta(order);
  const seller = getSeller(company);
  const gross = Number(order?.invoiceGrossWeight) || 0;
  const net = Number(order?.invoiceNetWeight) || 0;

  return {
    invoiceNo: clean(order?.invoiceNo, invoice.no),
    invoiceDate: order?.invoiceDate || invoice.date,
    consignee: clean(order?.invoiceConsignee, clean(order?.customer)),
    consigneeAddress: clean(order?.invoiceConsigneeAddress),
    notify: clean(order?.invoiceNotify, clean(order?.invoiceConsignee, clean(order?.customer))),
    notifyAddress: clean(order?.invoiceNotifyAddress, clean(order?.invoiceConsigneeAddress)),
    shipFrom: clean(order?.invoiceShipFrom, 'LAHORE-PAKISTAN'),
    shipTo: clean(order?.invoiceShipTo),
    transport: clean(order?.invoiceTransport, 'BY AIR'),
    awbBl: clean(order?.invoiceAwbBl),
    bankName: clean(order?.invoiceBankName),
    fiNo: clean(order?.invoiceFiNo),
    deliveryTerm: clean(order?.invoiceDeliveryTerm, 'FOB'),
    paymentCurrency: clean(order?.invoicePaymentCurrency, 'GBP'),
    paymentTerms: clean(order?.invoicePaymentTerms, clean(order?.invoiceTerms, 'Payment due on receipt')),
    termOfShipment: clean(order?.invoiceTermOfShipment, 'AS PER CONTRACT'),
    grossWeight: gross,
    netWeight: net,
    cbm: Number(order?.invoiceCbm) || Number(order?.packingCbm) || 0,
    containerNo: clean(order?.invoiceContainerNo),
    gdNo: clean(order?.invoiceGdNo),
    sealNo: clean(order?.invoiceSealNo),
    rexNo: clean(order?.invoiceRexNo),
    hsCode: clean(order?.invoiceHsCode),
    composition: clean(order?.invoiceComposition),
    line: clean(order?.invoiceLine),
    productDesc: clean(order?.invoiceProductDesc),
    contractNo: clean(order?.invoiceContractNo),
    incoterms: clean(order?.invoiceIncoterms),
    lcNo: clean(order?.invoiceLcNo),
    lcDate: clean(order?.invoiceLcDate),
    bankAccountTitle: clean(order?.invoiceBankAccountTitle, seller.name),
    bankAccountNo: clean(order?.invoiceBankAccountNo),
    bankIban: clean(order?.invoiceBankIban),
    bankSwift: clean(order?.invoiceBankSwift),
    bankAddress: clean(order?.invoiceBankAddress),
    originStatement: clean(order?.invoiceOriginStatement),
    seller
  };
}

export function itemTotals(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return {
    cartons: items.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0),
    qty: items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    amount: items.reduce(
      (sum, item) => sum + (Number(item.amount) || (Number(item.qty) || 0) * (Number(item.rate) || 0)),
      0
    )
  };
}
