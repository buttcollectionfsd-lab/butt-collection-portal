import React from 'react';
import { getInvoiceMeta } from '../utils/invoice';
import { getCompanyAddress } from '../utils/company';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

/**
 * A4-style commercial invoice linked to the order ledger.
 */
export default function InvoiceDocument({ order, company }) {
  const invoice = getInvoiceMeta(order);
  const items = order?.items || [];
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const generated = new Date().toLocaleDateString('en-GB');

  const statusStyles = invoice.paymentStatus === 'PAID'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : invoice.paymentStatus === 'PARTIAL'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  const metaFields = [
    ['Invoice #', invoice.no],
    ['Invoice Date', invoice.date],
    ['Order #', order?.orderNumber || '—'],
    ['Order Date', order?.orderDate || '—'],
    ['Customer / Buyer', order?.customer || '—'],
    ['Destination', order?.dispatchCity || 'Faisalabad'],
    ['Payment Terms', invoice.terms],
    ['Status', invoice.paymentStatus]
  ];

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
          <p className="text-lg sm:text-xl font-extrabold tracking-[0.18em]">INVOICE</p>
          <p className="text-[10px] text-blue-200 mt-1">Generated: {generated}</p>
        </div>
      </div>

      <div className="p-6 sm:p-8 text-slate-900">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border border-slate-300 rounded-md p-4 text-xs">
          {metaFields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <span className="font-semibold text-slate-500">{label}</span>
              {label === 'Status' ? (
                <span className={`font-extrabold px-2 py-0.5 rounded border text-[10px] ${statusStyles}`}>
                  {value}
                </span>
              ) : (
                <span className="font-bold text-slate-900 text-right">{value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Bill to */}
        <div className="mt-5 bg-slate-50 border border-slate-200 rounded-md p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Bill To / Ship To</p>
          <p className="text-base font-extrabold text-slate-900 mt-1">{order?.customer || '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {order?.dispatchCity || 'Faisalabad'} • {invoice.terms}
          </p>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
            Invoice Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-2 text-left">Style / Description</th>
                  <th className="py-2 px-2 text-center">GSM</th>
                  <th className="py-2 px-2 text-left">Color</th>
                  <th className="py-2 px-2 text-right">Qty (Pcs)</th>
                  <th className="py-2 px-2 text-right">Rate (£)</th>
                  <th className="py-2 px-2 text-right">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-5 px-2 text-center text-slate-400">Koi item add nahi kiya gaya.</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
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
                      <td className="py-2 px-2 text-right text-slate-700 border-t border-slate-200">
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
                  <td colSpan="3" className="py-2 px-2 text-slate-700 border-t border-slate-300">TOTAL</td>
                  <td className="py-2 px-2 text-right text-slate-900 border-t border-slate-300">
                    {totalQty.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border-t border-slate-300"></td>
                  <td className="py-2 px-2 text-right text-blue-800 border-t border-slate-300">
                    {money(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="border border-slate-300 bg-slate-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtotal</span>
            <span className="block font-mono font-extrabold text-slate-900 text-base mt-1">
              {money(invoice.total)}
            </span>
          </div>
          <div className="border border-emerald-200 bg-emerald-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Received</span>
            <span className="block font-mono font-extrabold text-emerald-700 text-base mt-1">
              {money(invoice.received)}
            </span>
          </div>
          <div className="border border-rose-200 bg-rose-50 rounded-md p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">Balance Due</span>
            <span className="block font-mono font-extrabold text-rose-600 text-base mt-1">
              {money(invoice.balance)}
            </span>
          </div>
        </div>

        {/* Notes / bank */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-xs">
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <p className="font-extrabold text-slate-700 mb-1">Notes / Terms</p>
            <p className="text-slate-600 whitespace-pre-wrap">{invoice.notes || invoice.terms || '—'}</p>
          </div>
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <p className="font-extrabold text-slate-700 mb-1">Bank / Payment Details</p>
            <p className="text-slate-600 whitespace-pre-wrap">
              {invoice.bankDetails || 'Please contact the merchandiser for bank transfer details.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-12">
          <div className="w-56 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">Authorized Signature / Factory</div>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-400 mt-8">Thank you for your business.</p>
      </div>
    </div>
  );
}
