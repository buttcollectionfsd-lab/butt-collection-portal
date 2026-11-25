import React from 'react';
import { getGatePassMeta, getGatePassTotals } from '../utils/gatePass';
import { getCompanyAddress } from '../utils/company';

/**
 * A4-style dispatch gate pass, matching the approved sample layout.
 * Used by the gate pass editor and its PDF tab for a no-download preview.
 */
export default function GatePassDocument({ order, company }) {
  const meta = getGatePassMeta(order);
  const items = meta.items;
  const totals = getGatePassTotals(order);

  const companyName = meta.companyName || company?.name || 'BUTT COLLECTION';
  const companyTagline = meta.companyTagline
    || `${company?.tagline || 'Quality Apparel Manufacturing & Export'} | ${company?.city || 'Faisalabad'}, ${company?.country || 'Pakistan'}`;
  const companyAddress = meta.companyAddress || getCompanyAddress(company);

  const metaFields = [
    ['Gate Pass #', meta.no],
    ['Vehicle No.', meta.vehicleNo || '—'],
    ['Date', meta.date],
    ['Driver Name', meta.driverName || '—'],
    ['Customer / Buyer', meta.customer || '—'],
    ['Destination', meta.destination || '—'],
    ['Order #', meta.orderNo || '—'],
    ['Purpose', meta.purpose || '—']
  ];

  const signatures = [meta.preparedBy, meta.gateKeeper, meta.receivedBy, meta.authorizedBy];

  return (
    <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 sm:px-8 py-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {companyName}
          </h1>
          <p className="text-[11px] sm:text-xs text-blue-100 mt-1">
            {companyTagline}
          </p>
          <p className="text-[10px] text-blue-200 mt-0.5">
            {companyAddress}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg sm:text-xl font-extrabold tracking-[0.18em]">{meta.title}</p>
          <p className="text-[10px] text-blue-200 mt-1">Generated: {meta.generatedOn}</p>
        </div>
      </div>

      <div className="p-6 sm:p-8 text-slate-900">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border border-slate-300 rounded-md p-4 text-xs">
          {metaFields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <span className="font-semibold text-slate-500">{label}</span>
              <span className="font-bold text-slate-900 text-right break-words">{value}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
            Dispatch Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="py-2 px-2 text-left">Style / Description</th>
                  <th className="py-2 px-2 text-center">GSM</th>
                  <th className="py-2 px-2 text-left">Color</th>
                  <th className="py-2 px-2 text-right">Cartons</th>
                  <th className="py-2 px-2 text-right">Qty (Pcs)</th>
                  <th className="py-2 px-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-3 px-2 text-center text-slate-500 border-t border-slate-200">
                      No dispatch items
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr key={item.id || index} className={index % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-2 px-2 font-semibold text-slate-900 border-t border-slate-200">
                      {item.style || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 border-t border-slate-200">
                      {item.gsm || '-'}
                    </td>
                    <td className="py-2 px-2 text-slate-600 border-t border-slate-200">
                      {item.color || 'Assorted'}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 border-t border-slate-200">
                      {Number(item.cartons) || '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-900 border-t border-slate-200">
                      {Number(item.qty || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-slate-600 border-t border-slate-200">
                      {item.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan="3" className="py-2 px-2 text-slate-700 border-t border-slate-300">
                    TOTAL
                  </td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {totals.cartons ? totals.cartons.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {totals.pieces.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border-t border-slate-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Totals + remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="border border-slate-300 bg-slate-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Pieces
            </span>
            <span className="block font-mono font-extrabold text-slate-900 text-lg mt-1">
              {totals.pieces.toLocaleString()}
            </span>
          </div>
          <div className="border border-slate-300 bg-slate-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Cartons
            </span>
            <span className="block font-mono font-extrabold text-slate-900 text-lg mt-1">
              {totals.cartons ? totals.cartons.toLocaleString() : '-'}
            </span>
          </div>
          <div className="border border-slate-300 bg-slate-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Remarks
            </span>
            <span className="block text-xs font-medium text-slate-800 mt-1 whitespace-pre-wrap">
              {meta.remarks || '—'}
            </span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-14 text-center text-[10px] text-slate-600">
          {signatures.map((label, index) => (
            <div key={`${label}-${index}`} className="border-t border-slate-400 pt-2">
              {label}
            </div>
          ))}
        </div>

        <p className="text-center text-[9px] text-slate-400 mt-8">
          {meta.footerNote}
        </p>
      </div>
    </div>
  );
}

