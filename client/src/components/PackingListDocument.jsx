import React from 'react';
import { getPackingTotals } from '../utils/packingList';
import { getCompanyAddress } from '../utils/company';

/**
 * A4-style factory packing list matching the approved sample:
 * colour/size breakdown, carton details and weight/volume box.
 */
export default function PackingListDocument({ order, company }) {
  const data = getPackingTotals(order);
  const generated = new Date().toLocaleDateString('en-GB');

  const metaFields = [
    ['Packing List #', data.no],
    ['Manufacturer', order?.manufacturer || 'Butt Collection'],
    ['Customer / Buyer', order?.customer || '—'],
    ['Dispatch City', order?.dispatchCity || 'Faisalabad'],
    ['Order #', order?.orderNumber || '—'],
    ['Deadline', order?.deadline || '—'],
    ['Order Date', order?.orderDate || '—'],
    ['Packing Date', data.date || '—']
  ];

  const valueOrDash = (value, unit = '') =>
    Number(value) > 0 ? `${value}${unit ? ` ${unit}` : ''}` : '—';

  return (
    <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 sm:px-8 py-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {company?.name || 'BUTT COLLECTION'}
          </h1>
          <p className="text-[11px] sm:text-xs text-blue-100 mt-1">
            {company?.tagline || 'Quality Apparel Manufacturing & Export'} | Faisalabad, Pakistan
          </p>
          <p className="text-[10px] text-blue-200 mt-0.5">{getCompanyAddress(company)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg sm:text-xl font-extrabold tracking-[0.14em]">PACKING LIST</p>
          <p className="text-[10px] text-blue-200 mt-1">Generated: {generated}</p>
        </div>
      </div>

      <div className="p-6 sm:p-8 text-slate-900">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border border-slate-300 rounded-md p-4 text-xs">
          {metaFields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <span className="font-semibold text-slate-500">{label}</span>
              <span className="font-bold text-slate-900 text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Colour & size breakdown */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 mb-2">
            Packing Breakdown by Colour &amp; Size (Pcs)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 border-collapse text-center">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-2 text-left">Colour / Style</th>
                  <th className="py-2 px-2">XS</th>
                  <th className="py-2 px-2">S</th>
                  <th className="py-2 px-2">M</th>
                  <th className="py-2 px-2">L</th>
                  <th className="py-2 px-2">XL</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-5 px-2 text-slate-400">Koi item add nahi kiya gaya.</td>
                  </tr>
                ) : (
                  data.rows.map((row, index) => (
                    <tr key={index} className={index % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-2 text-left font-semibold text-slate-900 border-t border-slate-200">
                        {row.label}
                      </td>
                      {row.sizes.map((value, sizeIndex) => (
                        <td key={sizeIndex} className="py-2 px-2 text-slate-600 border-t border-slate-200">
                          {value}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right font-bold text-slate-900 border-t border-slate-200">
                        {row.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td className="py-2 px-2 text-left text-slate-700 border-t border-slate-300">TOTAL</td>
                  {data.sizeTotals.map((value, index) => (
                    <td key={index} className="py-2 px-2 text-slate-900 border-t border-slate-300">{value}</td>
                  ))}
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {data.totalPieces.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Carton details */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 mb-2">
            Carton Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-2 text-center">Carton No.</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-right">Pcs / Carton</th>
                  <th className="py-2 px-2 text-right">No. of Cartons</th>
                  <th className="py-2 px-2 text-right">Total Pcs</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-2 px-2 text-center font-semibold text-slate-900 border-t border-slate-200">
                      {group.cartonRange}
                    </td>
                    <td className="py-2 px-2 text-slate-700 border-t border-slate-200">{group.description}</td>
                    <td className="py-2 px-2 text-right text-slate-600 border-t border-slate-200">
                      {group.pcsPerCarton}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 border-t border-slate-200">
                      {group.cartons}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900 border-t border-slate-200">
                      {group.totalPcs.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan="3" className="py-2 px-2 text-slate-700 border-t border-slate-300">TOTAL</td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {data.totalCartons}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {data.totalPieces.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Weight & volume */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 mb-2">
            Weight &amp; Volume (fill after packing)
          </h2>
          <div className="border border-slate-300 rounded-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-xs">
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Net Weight / Carton</span>
              <span className="font-bold text-slate-900">{valueOrDash(data.netWeight, 'kg')}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Total Net Weight</span>
              <span className="font-bold text-slate-900">{valueOrDash(data.totalNetWeight.toFixed(2), 'kg')}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Gross Weight / Carton</span>
              <span className="font-bold text-slate-900">{valueOrDash(data.grossWeight, 'kg')}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Total Gross Weight</span>
              <span className="font-bold text-slate-900">{valueOrDash(data.totalGrossWeight.toFixed(2), 'kg')}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Carton Size (L x W x H)</span>
              <span className="font-bold text-slate-900">
                {data.cartonLength && data.cartonWidth && data.cartonHeight
                  ? `${data.cartonLength} x ${data.cartonWidth} x ${data.cartonHeight} cm`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1.5">
              <span className="font-semibold text-slate-600">Total CBM</span>
              <span className="font-bold text-slate-900">
                {data.totalCbm > 0 ? data.totalCbm.toFixed(3) : '—'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-slate-500">
          <strong>Notes:</strong> {data.notes}
        </p>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 sm:gap-16 mt-12 text-center text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-2">Prepared by Merchandiser</div>
          <div className="border-t border-slate-400 pt-2">Authorized Signature / Factory</div>
        </div>
      </div>
    </div>
  );
}
