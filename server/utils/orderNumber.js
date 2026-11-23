/**
 * Order number formatting.
 *
 * Buyers reference plain sequential numbers ("Order 1", "order #2", "6"),
 * but the factory sheets and carton documents need a fixed, sortable format:
 * `ORDER #001`, `ORDER #002`, ...
 *
 * Anything that is not a pure sequence (e.g. "ALOO9", "JY008") is kept as
 * typed so custom buyer references are never mangled.
 */

const SEQUENTIAL_PATTERN = /^(?:order|po|article|item)?\s*#?\s*(\d{1,4})$/i;

const PAD_LENGTH = 3;

function formatOrderNumber(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const match = SEQUENTIAL_PATTERN.exec(trimmed);
  if (!match) return trimmed;

  const sequence = String(Number(match[1])).padStart(PAD_LENGTH, '0');
  return `ORDER #${sequence}`;
}

module.exports = { formatOrderNumber };
