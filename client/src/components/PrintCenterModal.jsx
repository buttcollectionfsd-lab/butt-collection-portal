import React, { useMemo, useState } from 'react';
import {
  X,
  Printer,
  Truck,
  Package,
  Receipt,
  Download,
  Loader2,
  Upload,
  FileText,
  Info
} from 'lucide-react';
import { getGatePassMeta } from '../utils/gatePass';
import { getPackingMeta } from '../utils/packingList';
import { getInvoiceMeta } from '../utils/invoice';
import { printPdf, printLocalFile } from '../utils/printPdf';

const API_BASE = 'http://localhost:5000/api';

const TYPES = [
  {
    type: 'gatePass',
    endpoint: 'gate-pass',
    label: 'Gate Pass',
    icon: Truck,
    color: 'bg-sky-600 hover:bg-sky-500',
    meta: getGatePassMeta,
    hasLayout: true
  },
  {
    type: 'packingList',
    endpoint: 'packing-list',
    label: 'Packing List',
    icon: Package,
    color: 'bg-emerald-600 hover:bg-emerald-500',
    meta: getPackingMeta,
    hasLayout: false
  },
  {
    type: 'invoice',
    endpoint: 'invoice',
    label: 'Commercial Invoice',
    icon: Receipt,
    color: 'bg-violet-600 hover:bg-violet-500',
    meta: getInvoiceMeta,
    hasLayout: true
  }
];

const LAYOUTS = [
  { value: 'form', label: '1 per page', hint: 'A4 portrait — poora document' },
  { value: 'landscape-2up', label: '2 per page', hint: 'A4 landscape — do copies ek paper par' }
];

export default function PrintCenterModal({ orders = [], standaloneDocs = [], onClose }) {
  const documents = useMemo(
    () => [
      ...orders.map(order => ({ ...order, _label: `${order.orderNumber} — ${order.customer}` })),
      ...standaloneDocs.map(doc => ({
        ...doc,
        _label: `${doc.orderNumber || 'MANUAL'} — ${doc.customer || 'Walk-in Customer'} (Alag document)`
      }))
    ],
    [orders, standaloneDocs]
  );

  const [source, setSource] = useState('app');
  const [selectedId, setSelectedId] = useState(documents[0]?.id || '');
  const [docType, setDocType] = useState('gatePass');
  const [layout, setLayout] = useState('form');
  const [copies, setCopies] = useState(1);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedDoc = documents.find(doc => doc.id === selectedId) || documents[0] || null;
  const typeConfig = TYPES.find(item => item.type === docType) || TYPES[0];
  const layoutQuery = typeConfig.hasLayout ? `?layout=${layout}` : '';

  const pdfUrl = selectedDoc
    ? `${API_BASE}/export/pdf/${typeConfig.endpoint}/${selectedDoc.id}${layoutQuery}`
    : '';

  const docMeta = selectedDoc && typeConfig.meta ? typeConfig.meta(selectedDoc) : null;

  const handlePrint = async () => {
    setError('');
    try {
      setBusy(true);
      if (source === 'file') {
        await printLocalFile(file, { copies });
      } else {
        if (!selectedDoc) throw new Error('Pehle document select karein.');
        await printPdf(pdfUrl, {
          copies,
          title: `${typeConfig.label} • ${selectedDoc.orderNumber || 'MANUAL'}`
        });
      }
    } catch (err) {
      setError(err.message || 'Print nahi ho saka');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Print Center</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Saved document ya computer ki file print karein — paper, orientation, margins, scale aur copies print dialog mein full set hote hain.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Close print center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">

          {/* Source switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 border border-slate-300 rounded-xl">
            <button
              type="button"
              onClick={() => { setSource('app'); setError(''); }}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold transition ${
                source === 'app' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Saved Document</span>
            </button>
            <button
              type="button"
              onClick={() => { setSource('file'); setError(''); }}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold transition ${
                source === 'file' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>File From Computer</span>
            </button>
          </div>

          {source === 'app' ? (
            <>
              {/* Document select */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                  Document select karein
                </label>
                <select
                  value={selectedDoc?.id || ''}
                  onChange={e => setSelectedId(e.target.value)}
                  disabled={documents.length === 0}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                >
                  {documents.length === 0 && <option value="">Koi document mojood nahi</option>}
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc._label}</option>
                  ))}
                </select>
                {documents.length === 0 && (
                  <p className="mt-1 text-[10px] text-rose-600">
                    Pehle Documents tab se koi document create karein.
                  </p>
                )}
              </div>

              {/* Type picker */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                  Kya print karna hai?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TYPES.map(item => {
                    const Icon = item.icon;
                    const active = docType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setDocType(item.type)}
                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-[11px] font-extrabold border-2 transition ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {docMeta && (
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    <strong>{docMeta.no}</strong> • {docMeta.date || '—'}
                    {selectedDoc?.customer ? ` • ${selectedDoc.customer}` : ''}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                Computer se file select karein (PDF / image)
              </label>
              <label className="flex items-center justify-between gap-2 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-3 py-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition">
                <div className="flex items-center space-x-2 min-w-0">
                  <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {file ? file.name : 'File choose karein'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      PDF / PNG / JPG — Word file ho to pehle PDF mein save karein
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 shrink-0">
                  Browse
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={e => {
                    setFile(e.target.files?.[0] || null);
                    setError('');
                  }}
                />
              </label>
            </div>
          )}

          {/* Settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Print Settings
            </p>

            {source === 'app' && typeConfig.hasLayout && (
              <div>
                <p className="text-[10px] font-bold text-slate-600 mb-1">Layout</p>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 border border-slate-300 rounded-xl">
                  {LAYOUTS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLayout(option.value)}
                      title={option.hint}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                        layout === option.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-600">Copies</p>
                <p className="text-[10px] text-slate-500">PDF mein kitni baar chhape</p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCopies(c => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-extrabold text-slate-900">{copies}</span>
                <button
                  type="button"
                  onClick={() => setCopies(c => Math.min(10, c + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-1.5 text-[10px] text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                Paper size (A4/A5/Letter), orientation, margins, scale aur printer copies — sab browser ke print dialog mein set honge, jo Print dabane par khulega.
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 rounded-xl px-3 py-2 text-[11px] font-semibold">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={busy || (source === 'file' && !file) || (source === 'app' && !selectedDoc)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-sm font-extrabold transition shadow-sm"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>{busy ? 'Document taiyar ho raha hai...' : 'Print Karein'}</span>
            </button>

            {source === 'app' && selectedDoc && (
              <a
                href={pdfUrl}
                download
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition"
              >
                <Download className="w-4 h-4" />
                <span>PDF Download</span>
              </a>
            )}
          </div>

          <p className="text-center text-[10px] text-slate-400">
            Print dabane par naya window khulega aur print dialog aayega. Popup block ho to browser mein allow karein.
          </p>
        </div>
      </div>
    </div>
  );
}
