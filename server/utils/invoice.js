/**
 * Commercial invoice helpers derived from the order ledger.
 */

const orderDigits = (order) => {
  const match = String(order?.orderNumber || '').match(/(\d+)/);
  return match ? Number(match[1]) : 1;
};

function formatInvoiceNumber(order) {
  const saved = String(order?.invoiceNo || '').trim();
  if (saved) return saved;
  return `INV-${String(orderDigits(order)).padStart(3, '0')}`;
}

function getInvoiceMeta(order) {
  const total = Number(order?.totalAmount) || 0;
  const received = order?.invoiceReceived != null
    ? Number(order.invoiceReceived) || 0
    : Number(order?.amountReceived) || 0;
  const balance = Math.max(0, total - received);

  return {
    no: formatInvoiceNumber(order),
    date: order?.invoiceDate || order?.orderDate || new Date().toISOString().split('T')[0],
    terms: String(order?.invoiceTerms || 'Payment due on receipt').trim(),
    bankDetails: String(order?.invoiceBankDetails || '').trim(),
    notes: String(order?.invoiceNotes || order?.notes || '').trim(),
    total,
    received,
    balance,
    paymentStatus: total <= 0 ? 'UNPAID' : balance <= 0 ? 'PAID' : received > 0 ? 'PARTIAL' : 'UNPAID'
  };
}

module.exports = {
  formatInvoiceNumber,
  getInvoiceMeta
};
