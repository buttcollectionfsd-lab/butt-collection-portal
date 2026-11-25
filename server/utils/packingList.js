/**
 * Packing list helpers. The packing list is derived from order items so it
 * always matches the production sheet, with optional packing fields stored
 * on the order (weights, carton dimensions, notes).
 */

const DEFAULT_PCS_PER_CARTON = 30;

const orderDigits = (order) => {
  const match = String(order?.orderNumber || '').match(/(\d+)/);
  return match ? Number(match[1]) : 1;
};

function formatPackingListNumber(order) {
  const saved = String(order?.packingListNo || '').trim();
  if (saved) return saved;
  return `PL-${String(orderDigits(order)).padStart(3, '0')}`;
}

function getPackingMeta(order) {
  return {
    no: formatPackingListNumber(order),
    date: order?.packingDate || order?.orderDate || new Date().toISOString().split('T')[0],
    netWeight: Number(order?.packingNetWeight) || 0,
    grossWeight: Number(order?.packingGrossWeight) || 0,
    cartonLength: Number(order?.packingCartonLength) || 0,
    cartonWidth: Number(order?.packingCartonWidth) || 0,
    cartonHeight: Number(order?.packingCartonHeight) || 0,
    cbm: Number(order?.packingCbm) || 0,
    notes: String(order?.packingNotes || '').trim()
  };
}

/**
 * Group items by style + GSM. Colours within a group are mixed inside the
 * same cartons, which is how the factory packing list is written.
 */
function buildPackingGroups(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const map = new Map();

  items.forEach(item => {
    const style = String(item.style || '').trim() || 'Standard Style';
    const gsm = String(item.gsm || '').trim();
    const key = `${style}||${gsm}`;
    if (!map.has(key)) {
      map.set(key, {
        style,
        gsm,
        colors: new Set(),
        qty: 0,
        cartons: 0,
        setsPerCarton: 0
      });
    }
    const group = map.get(key);
    const color = String(item.color || '').trim();
    if (color) group.colors.add(color);
    group.qty += Number(item.qty) || 0;
    group.cartons += Number(item.cartons) || 0;
    group.setsPerCarton = Math.max(group.setsPerCarton, Number(item.setsPerCarton) || 0);
  });

  let nextCarton = 1;
  const groups = [...map.values()].map(group => {
    const cartons = group.cartons > 0
      ? group.cartons
      : Math.max(1, Math.ceil(group.qty / (group.setsPerCarton || DEFAULT_PCS_PER_CARTON)));
    const pcsPerCarton = group.setsPerCarton > 0
      ? group.setsPerCarton
      : Math.round(group.qty / cartons);
    const colorLabel = group.colors.size > 1
      ? 'assorted colours & sizes'
      : ([...group.colors][0] || 'assorted colours & sizes');
    const startCarton = nextCarton;
    const endCarton = nextCarton + cartons - 1;
    nextCarton = endCarton + 1;

    return {
      ...group,
      cartons,
      pcsPerCarton,
      colorLabel,
      description: `${group.style}${group.gsm ? `, ${group.gsm} GSM` : ''} - ${colorLabel}`,
      cartonRange: cartons === 1 ? String(startCarton) : `${startCarton} - ${endCarton}`,
      totalPcs: group.qty
    };
  });

  const totalCartons = groups.reduce((sum, g) => sum + g.cartons, 0);
  const totalPieces = groups.reduce((sum, g) => sum + g.qty, 0);

  return { groups, totalCartons, totalPieces };
}

function buildPackingRows(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.map(item => {
    const sb = item.sizeBreakdown || {};
    const sizes = ['xs', 's', 'm', 'l', 'xl'].map(k => Number(sb[k]) || 0);
    return {
      label: `${String(item.style || '').trim() || 'Standard Style'} - ${String(item.color || 'Assorted').trim()}`,
      sizes,
      total: sizes.reduce((sum, n) => sum + n, 0) || Number(item.qty) || 0
    };
  });
}

function getPackingTotals(order) {
  const meta = getPackingMeta(order);
  const { groups, totalCartons, totalPieces } = buildPackingGroups(order);
  const rows = buildPackingRows(order);

  const sizeTotals = [0, 1, 2, 3, 4].map(index =>
    rows.reduce((sum, row) => sum + (Number(row.sizes[index]) || 0), 0)
  );

  const totalNetWeight = meta.netWeight > 0 ? meta.netWeight * totalCartons : 0;
  const totalGrossWeight = meta.grossWeight > 0 ? meta.grossWeight * totalCartons : 0;
  const computedCbm = meta.cartonLength > 0 && meta.cartonWidth > 0 && meta.cartonHeight > 0
    ? (meta.cartonLength * meta.cartonWidth * meta.cartonHeight * totalCartons) / 1000000
    : 0;
  const totalCbm = meta.cbm > 0 ? meta.cbm : computedCbm;

  const autoNotes = groups.length === 1
    ? `${totalCartons} cartons x ${groups[0].pcsPerCarton} pcs = ${totalPieces.toLocaleString()} pcs. Cartons are assorted - colours and sizes mixed. Per-colour and per-size pieces are shown above.`
    : `${totalCartons} cartons, ${totalPieces.toLocaleString()} pcs total. Cartons are assorted - colours and sizes mixed.`;

  return {
    ...meta,
    rows,
    groups,
    totalCartons,
    totalPieces,
    sizeTotals,
    totalNetWeight,
    totalGrossWeight,
    totalCbm,
    notes: meta.notes || autoNotes
  };
}

module.exports = {
  formatPackingListNumber,
  getPackingMeta,
  buildPackingGroups,
  buildPackingRows,
  getPackingTotals
};
