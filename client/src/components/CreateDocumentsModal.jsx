import React, { useState } from 'react';
import {
  X,
  Truck,
  Package,
  Receipt,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { getGatePassMeta } from '../utils/gatePass';
import { getPackingMeta } from '../utils/packingList';
import { getInvoiceMeta } from '../utils/invoice';

const DOCS = [
  {
    type: 'gatePass',
    title: 'Gate Pass',
    subtitle: 'Dispatch / vehicle details',
    icon: Truck,
    color: 'sky',
    isCreated: (order) => Boolean(order?.gatePassNo || order?.gatePassDate || order?.gatePassDriver || order?.gatePassVehicle),
    meta: (order) => {
      const m = getGatePassMeta(order);
      return { no: m.no, date: m.date };
    }
  },
  {
    type: 'packingList',
    title: 'Packing List',
    subtitle: 'Cartons, weights & CBM',
    icon: Package,
    color: 'emerald',
    isCreated: (order) => Boolean(order?.packingListNo || order?.packingDate),
    meta: (order) => {
      const m = getPackingMeta(order);
      return { no: m.no, date: m.date };
    }
  },
  {
    type: 'invoice',
    title: 'Commercial Invoice',
    subtitle: 'Amounts, terms & bank details',
    icon: Receipt,
    color: 'violet',
    isCreated: (order) => Boolean(order?.invoiceNo || order?.invoiceDate),
    meta: (order) => {
      const m = getInvoiceMeta(order);
      return { no: m.no, date: m.date };
    }
  }
];

const COLORS = {
  sky: {
    iconBox: 'bg-sky-50 text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-500',
    border: 'hover:border-sky-300'
  },
  emerald: {
    iconBox: 'bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    border: 'hover:border-emerald-300'
  },
  violet: {
    iconBox: 'bg-violet-50 text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-500',
    border: 'hover:border-violet-300'
  }
};

export default function CreateDocumentsModal({ order, onSelect, onClose }) {
  const [busy, setBusy] = useState(null);

  if (!order) return null;

  const handleSelect = async (type) => {
    if (!onSelect) return;
    try {
      setBusy(type);
      await onSelect(type, order);
    } catch (err) {
      alert(err.message || 'Document create nahi ho saka');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[72] bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Create Order Documents</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {order.orderNumber} • {order.customer} — jo document create karna hai, us par click karein
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DOCS.map((doc) => {
            const Icon = doc.icon;
            const colors = COLORS[doc.color];
            const created = doc.isCreated(order);
            const meta = doc.meta(order);
            const isBusy = busy === doc.type;

            return (
              <div
                key={doc.type}
                className={`rounded-xl border border-slate-200 p-4 flex flex-col justify-between transition ${colors.border}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBox}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full ${
                      created ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {created ? 'Created' : 'New'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-3">{doc.title}</h3>
                  <p className="text-[11px] text-slate-500">{doc.subtitle}</p>
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">No.</span>
                      <strong className="text-slate-800">{meta.no}</strong>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Date</span>
                      <strong className="text-slate-800">{meta.date || '—'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => handleSelect(doc.type)}
                  className={`mt-4 w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-white text-[11px] font-bold transition disabled:opacity-60 ${colors.button}`}
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : created ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{isBusy ? 'Creating...' : created ? `Open ${doc.title}` : `Create ${doc.title}`}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Har document create karne ke baad usi modal mein edit + PDF/Word milega.</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white text-[11px] font-bold transition shrink-0"
          >
            Baad mein
          </button>
        </div>

      </div>
    </div>
  );
}
