import React from 'react';
import { getCompanyAddress } from '../utils/company';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

/**
 * A4-style work order paper. Used by the live form preview and by the
 * document viewer (so PDF / Word / Excel can all be inspected in-app).
 */
export default function WorkOrderDocument({ order, company }) {
  const items = order?.items || [];
  const totalPieces = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  const totalAmount = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const received = Number(order?.advancePaid ?? order?.amountReceived ?? 0) || 0;
  const balance = totalAmount - received;
  const hasSizes = items.some(i =>
    ['xs', 's', 'm', 'l', 'xl'].some(k => Number(i.sizeBreakdown?.[k]) > 0)
  );
  const docStatus = (order?.docStatus || '').trim();

  const meta = [
    ['Order / PO Number', order?.orderNumber],
    ['Order Date', order?.orderDate],
    ['Customer / Buyer', order?.customer],
    ['Delivery Deadline', order?.deadline],
    ['Manufacturer', order?.manufacturer || 'Butt Collection'],
    ['Production Status', order?.status],
    ['Dispatch City', order?.dispatchCity || 'Faisalabad'],
    ['Shipped On', order?.status === 'Shipped' ? (order?.shippedOn || order?.orderDate) : 'Pending']
  ];

  return (
    <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
      <div className="p-6 sm:p-10 text-slate-900">

        {/* Document header */}
        <div className="text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
            {company?.name || 'BUTT COLLECTION'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {company?.tagline || 'Garment Manufacturing & Merchandising'} | Faisalabad, Pakistan
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{getCompanyAddress(company)}</p>
          <p className="text-sm sm:text-base font-extrabold tracking-widest uppercase mt-3">
            {order?.docTitle ?? 'MERCHANDISER WORK ORDER'}
          </p>
          {docStatus && (
            <div className="mt-2">
              <span className="inline-block text-[10px] font-extrabold tracking-widest uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                {docStatus}
              </span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-5 text-xs">
          {meta.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <span className="font-semibold text-slate-500">{label}</span>
              <span className="font-bold text-slate-900 text-right">{value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
            Production Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="py-2 px-2 text-left">Style / Item</th>
                  <th className="py-2 px-2 text-center">GSM</th>
                  <th className="py-2 px-2 text-left">Color</th>
                  <th className="py-2 px-2 text-right">Cartons</th>
                  <th className="py-2 px-2 text-right">Qty (Pcs)</th>
                  <th className="py-2 px-2 text-right">Rate (£)</th>
                  <th className="py-2 px-2 text-right">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-5 px-2 text-center text-slate-400">
                      Koi item add nahi kiya gaya.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
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
                        {item.cartons || '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-900 border-t border-slate-200">
                        {Number(item.qty || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 border-t border-slate-200">
                        {money(item.rate)}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900 border-t border-slate-200">
                        {money(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan="3" className="py-2 px-2 text-slate-700 border-t border-slate-300">
                    TOTAL
                  </td>
                  <td className="py-2 px-2 border-t border-slate-300"></td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {totalPieces.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border-t border-slate-300"></td>
                  <td className="py-2 px-2 text-right text-blue-800 border-t border-slate-300">
                    {money(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Size matrix */}
        {hasSizes && (
          <div className="mt-6">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Size &amp; Ratio Breakdown (Pcs)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 border-collapse text-center">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="py-2 px-2 text-left">Item / Style</th>
                    <th className="py-2 px-2">XS</th>
                    <th className="py-2 px-2">S</th>
                    <th className="py-2 px-2">M</th>
                    <th className="py-2 px-2">L</th>
                    <th className="py-2 px-2">XL</th>
                    <th className="py-2 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const sb = item.sizeBreakdown || {};
                    const rowTotal =
                      (Number(sb.xs) || 0) + (Number(sb.s) || 0) + (Number(sb.m) || 0) +
                      (Number(sb.l) || 0) + (Number(sb.xl) || 0);
                    return (
                      <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-2 px-2 text-left font-semibold text-slate-800 border-t border-slate-200">
                          {item.style || '—'}
                        </td>
                        <td className="py-2 px-2 text-slate-600 border-t border-slate-200">{sb.xs || 0}</td>
                        <td className="py-2 px-2 text-slate-600 border-t border-slate-200">{sb.s || 0}</td>
                        <td className="py-2 px-2 text-slate-600 border-t border-slate-200">{sb.m || 0}</td>
                        <td className="py-2 px-2 text-slate-600 border-t border-slate-200">{sb.l || 0}</td>
                        <td className="py-2 px-2 text-slate-600 border-t border-slate-200">{sb.xl || 0}</td>
                        <td className="py-2 px-2 font-bold text-slate-900 border-t border-slate-200">
                          {rowTotal || item.qty || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="border border-slate-300 bg-slate-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Order Value
            </span>
            <span className="block font-mono font-extrabold text-slate-900 text-base mt-1">
              {money(order?.totalAmount ?? totalAmount)}
            </span>
          </div>
          <div className="border border-emerald-200 bg-emerald-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Received
            </span>
            <span className="block font-mono font-extrabold text-emerald-700 text-base mt-1">
              {money(received)}
            </span>
          </div>
          <div className="border border-rose-200 bg-rose-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Balance Due
            </span>
            <span className="block font-mono font-extrabold text-rose-600 text-base mt-1">
              {money(order?.balance ?? balance)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order?.notes && (
          <div className="mt-5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
            <strong className="text-slate-800">Notes:</strong> {order.notes}
          </div>
        )}

        {/* Footer signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 mt-12 text-center text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-2">
            {order?.footerLeft ?? 'Prepared by Merchandiser'}
          </div>
          <div className="border-t border-slate-400 pt-2">
            {order?.footerRight ?? 'Authorized Signature / Factory'}
          </div>
        </div>

      </div>
    </div>
  );
}
