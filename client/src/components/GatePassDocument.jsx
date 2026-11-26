import React from 'react';
import { getGatePassMeta, formatGatePassDate, formatGatePassWeight } from '../utils/gatePass';
import { getCompanyAddress } from '../utils/company';

const Field = ({ label, value, className = '' }) => (
  <div className={className}>
    <div className="flex items-end gap-1">
      <span className="font-bold whitespace-nowrap text-[10px]">{label}</span>
      <span className="flex-1 min-h-[15px] border-b border-black px-1 pb-0.5 text-[9px] font-bold truncate leading-tight">
        {value || ''}
      </span>
    </div>
  </div>
);

const CheckBox = ({ checked }) => (
  <span className="inline-flex w-3 h-3 border border-black items-center justify-center leading-none">
    {checked ? <span className="text-[9px] font-bold leading-none">X</span> : null}
  </span>
);

/**
 * A4 gate pass built to match the factory's pre-printed stationery:
 * company header, GATE PASS box (OUTWARD / RETURNABLE), party + transport
 * fields, a 12-row SR/DESCRIPTION/UNIT/QUANTITY/REMARKS table, and the
 * three signature lines.
 */
export default function GatePassDocument({ order, company, blank = false, compact = false }) {
  const meta = getGatePassMeta(order);

  const companyName = meta.companyName || company?.name || 'BUTT COLLECTION';
  const taglineParts = String(
    meta.companyTagline
      || `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | ${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`
  ).split('|').map(part => part.trim());
  const tagline = taglineParts[0] || '';
  const cityLine = taglineParts.slice(1).join(' | ')
    || `${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`;
  const companyAddress = meta.companyAddress || getCompanyAddress(company);

  const items = blank ? [] : (meta.items || []).slice(0, 12);
  const weightUnit = meta.weightUnit || 'kg';
  const pcsTotalOnly = String(order?.gatePassPcsMode || '') === 'total';
  const overridePcs = Number(order?.gatePassTotalPcs) || 0;
  const totalQty = pcsTotalOnly && overridePcs > 0
    ? overridePcs
    : items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalBora = items.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const value = (input) => (blank ? '' : input || '');

  const rows = Array.from(
    { length: compact ? Math.max(items.length, 1) : 12 },
    (_, index) => items[index] || null
  );
  const signatureLabels = [
    meta.preparedBy || 'Prepared by:',
    meta.authorizedBy || 'Approved by:',
    meta.receivedBy || 'Received by:'
  ];

  return (
    <div
      className="bg-white text-black px-6 pt-6 pb-5 shadow-2xl rounded-sm overflow-hidden"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-[26px] font-extrabold leading-none tracking-tight uppercase truncate">
            {companyName}
          </h1>
          <p className="mt-2 text-[10px] leading-tight truncate">{tagline}</p>
          <p className="text-[10px] leading-tight truncate">{cityLine}</p>
          <p className="mt-1 text-[7.5px] leading-snug">{companyAddress}</p>
        </div>

        <div className="w-[179px] shrink-0 border-[1.6px] border-black">
          <div className="text-center text-[12px] font-extrabold tracking-[0.12em] py-1 border-b border-black uppercase">
            {blank ? 'GATE PASS' : meta.title || 'GATE PASS'}
          </div>
          <div className="px-2 pt-1 pb-1.5 border-b border-black space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">OUTWARD</span>
              <CheckBox checked={!blank} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">RETURNABLE</span>
              <CheckBox checked={false} />
            </div>
          </div>
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[10px] font-bold">SR. NO.</span>
            <span className="text-[9px] font-bold">{blank ? '' : meta.no}</span>
          </div>
        </div>
      </div>

      <div className="h-[2.5px] bg-black mt-3" />

      {/* ---------- Party / transport ---------- */}
      <div className="mt-2.5 space-y-2">
        <div className="grid grid-cols-2 gap-x-6">
          <Field label="Party Name:" value={value(meta.customer)} />
          <Field label="Date:" value={value(formatGatePassDate(meta.date))} />
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <Field label="Through Mr.:" value={value(meta.through)} />
          <Field label="Vehicle #:" value={value(meta.vehicleNo)} />
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <Field label="Driver Name:" value={value(meta.driverName)} />
          <Field label="Driver Cell No.:" value={value(meta.driverCell)} />
        </div>
      </div>

      {/* ---------- Items table ---------- */}
      <table className="w-full mt-3 border-collapse table-fixed border-[1.6px] border-black text-[9px]">
        <colgroup>
          <col style={{ width: '5.7%' }} />
          <col style={{ width: '37.3%' }} />
          <col style={{ width: '11.5%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '21.5%' }} />
        </colgroup>
        <thead>
          <tr className="border-b-[1.6px] border-black">
            <th className="border-r border-black py-1.5 text-[10px] font-extrabold">SR</th>
            <th className="border-r border-black py-1.5 text-[10px] font-extrabold">DESCRIPTION</th>
            <th className="border-r border-black py-1.5 text-[10px] font-extrabold">BORA / CTN</th>
            <th className="border-r border-black py-1.5 text-[10px] font-extrabold">QTY (PCS)</th>
            <th className="border-r border-black py-1.5 text-[10px] font-extrabold">WEIGHT ({String(weightUnit).toUpperCase()})</th>
            <th className="py-1.5 text-[10px] font-extrabold">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const description = item
              ? [
                item.style,
                item.gsm && !String(item.style || '').includes(String(item.gsm)) ? `${item.gsm} GSM` : '',
                item.color
              ].filter(Boolean).join(' - ')
              : '';

            return (
              <tr key={item?.id || `row-${index}`} className="border-b border-black last:border-b-[1.6px]">
                <td className="border-r border-black py-1.5 text-center align-middle">{index + 1}</td>
                <td className="border-r border-black px-1.5 py-1.5 align-middle">
                  <span className="block truncate font-medium">{description}</span>
                </td>
                <td className="border-r border-black px-1 text-center align-middle font-semibold">
                  {item && Number(item.cartons) ? Number(item.cartons).toLocaleString() : item ? '-' : ''}
                </td>
                <td className="border-r border-black px-1.5 text-right align-middle font-semibold">
                  {item ? (Number(item.qty) ? Number(item.qty).toLocaleString() : '-') : ''}
                </td>
                <td className="border-r border-black px-1.5 text-right align-middle font-semibold">
                  {item ? (formatGatePassWeight(item.weight, weightUnit) || '-') : ''}
                </td>
                <td className="px-1.5 py-1.5 align-middle">
                  <span className="block truncate text-[8px]">{item?.remarks || ''}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-[1.6px] border-black font-extrabold">
            <td colSpan="2" className="border-r border-black px-2 py-1.5 text-right text-[11px]">
              Total
            </td>
            <td className="border-r border-black px-1 py-1.5 text-center text-[10px]">
              {blank ? '' : totalBora.toLocaleString()}
            </td>
            <td className="border-r border-black px-1.5 py-1.5 text-right text-[10px]">
              {blank ? '' : totalQty.toLocaleString()}
            </td>
            <td className="border-r border-black px-1.5 py-1.5 text-right text-[10px]">
              {blank ? '' : (meta.totalWeightValue || formatGatePassWeight(totalWeight, weightUnit) || '-')}
              {!blank && totalWeight > 0 && (
                <span className="block text-[6.5px] font-bold uppercase tracking-wide leading-tight">
                  {meta.totalWeightLabel || 'Total Weight'}
                </span>
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      {!blank && (meta.totalWeightValue || totalWeight > 0) && (
        <p className="mt-1.5 text-[10px] font-extrabold leading-tight">
          {meta.totalWeightLabel || 'Total Weight'}: {meta.totalWeightValue
            || `${formatGatePassWeight(totalWeight, weightUnit)} ${weightUnit === 'g' ? 'g' : 'kg'}`}
        </p>
      )}

      {/* Extra dispatch references kept visible without changing the form */}
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[8px] leading-tight text-black">
        {meta.orderNo && <span><b>{meta.orderLabel || 'Order #'}:</b> {meta.orderNo}</span>}
        {meta.destination && <span><b>Destination:</b> {meta.destination}</span>}
        {meta.purpose && <span><b>Purpose:</b> {meta.purpose}</span>}
        {meta.remarks && <span><b>Remarks:</b> {meta.remarks}</span>}
        {meta.generatedOn && <span><b>Generated:</b> {meta.generatedOn}</span>}
      </div>

      {/* ---------- Signatures ---------- */}
      <div className={`${compact ? 'mt-8' : 'mt-20'} grid grid-cols-3 gap-8`}>
        {signatureLabels.map((label, index) => (
          <div key={`${label}-${index}`}>
            <div className="h-[1px] bg-black" />
            <p className="mt-1.5 text-center text-[10px] font-bold">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
