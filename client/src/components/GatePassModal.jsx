import React from 'react';
import { Truck, Plus, Trash2, RotateCcw } from 'lucide-react';
import DocumentEditorModal from './DocumentEditorModal';
import GatePassDocument from './GatePassDocument';
import { getGatePassMeta, getGatePassTotals, getGatePassItems } from '../utils/gatePass';
import { getCompanyAddress } from '../utils/company';

const FIELDS = [
  // Document header
  { key: 'gatePassTitle', section: 'Document Header', label: 'Document Title', placeholder: 'GATE PASS' },
  { key: 'gatePassGeneratedOn', section: 'Document Header', label: 'Generated On', placeholder: '25/11/2026' },
  { key: 'gatePassCompanyName', section: 'Document Header', label: 'Company Name', placeholder: 'Butt Collection' },
  { key: 'gatePassCompanyTagline', section: 'Document Header', label: 'Tagline / City Line', placeholder: 'Quality Apparel Manufacturing & Export | Faisalabad, Pakistan' },
  { key: 'gatePassCompanyAddress', section: 'Document Header', label: 'Factory / Office Address', type: 'textarea', rows: 2 },

  // Dispatch details
  { key: 'gatePassNo', section: 'Dispatch Details', label: 'Gate Pass #', placeholder: 'GP-001' },
  { key: 'gatePassDate', section: 'Dispatch Details', label: 'Date', type: 'date' },
  { key: 'gatePassVehicle', section: 'Dispatch Details', label: 'Vehicle No.', placeholder: 'e.g. LEB-1234' },
  { key: 'gatePassDriver', section: 'Dispatch Details', label: 'Driver Name', placeholder: 'Driver ka naam' },
  { key: 'gatePassCustomer', section: 'Dispatch Details', label: 'Customer / Buyer', placeholder: 'Shahid Sab' },
  { key: 'gatePassDestination', section: 'Dispatch Details', label: 'Destination', placeholder: 'e.g. Faisalabad' },
  { key: 'gatePassOrderNo', section: 'Dispatch Details', label: 'Order #', placeholder: 'ORDER #001' },
  { key: 'gatePassPurpose', section: 'Dispatch Details', label: 'Purpose', placeholder: 'Dispatch of finished goods' },
  { key: 'gatePassRemarks', section: 'Dispatch Details', label: 'Remarks', type: 'textarea', rows: 2, placeholder: 'e.g. Maroon colour - 1 piece only' },

  // Signatures + footer
  { key: 'gatePassPreparedBy', section: 'Signatures & Footer', label: 'Signature 1 Label', placeholder: 'Prepared by Merchandiser' },
  { key: 'gatePassGateKeeper', section: 'Signatures & Footer', label: 'Signature 2 Label', placeholder: 'Gate Keeper' },
  { key: 'gatePassReceivedBy', section: 'Signatures & Footer', label: 'Signature 3 Label', placeholder: 'Driver / Received by' },
  { key: 'gatePassAuthorizedBy', section: 'Signatures & Footer', label: 'Signature 4 Label', placeholder: 'Authorized Signature' },
  { key: 'gatePassFooterNote', section: 'Signatures & Footer', label: 'Footer Note', type: 'textarea', rows: 2, placeholder: 'This gate pass is valid for the dispatch described above only.' }
];

const inputClass = 'w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

function ItemsEditor({ items, order, onChange }) {
  const list = Array.isArray(items) ? items : [];

  const updateItem = (index, key, value) => {
    onChange(list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    onChange([
      ...list,
      {
        id: `gp-item-${Date.now()}`,
        style: '',
        gsm: '',
        color: '',
        cartons: '',
        qty: '',
        remarks: ''
      }
    ]);
  };

  const removeItem = (index) => onChange(list.filter((_, i) => i !== index));

  const resetItems = () => {
    onChange(getGatePassItems({ ...order, gatePassItems: undefined }));
  };

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
          Dispatch Items ({list.length})
        </p>
        <button
          type="button"
          onClick={resetItems}
          className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-slate-800"
          title="Order ki original items wapas laayein"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {list.map((item, index) => (
          <div key={item.id || index} className="bg-white border border-slate-300 rounded-lg p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Item {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              value={item.style || ''}
              onChange={e => updateItem(index, 'style', e.target.value)}
              placeholder="Style / Description"
              className={inputClass}
            />

            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={item.gsm || ''}
                onChange={e => updateItem(index, 'gsm', e.target.value)}
                placeholder="GSM"
                className={inputClass}
              />
              <input
                value={item.color || ''}
                onChange={e => updateItem(index, 'color', e.target.value)}
                placeholder="Color"
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                value={item.cartons ?? ''}
                onChange={e => updateItem(index, 'cartons', e.target.value)}
                placeholder="Cartons"
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                value={item.qty ?? ''}
                onChange={e => updateItem(index, 'qty', e.target.value)}
                placeholder="Qty (pcs)"
                className={inputClass}
              />
            </div>

            <input
              value={item.remarks || ''}
              onChange={e => updateItem(index, 'remarks', e.target.value)}
              placeholder="Remarks"
              className={inputClass}
            />
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-2">
            Koi item nahi. Neeche se add karein.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 w-full flex items-center justify-center space-x-1 px-2 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-[11px] font-bold transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Item</span>
      </button>
    </div>
  );
}

const defaultTagline = (company) =>
  `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | ${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`;

const buildDefaults = (order, company) => {
  const meta = getGatePassMeta(order);
  return {
    gatePassTitle: order?.gatePassTitle || 'GATE PASS',
    gatePassGeneratedOn: order?.gatePassGeneratedOn || new Date().toLocaleDateString('en-GB'),
    gatePassCompanyName: order?.gatePassCompanyName || company?.name || 'Butt Collection',
    gatePassCompanyTagline: order?.gatePassCompanyTagline || defaultTagline(company),
    gatePassCompanyAddress: order?.gatePassCompanyAddress || getCompanyAddress(company),

    gatePassNo: meta.no,
    gatePassDate: meta.date,
    gatePassVehicle: order?.gatePassVehicle || '',
    gatePassDriver: order?.gatePassDriver || '',
    gatePassCustomer: order?.gatePassCustomer || order?.customer || '',
    gatePassDestination: order?.gatePassDestination || order?.dispatchCity || 'Faisalabad',
    gatePassOrderNo: order?.gatePassOrderNo || order?.orderNumber || '',
    gatePassPurpose: order?.gatePassPurpose || 'Dispatch of finished goods',
    gatePassRemarks: order?.gatePassRemarks || '',

    gatePassPreparedBy: order?.gatePassPreparedBy || 'Prepared by Merchandiser',
    gatePassGateKeeper: order?.gatePassGateKeeper || 'Gate Keeper',
    gatePassReceivedBy: order?.gatePassReceivedBy || 'Driver / Received by',
    gatePassAuthorizedBy: order?.gatePassAuthorizedBy || 'Authorized Signature',
    gatePassFooterNote: order?.gatePassFooterNote || 'This gate pass is valid for the dispatch described above only.',

    gatePassItems: getGatePassItems(order)
  };
};

export default function GatePassModal(props) {
  const totals = getGatePassTotals(props.order);
  const items = getGatePassItems(props.order);

  return (
    <DocumentEditorModal
      {...props}
      title="Dispatch Gate Pass"
      subtitle={`${totals.pieces.toLocaleString()} pcs • ${totals.cartons.toLocaleString()} cartons`}
      icon={Truck}
      fields={FIELDS}
      buildDefaults={buildDefaults}
      Preview={GatePassDocument}
      pdfEndpoint="/export/pdf/gate-pass"
      docxEndpoint="/export/docx/gate-pass"
      summaryText={`${items.length} item(s) • ${totals.pieces.toLocaleString()} pcs • ${totals.cartons.toLocaleString()} cartons`}
      helpText="Document header, customer/order #, dispatch items, signatures aur footer — sab kuch yahan se edit karein. Save ke baad PDF/Word naya banega."
      renderExtra={({ form, update }) => (
        <ItemsEditor
          items={form.gatePassItems}
          order={props.order}
          onChange={items => update('gatePassItems', items)}
        />
      )}
    />
  );
}
