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
  Calendar,
  Trash2,
  UserRound,
  Hash,
  Printer
} from 'lucide-react';
import { getGatePassMeta } from '../utils/gatePass';
import { getPackingMeta } from '../utils/packingList';
import { getInvoiceMeta } from '../utils/invoice';
import PrintCenterModal from './PrintCenterModal';

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

const TYPE_ICON = {
  gatePass: Truck,
  packingList: Package,
  invoice: Receipt
};

const TYPE_LABEL = {
  gatePass: 'Gate Pass',
  packingList: 'Packing List',
  invoice: 'Commercial Invoice'
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const createEmptyStandaloneForm = () => ({ customer: '', reference: '', date: todayIso() });

export default function OrderDocumentsTab({
  orders,
  company,
  standaloneDocs = [],
  onCreate,
  onOpen,
  onCreateStandalone,
  onDeleteStandalone
}) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders?.[0]?.id || '');
  const [busy, setBusy] = useState(null);
  const [standaloneBusy, setStandaloneBusy] = useState(null);
  const [standaloneForm, setStandaloneForm] = useState(createEmptyStandaloneForm);
  const [printCenterOpen, setPrintCenterOpen] = useState(false);

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

  const handleStandaloneCreate = async (doc) => {
    try {
      setStandaloneBusy(doc.type);
      await onCreateStandalone?.(doc.type, { ...standaloneForm });
      setStandaloneForm(createEmptyStandaloneForm());
    } catch (err) {
      alert(err.message || 'Document create nahi ho saka');
    } finally {
      setStandaloneBusy(null);
    }
  };

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
              Kisi order ke saath documents banayein, ya bilkul <strong className="text-white">alag document</strong> (order ke baghair) create karein.
              Document banne ke baad usi mein edit + PDF/Word milega.
            </p>
          </div>
        </div>
      </div>

      {/* Print Center */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Printer className="w-4 h-4" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Print Center</p>
            <p className="text-[11px] text-slate-500">
              Koi bhi saved document ya computer ki PDF/image file print karein — full print settings ke saath.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPrintCenterOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition shadow-sm shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Print Center Kholen</span>
        </button>
      </div>

      {/* Standalone documents */}
      <div id="standalone-docs" className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
              Alag Document — Order Ke Baghair
            </p>
            <h3 className="text-base font-bold text-slate-900 mt-1">Naya document seedha create karein</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Customer / reference optional hain — khali chhoren to Walk-in Customer aur MANUAL number use hoga.
              Date woh daalein jis din document use ho raha hai — baad mein edit bhi ho sakti hai.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
            Order se linked nahi
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="block">
            <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              <UserRound className="w-3 h-3" />
              <span>Customer / Party Name</span>
            </span>
            <input
              value={standaloneForm.customer}
              onChange={e => setStandaloneForm(prev => ({ ...prev, customer: e.target.value }))}
              placeholder="Walk-in Customer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              <Hash className="w-3 h-3" />
              <span>Order / Reference No. (optional)</span>
            </span>
            <input
              value={standaloneForm.reference}
              onChange={e => setStandaloneForm(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="e.g. BUYER-REF-22"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Document Date (use ka din)</span>
            </span>
            <input
              type="date"
              value={standaloneForm.date}
              onChange={e => setStandaloneForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            <span className="mt-1 block text-[10px] text-amber-700 font-semibold">
              Jis din gate pass / document use hoga woh date yahan set karein.
            </span>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DOCS.map(doc => {
            const Icon = doc.icon;
            const isBusy = standaloneBusy === doc.type;
            return (
              <button
                key={doc.type}
                type="button"
                disabled={Boolean(standaloneBusy)}
                onClick={() => handleStandaloneCreate(doc)}
                className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-white text-xs font-extrabold transition disabled:opacity-60 ${doc.theme.button}`}
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                <span>{isBusy ? 'Creating...' : `New ${doc.title}`}</span>
              </button>
            );
          })}
        </div>

        {standaloneDocs.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
              Alag Documents ({standaloneDocs.length})
            </p>
            <div className="space-y-2">
              {standaloneDocs.map(doc => {
                const Icon = TYPE_ICON[doc.standaloneType] || FilePlus;
                const meta = doc.standaloneType === 'gatePass'
                  ? getGatePassMeta(doc)
                  : doc.standaloneType === 'packingList'
                    ? getPackingMeta(doc)
                    : getInvoiceMeta(doc);
                const label = TYPE_LABEL[doc.standaloneType] || 'Document';
                return (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {label} • {meta.no}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {doc.customer || 'Walk-in Customer'} • {doc.orderNumber || 'MANUAL'} • {meta.date || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpen?.(doc.standaloneType, doc)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStandalone?.(doc)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order-linked documents */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
              Ya Kisi Order Ke Documents
            </p>
            <label className="text-xs font-bold text-slate-600">Order select karein</label>
          </div>
          <select
            value={order?.id || ''}
            onChange={e => setSelectedOrderId(e.target.value)}
            disabled={!orders?.length}
            className="w-full sm:w-auto min-w-[260px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {(!orders || orders.length === 0) && (
              <option value="">Koi order mojood nahi</option>
            )}
            {(orders || []).map(o => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} - {o.customer} ({o.totalPieces} pcs)
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span className="text-[11px] font-semibold text-amber-800">
            Bina order ke naya Gate Pass / Packing List / Invoice? Upar wale <strong>ALAG DOCUMENT</strong> box se create karein.
          </span>
          <button
            type="button"
            onClick={() => document.getElementById('standalone-docs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800 bg-white border border-amber-300 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition"
          >
            Wahan Jayein ↑
          </button>
        </div>

        {!orders || orders.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            Order ke mutabik documents ke liye pehle koi order add karein. Us se alag document upar se create ho sakta hai.
          </p>
        ) : (
          <>
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

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOCS.map(doc => {
                const Icon = doc.icon;
                const created = order ? doc.isCreated(order) : false;
                const meta = order ? doc.meta(order) : { no: '—', date: '—' };
                const isBusy = busy === doc.type;

                return (
                  <div key={doc.type} className={`bg-white rounded-2xl border ${doc.theme.ring} shadow-sm p-4 flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.theme.iconBox}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          created ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {created ? 'Created' : 'Not created'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-2">{doc.title}</h3>
                      <p className="text-[10px] text-slate-500">{doc.subtitle}</p>

                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-[11px]">
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
                      className={`mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-white text-xs font-extrabold transition disabled:opacity-60 ${doc.theme.button}`}
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
          </>
        )}
      </div>

      <div className="flex items-start space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-[11px]">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Alag documents order list, dashboard aur Excel tracker ko affect nahi karte — sirf isi page se Open/Delete hote hain.
          Order wale documents create karne par number aur date order ke saath save ho jate hain.
        </span>
      </div>

      {printCenterOpen && (
        <PrintCenterModal
          orders={orders || []}
          standaloneDocs={standaloneDocs}
          onClose={() => setPrintCenterOpen(false)}
        />
      )}

    </div>
  );
}
