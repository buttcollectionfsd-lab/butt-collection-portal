/**
 * Gate Pass helpers shared by the PDF + Word generators.
 * Gate pass values live on the order, but every field has a sensible
 * fallback so older orders still produce a complete document.
 */

function formatGatePassNumber(order) {
  const saved = String(order?.gatePassNo || '').trim();
  if (saved) return saved;

  const match = String(order?.orderNumber || '').match(/(\d+)/);
  const number = match ? Number(match[1]) : 1;
  return `GP-${String(Number.isFinite(number) ? number : 1).padStart(3, '0')}`;
}

const text = (value, fallback = '') => {
  const saved = String(value ?? '').trim();
  return saved || fallback;
};

function normalizeGatePassItem(item, index) {
  return {
    id: item?.id || `gp-item-${index + 1}`,
    style: text(item?.style),
    gsm: text(item?.gsm),
    color: text(item?.color),
    cartons: Number(item?.cartons) || 0,
    qty: Number(item?.qty) || 0,
    remarks: text(item?.remarks)
  };
}

/**
 * Items printed on the gate pass. When the user edits the dispatch table we
 * store a dedicated `gatePassItems` array so the original order stays intact.
 */
function getGatePassItems(order) {
  if (Array.isArray(order?.gatePassItems)) {
    return order.gatePassItems.map(normalizeGatePassItem);
  }
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return [normalizeGatePassItem({ style: '-', color: '-', qty: 0, cartons: 0 }, 0)];
  return items.map(normalizeGatePassItem);
}

function getGatePassMeta(order) {
  return {
    no: formatGatePassNumber(order),
    date: order?.gatePassDate || order?.orderDate || new Date().toISOString().split('T')[0],
    vehicleNo: text(order?.gatePassVehicle),
    driverName: text(order?.gatePassDriver),
    destination: text(order?.gatePassDestination || order?.dispatchCity, 'Faisalabad'),
    purpose: text(order?.gatePassPurpose, 'Dispatch of finished goods'),
    remarks: text(order?.gatePassRemarks),

    // Fully editable document chrome (stored per gate pass)
    title: text(order?.gatePassTitle, 'GATE PASS'),
    generatedOn: text(order?.gatePassGeneratedOn, new Date().toLocaleDateString('en-GB')),
    customer: text(order?.gatePassCustomer || order?.customer),
    orderNo: text(order?.gatePassOrderNo || order?.orderNumber),
    companyName: text(order?.gatePassCompanyName),
    companyTagline: text(order?.gatePassCompanyTagline),
    companyAddress: text(order?.gatePassCompanyAddress),
    preparedBy: text(order?.gatePassPreparedBy, 'Prepared by Merchandiser'),
    gateKeeper: text(order?.gatePassGateKeeper, 'Gate Keeper'),
    receivedBy: text(order?.gatePassReceivedBy, 'Driver / Received by'),
    authorizedBy: text(order?.gatePassAuthorizedBy, 'Authorized Signature'),
    footerNote: text(order?.gatePassFooterNote, 'This gate pass is valid for the dispatch described above only.'),

    items: getGatePassItems(order)
  };
}

function getGatePassTotals(order) {
  const items = getGatePassItems(order);
  return {
    pieces: items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    cartons: items.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0)
  };
}

module.exports = {
  formatGatePassNumber,
  getGatePassItems,
  getGatePassMeta,
  getGatePassTotals
};
