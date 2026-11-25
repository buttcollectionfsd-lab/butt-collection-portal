export function formatGatePassNumber(order) {
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

export function getGatePassItems(order) {
  if (Array.isArray(order?.gatePassItems)) {
    return order.gatePassItems.map(normalizeGatePassItem);
  }
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return [normalizeGatePassItem({ style: '-', color: '-', qty: 0, cartons: 0 }, 0)];
  return items.map(normalizeGatePassItem);
}

export function getGatePassMeta(order) {
  return {
    no: formatGatePassNumber(order),
    date: order?.gatePassDate || order?.orderDate || new Date().toISOString().split('T')[0],
    vehicleNo: text(order?.gatePassVehicle),
    driverName: text(order?.gatePassDriver),
    driverCell: text(order?.gatePassDriverCell),
    through: text(order?.gatePassThrough),
    destination: text(order?.gatePassDestination || order?.dispatchCity, 'Faisalabad'),
    purpose: text(order?.gatePassPurpose, 'Dispatch of finished goods'),
    remarks: text(order?.gatePassRemarks),

    title: text(order?.gatePassTitle, 'GATE PASS'),
    generatedOn: text(order?.gatePassGeneratedOn, new Date().toLocaleDateString('en-GB')),
    customer: text(order?.gatePassCustomer || order?.customer),
    orderNo: text(order?.gatePassOrderNo || order?.orderNumber),
    companyName: text(order?.gatePassCompanyName),
    companyTagline: text(order?.gatePassCompanyTagline),
    companyAddress: text(order?.gatePassCompanyAddress),
    preparedBy: text(order?.gatePassPreparedBy, 'Prepared by:'),
    gateKeeper: text(order?.gatePassGateKeeper, 'Approved by:'),
    receivedBy: text(order?.gatePassReceivedBy, 'Received by:'),
    authorizedBy: text(order?.gatePassAuthorizedBy, 'Approved by:'),
    footerNote: text(order?.gatePassFooterNote, 'This gate pass is valid for the dispatch described above only.'),

    items: getGatePassItems(order)
  };
}

export function getGatePassTotals(order) {
  const items = getGatePassItems(order);
  return {
    pieces: items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    cartons: items.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0)
  };
}
