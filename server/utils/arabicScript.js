/**
 * Arabic / Urdu script guard.
 *
 * The portal exports Excel, PDF and Word documents that use Latin-only fonts,
 * so Arabic-script (Urdu) characters break every generated document. This
 * module detects those characters, strips them and reports which fields of a
 * payload or record contain them.
 */

const ARABIC_RANGES = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF';

const ARABIC_CHAR = new RegExp(`[${ARABIC_RANGES}]`);
const ARABIC_CHAR_GLOBAL = new RegExp(`[${ARABIC_RANGES}]`, 'g');
const ARABIC_PAREN_GROUP = new RegExp(`\\s*\\([^()]*[${ARABIC_RANGES}][^()]*\\)`, 'g');

/** Replacement text used when stripping leaves nothing readable behind. */
const FIELD_FALLBACKS = {
  reference: 'Wasool',
  style: 'Standard Style'
};

/** Human readable names for the fields that are allowed to hold free text. */
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
  paymentRef: 'Deposit Reference'
};

function hasArabicScript(value) {
  return typeof value === 'string' && ARABIC_CHAR.test(value);
}

/**
 * Removes Arabic-script characters from a string and tidies the leftovers
 * (empty brackets, doubled spaces, dangling separators).
 */
function stripArabicScript(value, fallback = '') {
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

  if (!/[A-Za-z]/.test(result)) {
    return fallback || result;
  }
  return result;
}

/** Turns a payload path such as `items.0.style` into `Item #1 — Style`. */
function getFieldLabel(path) {
  const parts = String(path || '').split('.').filter(Boolean);
  const lastKey = parts[parts.length - 1] || '';
  const base = FIELD_LABELS[lastKey] || lastKey;

  const itemIndex = parts.indexOf('items');
  if (itemIndex !== -1 && parts[itemIndex + 1] !== undefined && !Number.isNaN(Number(parts[itemIndex + 1]))) {
    return `Item #${Number(parts[itemIndex + 1]) + 1} — ${base}`;
  }

  const rowIndex = parts.indexOf('rows');
  if (rowIndex !== -1 && parts[rowIndex + 1] !== undefined && !Number.isNaN(Number(parts[rowIndex + 1]))) {
    return `Color row #${Number(parts[rowIndex + 1]) + 1} — ${base}`;
  }

  return base;
}

/** Recursively lists every string that still contains Arabic-script text. */
function findArabicFields(source, prefix = '') {
  const found = [];

  if (typeof source === 'string') {
    if (hasArabicScript(source)) {
      found.push({ field: prefix, label: getFieldLabel(prefix), value: source });
    }
    return found;
  }

  if (Array.isArray(source)) {
    source.forEach((entry, index) => {
      found.push(...findArabicFields(entry, prefix ? `${prefix}.${index}` : String(index)));
    });
    return found;
  }

  if (source && typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      found.push(...findArabicFields(value, prefix ? `${prefix}.${key}` : key));
    });
  }

  return found;
}

/** Returns a deep copy with every Arabic-script string cleaned. */
function sanitizeTextFields(node, keyHint = '') {
  if (typeof node === 'string') {
    return stripArabicScript(node, FIELD_FALLBACKS[keyHint] || '');
  }
  if (Array.isArray(node)) {
    return node.map(entry => sanitizeTextFields(entry, keyHint));
  }
  if (node && typeof node === 'object') {
    const cleaned = {};
    Object.entries(node).forEach(([key, value]) => {
      cleaned[key] = sanitizeTextFields(value, key);
    });
    return cleaned;
  }
  return node;
}

/** Top level keys whose value changed after sanitizing (used for Mongo $set). */
function collectChangedFields(original, sanitized) {
  const patch = {};
  Object.entries(sanitized).forEach(([key, value]) => {
    if (key === '_id' || key === '__v' || key === 'id') return;
    if (JSON.stringify(value) !== JSON.stringify(original[key])) {
      patch[key] = value;
    }
  });
  return patch;
}

module.exports = {
  hasArabicScript,
  stripArabicScript,
  findArabicFields,
  sanitizeTextFields,
  collectChangedFields,
  getFieldLabel
};
