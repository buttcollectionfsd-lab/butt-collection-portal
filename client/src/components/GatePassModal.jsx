import React, { useState } from 'react';
import { Truck, Plus, Trash2, RotateCcw } from 'lucide-react';
import DocumentEditorModal from './DocumentEditorModal';
import GatePassDocument from './GatePassDocument';
import { getGatePassMeta, getGatePassTotals, getGatePassItems, getGatePassWeightUnit, formatGatePassWeight } from '../utils/gatePass';
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
  { key: 'gatePassDate', section: 'Dispatch Details', label: 'Gate Pass Date (use ka din)', type: 'date', hint: 'Jis din gate pass use ho raha hai woh date yahan khud daalein — koi bhi din.' },
  { key: 'gatePassVehicle', section: 'Dispatch Details', label: 'Vehicle No.', placeholder: 'e.g. LEB-1234' },
  { key: 'gatePassDriver', section: 'Dispatch Details', label: 'Driver Name', placeholder: 'Driver ka naam' },
  { key: 'gatePassDriverCell', section: 'Dispatch Details', label: 'Driver Cell No.', placeholder: '03xx-xxxxxxx' },
  { key: 'gatePassThrough', section: 'Dispatch Details', label: 'Through Mr. (Transporter / Agent)', placeholder: 'Transporter / agent ka naam' },
  { key: 'gatePassCustomer', section: 'Dispatch Details', label: 'Customer / Buyer', placeholder: 'Shahid Sab' },
  { key: 'gatePassDestination', section: 'Dispatch Details', label: 'Destination', placeholder: 'e.g. Faisalabad' },
  { key: 'gatePassOrderNo', section: 'Dispatch Details', label: 'Order # / GP Ref (jo chahein likhein)', placeholder: 'MANUAL-004 ya GP-004', hint: 'Yahan user kuch bhi likh sakta hai — order number ya GP number. Jo type karenge waisa hi print hoga; khali chhoren to yeh line print nahi hoti.' },
  { key: 'gatePassOrderLabel', section: 'Dispatch Details', label: 'Reference Line Label', placeholder: 'Order # / GP No.' },
  { key: 'gatePassPurpose', section: 'Dispatch Details', label: 'Purpose', placeholder: 'Dispatch of finished goods' },
  { key: 'gatePassRemarks', section: 'Dispatch Details', label: 'Remarks', type: 'textarea', rows: 2, placeholder: 'e.g. Maroon colour - 1 piece only' },

  // Totals (manual control)
  { key: 'gatePassTotalWeightLabel', section: 'Totals', label: 'Total Weight Label', placeholder: 'Total Weight' },
  { key: 'gatePassTotalWeightValue', section: 'Totals', label: 'Total Weight Value (jo chahein likhein)', placeholder: 'khali = rows ka auto total', hint: 'Manually koi bhi total likh sakte hain — jaise "127.050 kg" ya "127050 g (approx)". Khali chhoren to system khud rows ka total print karta hai.' },

  // Signatures + footer
  { key: 'gatePassPreparedBy', section: 'Signatures & Footer', label: 'Signature 1 — Prepared by', placeholder: 'Prepared by:' },
  { key: 'gatePassAuthorizedBy', section: 'Signatures & Footer', label: 'Signature 2 — Approved by', placeholder: 'Approved by:' },
  { key: 'gatePassReceivedBy', section: 'Signatures & Footer', label: 'Signature 3 — Received by', placeholder: 'Received by:' },
  { key: 'gatePassFooterNote', section: 'Signatures & Footer', label: 'Footer Note', type: 'textarea', rows: 2, placeholder: 'This gate pass is valid for the dispatch described above only.' }
];

const inputClass = 'w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-[9px] font-extrabold uppercase tracking-wide text-slate-500 mb-0.5';

function ItemsEditor({
  items,
  order,
  onChange,
  pcsMode = 'rows',
  onPcsModeChange,
  totalPcs,
  onTotalPcsChange,
  weightUnit = 'kg',
  onWeightUnitChange,
  manualTotalWeight = ''
}) {
  const list = Array.isArray(items) ? items : [];
  const totalBora = list.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0);
  const rowPcs = list.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalWeight = list.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  // "Pieces sirf Total mein" mode: rows par pcs nahi, Total row par ye number.
  const useTotalOnly = pcsMode === 'total';
  const displayPcs = useTotalOnly ? (Number(totalPcs) || 0) : rowPcs;
  const weightLabel = weightUnit === 'g' ? 'Weight (g)' : 'Weight (KG)';
  const manualTotalText = String(manualTotalWeight || '').trim();

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
        weight: '',
        remarks: ''
      }
    ]);
  };

  const removeItem = (index) => onChange(list.filter((_, i) => i !== index));

  const resetItems = () => {
    onChange(getGatePassItems({ ...order, gatePassItems: undefined }));
  };

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
          Dispatch Items — alag alag rows ({list.length})
        </p>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={resetItems}
            className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-slate-800"
            title="Order ki original items wapas laayein"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center space-x-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-[10px] text-slate-500 leading-snug">
        Har dispatch line alag row mein likhein — Description, Bora (bag/carton) aur Pieces.
        e.g. <span className="font-bold text-slate-700">Washing • 4 bora • 199 pcs</span>
      </p>

      <label className="mt-2 flex items-start gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={useTotalOnly}
          onChange={e => onPcsModeChange?.(e.target.checked ? 'total' : 'rows')}
          className="mt-0.5 accent-blue-600"
        />
        <span className="text-[10px] font-bold text-slate-600 leading-snug">
          Rows par pieces na likhein — sirf Total pieces dikhayein
          <span className="block font-medium text-slate-500">
            Bora-wise wazan likh sakte hain; pcs sirf neeche Total row mein aayega.
          </span>
        </span>
      </label>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Wazan unit</span>
        {['kg', 'g'].map(unit => (
          <button
            key={unit}
            type="button"
            onClick={() => onWeightUnitChange?.(unit)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition ${
              weightUnit === unit
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {unit === 'kg' ? 'KG' : 'Gram'}
          </button>
        ))}
        <span className="text-[9px] text-slate-400">
          {weightUnit === 'g' ? 'jaise 24150' : 'jaise 24.15'}
        </span>
      </div>

      {useTotalOnly && (
        <label className="mt-2 block">
          <span className={labelClass}>Total Pieces (PCS)</span>
          <input
            type="number"
            min="0"
            value={totalPcs ?? ''}
            onChange={e => onTotalPcsChange?.(e.target.value)}
            placeholder="e.g. 199"
            className={inputClass}
          />
        </label>
      )}

      <div className="mt-2 space-y-2">
        {list.map((item, index) => (
          <div key={item.id || index} className="bg-white border border-slate-300 rounded-lg p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Row {index + 1}
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

            <label className="block">
              <span className={labelClass}>Item / Description</span>
              <input
                value={item.style || ''}
                onChange={e => updateItem(index, 'style', e.target.value)}
                placeholder="e.g. Washing, Alo 002 Set"
                className={inputClass}
              />
            </label>

            <div className={`grid ${useTotalOnly ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
              <label className="block">
                <span className={labelClass}>Bora / Cartons</span>
                <input
                  type="number"
                  min="0"
                  value={item.cartons ?? ''}
                  onChange={e => updateItem(index, 'cartons', e.target.value)}
                  placeholder="4"
                  className={inputClass}
                />
              </label>
              {!useTotalOnly && (
                <label className="block">
                  <span className={labelClass}>Pieces (PCS)</span>
                  <input
                    type="number"
                    min="0"
                    value={item.qty ?? ''}
                    onChange={e => updateItem(index, 'qty', e.target.value)}
                    placeholder="199"
                    className={inputClass}
                  />
                </label>
              )}
              <label className="block">
                <span className={labelClass}>{weightLabel}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={Number(item.weight) > 0 ? item.weight : ''}
                  onChange={e => updateItem(index, 'weight', e.target.value)}
                  placeholder={weightUnit === 'g' ? 'e.g. 24150' : 'e.g. 24.15'}
                  className={inputClass}
                />
                {weightUnit === 'kg' && Number(item.weight) >= 1000 && (
                  <button
                    type="button"
                    onClick={() => updateItem(index, 'weight', String(Number((Number(item.weight) / 1000).toFixed(3))))}
                    className="mt-0.5 block text-[9px] font-bold text-blue-700 hover:underline text-left"
                  >
                    {Number(item.weight).toLocaleString()} g = {(Number(item.weight) / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg — kg mein badal dein
                  </button>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <label className="block">
                <span className={labelClass}>GSM (optional)</span>
                <input
                  value={item.gsm || ''}
                  onChange={e => updateItem(index, 'gsm', e.target.value)}
                  placeholder="280"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Colour (optional)</span>
                <input
                  value={item.color || ''}
                  onChange={e => updateItem(index, 'color', e.target.value)}
                  placeholder="Black"
                  className={inputClass}
                />
              </label>
            </div>

            <input
              value={item.remarks || ''}
              onChange={e => updateItem(index, 'remarks', e.target.value)}
              placeholder="Remarks (optional)"
              className={inputClass}
            />
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-2">
            Koi item nahi. Upar <b>Add Row</b> se dispatch line add karein.
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Total</span>
        <span className="text-[11px] font-extrabold text-slate-800">
          {totalBora.toLocaleString()} bora / ctn • {displayPcs.toLocaleString()} pcs
          {manualTotalText
            ? ` • Total Weight: ${manualTotalText}`
            : totalWeight > 0
              ? ` • Total Weight: ${formatGatePassWeight(totalWeight, weightUnit)} ${weightUnit === 'g' ? 'g' : 'kg'}`
              : ''}
        </span>
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 w-full flex items-center justify-center space-x-1 px-2 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-[11px] font-bold transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Dispatch Row</span>
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
    gatePassDriverCell: order?.gatePassDriverCell || '',
    gatePassThrough: order?.gatePassThrough || '',
    gatePassCustomer: order?.gatePassCustomer || order?.customer || '',
    gatePassDestination: order?.gatePassDestination || order?.dispatchCity || 'Faisalabad',
    gatePassOrderNo: order?.gatePassOrderNo ?? order?.orderNumber ?? '',
    gatePassOrderLabel: order?.gatePassOrderLabel || 'Order #',
    gatePassPurpose: order?.gatePassPurpose || 'Dispatch of finished goods',
    gatePassRemarks: order?.gatePassRemarks || '',
    gatePassTotalWeightLabel: order?.gatePassTotalWeightLabel || 'Total Weight',
    gatePassTotalWeightValue: order?.gatePassTotalWeightValue ?? '',

    gatePassPreparedBy: order?.gatePassPreparedBy || 'Prepared by:',
    gatePassAuthorizedBy: order?.gatePassAuthorizedBy || 'Approved by:',
    gatePassReceivedBy: order?.gatePassReceivedBy || 'Received by:',
    gatePassFooterNote: order?.gatePassFooterNote || 'This gate pass is valid for the dispatch described above only.',

    gatePassItems: getGatePassItems(order),
    gatePassPcsMode: order?.gatePassPcsMode === 'total' ? 'total' : 'rows',
    gatePassTotalPcs: order?.gatePassTotalPcs ?? '',
    gatePassWeightUnit: getGatePassWeightUnit(order)
  };
};

function GatePassPreview({ order, company, layout }) {
  if (layout === '2pages') {
    return (
      <div className="space-y-4">
        {[0, 1].map(index => (
          <div key={index} className="bg-white shadow-2xl rounded-sm">
            <GatePassDocument order={order} company={company} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'compact') {
    return <GatePassDocument order={order} company={company} compact />;
  }

  if (layout !== 'landscape-2up') {
    return <GatePassDocument order={order} company={company} />;
  }

  return (
    <div
      className="bg-white shadow-2xl rounded-sm border border-slate-400 p-2"
      style={{ aspectRatio: '297 / 210' }}
    >
      <div className="grid grid-cols-2 h-full">
        {[0, 1].map(index => (
          <div
            key={index}
            className={`overflow-hidden h-full ${index === 0 ? 'border-r border-dashed border-slate-400 pr-1' : 'pl-1'}`}
          >
            <div style={{ width: '200%', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <GatePassDocument order={order} company={company} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GatePassModal(props) {
  const totals = getGatePassTotals(props.order);
  const items = getGatePassItems(props.order);
  const [layout, setLayout] = useState('form');
  const savedUnit = getGatePassWeightUnit(props.order);
  const savedManualTotal = String(props.order?.gatePassTotalWeightValue || '').trim();
  const weightText = savedManualTotal
    ? ` • Total Weight: ${savedManualTotal}`
    : totals.weight > 0
      ? ` • Total Weight: ${formatGatePassWeight(totals.weight, savedUnit)} ${savedUnit === 'g' ? 'g' : 'kg'}`
      : '';

  const PreviewForLayout = (previewProps) => (
    <GatePassPreview {...previewProps} layout={layout} />
  );

  return (
    <DocumentEditorModal
      {...props}
      title="Dispatch Gate Pass"
      subtitle={`${totals.pieces.toLocaleString()} pcs • ${totals.cartons.toLocaleString()} bora / ctn${weightText}`}
      icon={Truck}
      fields={FIELDS}
      buildDefaults={buildDefaults}
      Preview={PreviewForLayout}
      pdfEndpoint="/export/pdf/gate-pass"
      docxEndpoint="/export/docx/gate-pass"
      pdfQuery={`layout=${layout}`}
      pdfLayout={layout}
      pdfLayoutOptions={[
        { value: 'form', label: '1 per page — portrait', hint: 'A4 portrait (khadi) — 12 rows wala poora form' },
        { value: 'compact', label: 'Compact — sirf zaroori rows', hint: 'A4 portrait — jitne items hain utni hi rows, khali lines nahi; signatures qareeb' },
        { value: '2pages', label: '2 copies — 2 portrait pages', hint: 'A4 portrait — do full-size copies, har page par ek' },
        { value: 'landscape-2up', label: '2 per page — landscape', hint: 'A4 landscape (leti) — do chhoti copies ek paper par' }
      ]}
      onPdfLayoutChange={setLayout}
      summaryText={`${items.length} item(s) • ${totals.pieces.toLocaleString()} pcs • ${totals.cartons.toLocaleString()} bora / ctn${weightText}`}
      helpText="Dispatch items upar alag alag rows mein add karein (Description, Bora, Pieces, Weight) — Wazan unit se KG ya Gram chunein, jaise 24.15 kg ya 24150 g. Party, vehicle, driver aur baqi fields neeche hain. Gate Pass Date khud set karein (jis din pass use ho)."
      extraFirst
      renderExtra={({ form, update }) => (
        <ItemsEditor
          items={form.gatePassItems}
          order={props.order}
          onChange={items => update('gatePassItems', items)}
          pcsMode={form.gatePassPcsMode === 'total' ? 'total' : 'rows'}
          onPcsModeChange={mode => {
            update('gatePassPcsMode', mode);
            if (mode === 'total' && !Number(form.gatePassTotalPcs)) {
              const rowSum = (form.gatePassItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
              if (rowSum > 0) update('gatePassTotalPcs', String(rowSum));
            }
          }}
          totalPcs={form.gatePassTotalPcs}
          onTotalPcsChange={value => update('gatePassTotalPcs', value)}
          weightUnit={form.gatePassWeightUnit === 'g' ? 'g' : 'kg'}
          manualTotalWeight={form.gatePassTotalWeightValue}
          onWeightUnitChange={next => {
            const current = form.gatePassWeightUnit === 'g' ? 'g' : 'kg';
            if (next === current) return;
            const factor = next === 'g' ? 1000 : 1 / 1000;
            const converted = (form.gatePassItems || []).map(item => {
              const weight = Number(item.weight) || 0;
              return { ...item, weight: weight ? String(Number((weight * factor).toFixed(3))) : '' };
            });
            update('gatePassItems', converted);
            update('gatePassWeightUnit', next);
          }}
        />
      )}
    />
  );
}
