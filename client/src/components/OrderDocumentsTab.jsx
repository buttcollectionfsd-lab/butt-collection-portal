import React, { useState } from 'react';
import {
  Truck,
  Package,
  Receipt,
  FilePlus,
  PlusCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Building2,
  Calendar
} from 'lucide-react';
import { getGatePassMeta } from '../utils/gatePass';
import { getPackingMeta } from '../utils/packingList';
import { getInvoiceMeta } from '../utils/invoice';

const money = (value) =>
  `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

const DOCS = [
  {
    type: 'gatePass',
    title: 'Gate Pass',
    subtitle: 'Dispatch, vehicle & driver details',
    icon: Truck,
    theme: {
      iconBox: 'bg-sky-100 text-sky-700',
      button: 'bg-sky-600 hover:bg-sky-500',
      ring: 'border-sky-200'
    },
    isCreated: (order) => Boolean(order?.gatePassNo || order?.gatePassDate || order?.gatePassDriver || order?.gatePassVehicle),
    meta: (order) => {
      const m = getGatePassMeta(order);
      return { no: m.no, date: m.date };
    }
  },
  {
    type: 'packingList',
    title: 'Packing List',
    subtitle: 'Cartons, weights, CBM & packing notes',
    icon: Package,
    theme: {
      iconBox: 'bg-emerald-100 text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-500',
      ring: 'border-emerald-200'
    },
    isCreated: (order) => Boolean(order?.packingListNo || order?.packingDate),
    meta: (order) => {
      const m = getPackingMeta(order);
      return { no: m.no, date: m.date };
    }
  },
  {
    type: 'invoice',
    title: 'Commercial Invoice',
    subtitle: 'Amounts, payment terms & bank details',
    icon: Receipt,
    theme: {
      iconBox: 'bg-violet-100 text-violet-700',
      button: 'bg-violet-600 hover:bg-violet-500',
      ring: 'border-violet-200'
    },
    isCreated: (order) => Boolean(order?.invoiceNo || order?.invoiceDate),
    meta: (order) => {
      const m = getInvoiceMeta(order);
      return { no: m.no, date: m.date };
    }
  }
];

export default function OrderDocumentsTab({ orders, company, onCreate, onOpen }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders?.[0]?.id || '');
  const [busy, setBusy] = useState(null);

  const order = (orders || []).find(o => o.id === selectedOrderId) || (orders || [])[0] || null;

  const handleDoc = async (doc) => {
    if (!order) return;
    if (doc.isCreated(order)) {
      onOpen?.(doc.type, order);
      return;
    }
    try {
      setBusy(doc.type);
      await onCreate?.(doc.type, order);
    } catch (err) {
      alert(err.message || 'Document create nahi ho saka');
    } finally {
      setBusy(null);
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
        <FilePlus className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 mt-3">Abhi koi order nahi hai</h2>
        <p className="text-xs text-slate-500 mt-1">Pehle order add karein, phir yahan se Gate Pass, Packing List aur Invoice create karenge.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Gate Pass, Packing List &amp; Commercial Invoice</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Order select karein aur teenon documents yahan se <strong className="text-white">Create</strong> ya <strong className="text-white">Open</strong> karein.
              Document banne ke baad usi mein edit + PDF/Word milega.
            </p>
          </div>
        </div>
      </div>

      {/* Order selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Order select karein
          </label>
          <select
            value={order?.id || ''}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="w-full sm:w-auto min-w-[260px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(orders || []).map(o => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} - {o.customer} ({o.totalPieces} pcs)
              </option>
            ))}
          </select>
        </div>

        {order && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-500 flex items-center space-x-1"><Building2 className="w-3 h-3" /><span>Customer</span></span>
              <strong className="text-slate-800 block mt-0.5 truncate">{order.customer}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-500">Pieces / Cartons</span>
              <strong className="text-slate-800 block mt-0.5">{Number(order.totalPieces || 0).toLocaleString()} pcs</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-500">Billed / Balance</span>
              <strong className="text-slate-800 block mt-0.5">{money(order.totalAmount)} <span className="text-rose-600">/ {money(order.balance)}</span></strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-slate-500 flex items-center space-x-1"><Calendar className="w-3 h-3" /><span>Order Date</span></span>
              <strong className="text-slate-800 block mt-0.5">{order.orderDate || '—'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Document cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOCS.map(doc => {
          const Icon = doc.icon;
          const created = order ? doc.isCreated(order) : false;
          const meta = order ? doc.meta(order) : { no: '—', date: '—' };
          const isBusy = busy === doc.type;

          return (
            <div key={doc.type} className={`bg-white rounded-2xl border ${doc.theme.ring} shadow-sm p-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.theme.iconBox}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    created ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {created ? 'Created' : 'Not created'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-3">{doc.title}</h3>
                <p className="text-[11px] text-slate-500">{doc.subtitle}</p>

                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Document No.</span>
                    <strong className="text-slate-900">{meta.no}</strong>
                  </div>
                  <div className="flex justify-between gap-2 mt-1">
                    <span className="text-slate-500">Date</span>
                    <strong className="text-slate-900">{meta.date || '—'}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={Boolean(busy) || !order}
                onClick={() => handleDoc(doc)}
                className={`mt-5 w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-white text-xs font-extrabold transition disabled:opacity-60 ${doc.theme.button}`}
              >
                {isBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : created ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>{isBusy ? 'Creating...' : created ? `Open ${doc.title}` : `Create ${doc.title}`}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-start space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-[11px]">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Create karne par document ka number aur date order ke saath save ho jate hain. Uske baad PDF/Word download ya
          Exports Hub se bhi access kar sakte hain.
        </span>
      </div>

    </div>
  );
}
