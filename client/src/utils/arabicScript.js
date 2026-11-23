/**
 * Arabic / Urdu script detection for form input.
 *
 * The portal's PDF, Word and Excel exports use Latin-only fonts, so any Urdu
 * typed into a data field produces broken documents. These helpers detect the
 * characters, name the offending fields and strip them on demand.
 */

const ARABIC_RANGES = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF';

const ARABIC_CHAR = new RegExp(`[${ARABIC_RANGES}]`);
const ARABIC_CHAR_GLOBAL = new RegExp(`[${ARABIC_RANGES}]`, 'g');
const ARABIC_PAREN_GROUP = new RegExp(`\\s*\\([^()]*[${ARABIC_RANGES}][^()]*\\)`, 'g');

const FIELD_FALLBACKS = {
  reference: 'Wasool',
  style: 'Standard Style'
};

const FIELD_LABELS = {
  orderNumber: 'Order / PO Number',
  customer: 'Customer / Buyer Name',
  manufacturer: 'Manufacturer / Factory',
  dispatchCity: 'Dispatch City',
  notes: 'Notes / Instructions',
  style: 'Style / Item Name',
  gsm: 'Fabric GSM',
  color: 'Color',
  reference: 'Slip / Reference ID',
  buyer: 'Buyer / Brand Name',
  description: 'Description',
  cartonNo: 'Carton No / Stamp',
  countryOfOrigin: 'Country of Origin',
  paymentRef: 'Deposit Reference',
  paymentMethod: 'Payment Method',
  method: 'Payment Method'
};

export function hasArabicScript(value) {
  return typeof value === 'string' && ARABIC_CHAR.test(value);
}

export function stripArabicScript(value, fallback = '') {
  if (typeof value !== 'string' || !ARABIC_CHAR.test(value)) return value;

  let result = value
    .replace(ARABIC_PAREN_GROUP, ' ')
    .replace(ARABIC_CHAR_GLOBAL, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\[\s*\]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])\s*\1+/g, '$1')
    .replace(/^[\s\-–—,;:/|]+/, '')
    .replace(/[\s\-–—,;:/|]+$/, '')
    .trim();

  const wrapped = /^\(([^()]+)\)$/.exec(result);
  if (wrapped) result = wrapped[1].trim();

  if (!/[A-Za-z]/.test(result)) return fallback || result;
  return result;
}

/** `items.0.style` -> `Item #1 — Style / Item Name` */
export function describeField(path) {
  const parts = String(path || '').split('.').filter(Boolean);
  const lastKey = parts[parts.length - 1] || '';
  const base = FIELD_LABELS[lastKey] || lastKey;

  const itemIndex = parts.indexOf('items');
  const rowIndex = parts.indexOf('rows');

  if (itemIndex !== -1 && !Number.isNaN(Number(parts[itemIndex + 1]))) {
    return `Item #${Number(parts[itemIndex + 1]) + 1} — ${base}`;
  }
  if (rowIndex !== -1 && !Number.isNaN(Number(parts[rowIndex + 1]))) {
    return `Color row #${Number(parts[rowIndex + 1]) + 1} — ${base}`;
  }
  return base;
}

/** Lists every string in a form/record that still holds Urdu characters. */
export function findArabicIssues(source, prefix = '') {
  const found = [];

  if (typeof source === 'string') {
    if (hasArabicScript(source)) {
      found.push({ field: prefix, label: describeField(prefix), value: source });
    }
    return found;
  }

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      found.push(...findArabicIssues(entry, prefix ? `${prefix}.${index}` : String(index)));
    });
    return found;
  }

  if (source && typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      found.push(...findArabicIssues(value, prefix ? `${prefix}.${key}` : key));
    });
  }

  return found;
}

/** Deep copy of a form/record with every Urdu string cleaned. */
export function stripArabicFrom(source, keyHint = '') {
  if (typeof source === 'string') {
    return stripArabicScript(source, FIELD_FALLBACKS[keyHint] || '');
  }
  if (Array.isArray(source)) {
    return source.map(entry => stripArabicFrom(entry, keyHint));
  }
  if (source && typeof source === 'object') {
    const cleaned = {};
    Object.entries(source).forEach(([key, value]) => {
      cleaned[key] = stripArabicFrom(value, key);
    });
    return cleaned;
  }
  return source;
}
