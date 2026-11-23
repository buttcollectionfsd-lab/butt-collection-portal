/**
 * Order number formatting (client side).
 *
 * Keeps the entry form and the list/ledger screens in the same
 * `ORDER #001` format the server stores.
 */

const SEQUENTIAL_PATTERN = /^(?:order|po|article|item)?\s*#?\s*(\d{1,4})$/i;

const PAD_LENGTH = 3;

export function formatOrderNumber(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const match = SEQUENTIAL_PATTERN.exec(trimmed);
  if (!match) return trimmed;

  const sequence = String(Number(match[1])).padStart(PAD_LENGTH, '0');
  return `ORDER #${sequence}`;
}
