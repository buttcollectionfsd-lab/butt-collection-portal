import React, { useState } from 'react';
import { FileSpreadsheet, ListChecks, Table2, Wallet } from 'lucide-react';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

const SHEETS = [
  { id: 'tracker', label: 'Order Tracker', icon: FileSpreadsheet },
  { id: 'details', label: 'Order Details', icon: Table2 },
  { id: 'ledger', label: 'Payment Ledger', icon: Wallet }
];

/**
 * In-app preview of the generated Excel workbook. No download required —
 * the sheets are rendered as HTML tables and mirror the exported .xlsx data.
 */
export default function ExcelWorkbookPreview({ orders = [], payments = [], company }) {
  const [activeSheet, setActiveSheet] = useState('tracker');
  const validOrders = (orders || []).filter(o => o.orderNumber);
  const totalBilled = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalReceived = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = totalBilled - totalReceived;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Workbook title bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-bold tracking-wide">
              {company?.name || 'BUTT COLLECTION'} — EXCEL WORKBOOK PREVIEW
            </p>
            <p className="text-[10px] text-slate-400">
              Preview only — download se actual .xlsx file milegi
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <span className="text-emerald-300">Billed: {money(totalBilled)}</span>
          <span className="text-slate-300">Received: {money(totalReceived)}</span>
          <span className="text-rose-300">Balance: {money(balanceDue)}</span>
        </div>
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center space-x-1 px-3 pt-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
        {SHEETS.map(sheet => {
          const Icon = sheet.icon;
          const active = activeSheet === sheet.id;
          return (
            <button
              key={sheet.id}
              type="button"
              onClick={() => setActiveSheet(sheet.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 text-[11px] font-bold whitespace-nowrap rounded-t-lg border border-b-0 transition ${
                active
                  ? 'bg-white border-slate-300 text-emerald-700'
                  : 'bg-slate-200/60 border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sheet.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 sm:p-4 overflow-x-auto max-h-[62vh] overflow-y-auto">
        {activeSheet === 'tracker' && (
          <table className="w-full text-[11px] border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-[#243F60] text-white">
                {['Order #', 'Customer / Buyer', 'Items / Styles', 'Pieces', 'Cartons', 'Order Date', 'Deadline', 'Shipped On', 'Status', 'Balance (£)'].map(h => (
                  <th key={h} className="border border-slate-400 px-2 py-2 text-left font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                    Koi order record nahi hai.
                  </td>
                </tr>
              ) : validOrders.map(order => {
                const cartons = (order.items || []).reduce((sum, i) => sum + (Number(i.cartons) || 0), 0);
                const styles = (order.items || []).map(i => `${i.style} (${i.qty})`).join(', ') || 'N/A';
                return (
                  <tr key={order.id || order.orderNumber} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-900 whitespace-nowrap">{order.orderNumber}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-700">{order.customer}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-600 min-w-[220px]">{styles}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{Number(order.totalPieces || 0).toLocaleString()}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{cartons || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{order.orderDate || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{order.deadline || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{order.shippedOn || '-'}</td>
                    <td className={`border border-slate-300 px-2 py-1.5 font-bold whitespace-nowrap ${
                      order.status === 'Shipped' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {order.status}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      {money(order.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeSheet === 'details' && (
          <table className="w-full text-[11px] border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#1F497D] text-white">
                {['Order #', 'Order Date', 'Customer', 'Style / Item', 'GSM', 'Color', 'Qty (Pcs)', 'Rate (£)', 'Amount (£)', 'Notes'].map(h => (
                  <th key={h} className="border border-slate-400 px-2 py-2 text-left font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validOrders.every(o => !(o.items || []).length) ? (
                <tr>
                  <td colSpan="10" className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                    Koi line item nahi hai.
                  </td>
                </tr>
              ) : validOrders.flatMap(order =>
                (order.items || []).map((item, idx) => (
                  <tr key={`${order.id || order.orderNumber}-${item.id || idx}`} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-900 whitespace-nowrap">{order.orderNumber}</td>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{order.orderDate || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-700">{order.customer}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-semibold text-slate-800">{item.style || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center">{item.gsm || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5">{item.color || 'Assorted'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{Number(item.qty || 0).toLocaleString()}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{money(item.rate)}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-bold">{money(item.amount)}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-500 max-w-[200px] truncate" title={order.notes || ''}>
                      {order.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeSheet === 'ledger' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-[11px]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="block text-[9px] font-bold uppercase text-blue-600">Total Billed</span>
                <span className="font-mono font-extrabold text-blue-800">{money(totalBilled)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <span className="block text-[9px] font-bold uppercase text-emerald-600">Received</span>
                <span className="font-mono font-extrabold text-emerald-700">{money(totalReceived)}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="block text-[9px] font-bold uppercase text-rose-600">Balance Due</span>
                <span className="font-mono font-extrabold text-rose-700">{money(balanceDue)}</span>
              </div>
            </div>

            <table className="w-full text-[11px] border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-[#1E4E38] text-white">
                  {['Date', 'Customer', 'Order #', 'Payment (£)', 'Method', 'Reference / Slip', 'Notes'].map(h => (
                    <th key={h} className="border border-slate-400 px-2 py-2 text-left font-bold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(payments || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="border border-slate-300 px-3 py-6 text-center text-slate-400">
                      Koi payment record nahi hai.
                    </td>
                  </tr>
                ) : payments.map((pay, idx) => (
                  <tr key={pay.id || idx} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{pay.date || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-700">{pay.customer || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-semibold whitespace-nowrap">{pay.orderNumber || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {money(pay.amount)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5">{pay.method || 'Bank Transfer'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-600">{pay.reference || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-500 max-w-[200px] truncate" title={pay.notes || ''}>
                      {pay.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center space-x-1.5 text-[10px] text-slate-500">
        <ListChecks className="w-3.5 h-3.5" />
        <span>Yeh workbook ka live preview hai. Download button se poori .xlsx file save karein.</span>
      </div>
    </div>
  );
}
