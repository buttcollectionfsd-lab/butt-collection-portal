import React from 'react';
import { Package } from 'lucide-react';
import DocumentEditorModal from './DocumentEditorModal';
import PackingListDocument from './PackingListDocument';
import { getPackingMeta, getPackingTotals } from '../utils/packingList';

const FIELDS = [
  { key: 'packingListNo', label: 'Packing List #', placeholder: 'PL-001' },
  { key: 'packingDate', label: 'Packing Date', type: 'date' },
  {
    key: 'packingNetWeight',
    label: 'Net Weight / Carton (kg)',
    type: 'number',
    placeholder: 'e.g. 18'
  },
  {
    key: 'packingGrossWeight',
    label: 'Gross Weight / Carton (kg)',
    type: 'number',
    placeholder: 'e.g. 20'
  },
  {
    key: 'packingCartonLength',
    label: 'Carton Length (cm)',
    type: 'number',
    placeholder: 'e.g. 60'
  },
  {
    key: 'packingCartonWidth',
    label: 'Carton Width (cm)',
    type: 'number',
    placeholder: 'e.g. 40'
  },
  {
    key: 'packingCartonHeight',
    label: 'Carton Height (cm)',
    type: 'number',
    placeholder: 'e.g. 30'
  },
  {
    key: 'packingCbm',
    label: 'Total CBM (optional)',
    type: 'number',
    placeholder: 'Auto from carton size'
  },
  {
    key: 'packingNotes',
    label: 'Notes',
    type: 'textarea',
    rows: 3,
    placeholder: 'e.g. Handle with care - dry place'
  }
];

const buildDefaults = (order) => {
  const meta = getPackingMeta(order);
  return {
    packingListNo: meta.no,
    packingDate: meta.date,
    packingNetWeight: order?.packingNetWeight || '',
    packingGrossWeight: order?.packingGrossWeight || '',
    packingCartonLength: order?.packingCartonLength || '',
    packingCartonWidth: order?.packingCartonWidth || '',
    packingCartonHeight: order?.packingCartonHeight || '',
    packingCbm: order?.packingCbm || '',
    packingNotes: order?.packingNotes || ''
  };
};

export default function PackingListModal(props) {
  const totals = getPackingTotals(props.order);

  return (
    <DocumentEditorModal
      {...props}
      title="Packing List"
      subtitle={`${totals.totalCartons.toLocaleString()} cartons • ${totals.totalPieces.toLocaleString()} pcs`}
      icon={Package}
      fields={FIELDS}
      buildDefaults={buildDefaults}
      Preview={PackingListDocument}
      pdfEndpoint="/export/pdf/packing-list"
      docxEndpoint="/export/docx/packing-list"
      summaryText={`${totals.totalCartons.toLocaleString()} cartons • ${totals.totalPieces.toLocaleString()} pcs • ${totals.groups.length} style group(s)`}
      helpText="Weight / CBM khali chhoren to document blanks dikhata hai. Totals cartons se auto calculate hote hain."
    />
  );
}
