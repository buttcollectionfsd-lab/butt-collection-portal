import React, { useState } from 'react';
import { PlusCircle, PoundSterling, Trash2, Calendar, FileText, CheckCircle2, Search } from 'lucide-react';

export default function PaymentLedgerTab({ 
  payments, 
  orders, 
  stats, 
  openPaymentModal, 
  deletePayment 
}) {
  const [search, setSearch] = useState('');

  const filteredPayments = (payments || []).filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.customer?.toLowerCase().includes(q) ||
      p.orderNumber?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q) ||
      p.date?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Ledger Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed Orders</span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
              £{Number(stats?.totalBilled || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{stats?.totalOrders || 0} Orders invoiced</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Wasool (Total Received)</span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">
              £{Number(stats?.totalReceived || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600/70 mt-1">{payments?.length || 0} Payment installments received</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Bakaya (Total Balance Due)</span>
            <h3 className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
              £{Number(stats?.balanceDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-600/70 mt-1">Pending payments from buyers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <PoundSterling className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Action Header & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payments by Customer, Order, Reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={openPaymentModal}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition shadow-sm whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Wasool (Payment)</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer / Buyer</th>
                <th className="py-3 px-3">Order #</th>
                <th className="py-3 px-3 text-right">Wasool Amount (GBP)</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Slip / Reference</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {p.customer}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                        {p.orderNumber || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                      £{Number(p.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {p.method || 'Bank Transfer'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {p.reference || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={p.notes}>
                      {p.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => deletePayment(p.id)}
                        title="Delete Payment Record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
