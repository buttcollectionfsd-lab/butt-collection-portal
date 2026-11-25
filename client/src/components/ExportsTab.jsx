import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Tag,
  Eye,
  Truck,
  Package,
  Receipt,
  FilePlus
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';

const API_BASE = 'http://localhost:5000/api';

export default function ExportsTab({ orders, labels, payments, company, openGatePass, openPackingList, openInvoice, openCreateDocuments }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders?.[0]?.id || '');
  const [selectedLabelId, setSelectedLabelId] = useState(labels?.[0]?.id || '');
  const [labelTemplate, setLabelTemplate] = useState('screenshot_bold');
  const [viewer, setViewer] = useState(null);

  const orderId = selectedOrderId || orders?.[0]?.id;
  const labelId = selectedLabelId || labels?.[0]?.id;
  const selectedOrder = (orders || []).find(o => o.id === orderId) || null;
  const viewerOrder = viewer?.orderId
    ? (orders || []).find(o => o.id === viewer.orderId)
    : null;

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Merchandiser Exports & Documentation Center</h2>
        <p className="text-sm text-slate-500 mt-1">
          Generate and download instant production sheets, ledgers, factory work orders, and carton labels in Microsoft Excel (.xlsx), Microsoft Word (.docx), and Adobe PDF formats.
        </p>
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3 inline-block">
          Naya: har document ko pehle <strong>View</strong> karein — PDF, Excel aur Work Order bina download ke andar hi dikhenge.
        </p>
      </div>

      {/* Create / manage order documents */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FilePlus className="w-4 h-4 text-slate-700" />
            <span>Create / Manage Order Documents</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kisi bhi order ke liye Gate Pass, Packing List aur Invoice create karein ya pehle se bane document kholen.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold min-w-[220px]"
          >
            {(orders || []).map(o => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} - {o.customer}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedOrder}
            onClick={() => openCreateDocuments?.(selectedOrder)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
          >
            <FilePlus className="w-4 h-4" />
            <span>Create / Open Documents</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Master Excel Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Full Excel Tracker (.xlsx)</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Complete multi-sheet spreadsheet:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1.5 list-disc list-inside">
              <li><strong>Order Tracker:</strong> Dashboard cards &amp; shipment status</li>
              <li><strong>Order Details:</strong> Line items, GSM, Qty, Rates (£)</li>
              <li><strong>Payment Ledger:</strong> Received &amp; balance</li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setViewer({ initialTab: 'excel', title: 'Excel Workbook Preview' })}
              className="flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 py-2.5 rounded-xl font-bold text-xs transition"
            >
              <Eye className="w-4 h-4" />
              <span>View Spreadsheet</span>
            </button>
            <a
              href={`${API_BASE}/export/excel`}
              download
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download .xlsx</span>
            </a>
          </div>
        </div>

        {/* Card 2: Microsoft Word (.docx) Work Order */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Word Document (.docx)</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Generates genuine editable Microsoft Word work order with Butt Collection header, product specifications, size ratio table, and factory stamp lines.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Order to Export:</label>
              <select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {(orders || []).map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.customer} ({o.totalPieces} Pcs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!orderId}
              onClick={() => setViewer({
                initialTab: 'work-order',
                orderId,
                title: 'Word / Work Order Preview'
              })}
              className="flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 py-2.5 rounded-xl font-bold text-xs transition disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>View Document</span>
            </button>
            <a
              href={`${API_BASE}/export/docx/order/${orderId}`}
              download
              className="flex items-center justify-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download .docx</span>
            </a>
          </div>
        </div>

        {/* Card 3: PDF Work Orders & Carton Labels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">PDF Documents &amp; Labels</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Export high-resolution printable PDF work orders or factory carton labels with customizable designs.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Carton Label:</label>
                <select
                  value={selectedLabelId}
                  onChange={e => setSelectedLabelId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {(labels || []).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.style} - {l.buyer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Label Template:</label>
                <select
                  value={labelTemplate}
                  onChange={e => setLabelTemplate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="screenshot_bold">⭐ Bold Dual-Box (Screenshot Default)</option>
                  <option value="classic_box">Classic Boxed (Design 1)</option>
                  <option value="minimal_clean">Minimal Rounded (Design 3)</option>
                  <option value="top_ctn">Top CTN Master (Design 4)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!labelId}
              onClick={() => setViewer({
                initialTab: 'pdf',
                title: 'Carton Label PDF',
                pdfUrl: `${API_BASE}/export/pdf/label/${labelId}?template=${labelTemplate}`
              })}
              className="flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 py-2 rounded-xl font-bold text-xs transition disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>View Label PDF</span>
            </button>

            <button
              type="button"
              disabled={!orderId}
              onClick={() => setViewer({
                initialTab: 'pdf',
                orderId,
                title: 'Order Sheet PDF'
              })}
              className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 py-2 rounded-xl font-bold text-xs transition disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>View Order PDF</span>
            </button>

            <a
              href={`${API_BASE}/export/pdf/label/${labelId}?template=${labelTemplate}`}
              download
              className="flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Tag className="w-4 h-4" />
              <span>Label PDF</span>
            </a>

            <a
              href={`${API_BASE}/export/pdf/order/${orderId}`}
              download
              className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl font-bold text-xs transition"
            >
              <FileText className="w-4 h-4" />
              <span>Order PDF</span>
            </a>
          </div>

          {/* Dispatch Gate Pass */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-700" />
                <span>Dispatch Gate Pass</span>
              </span>
              <span className="text-[10px] text-slate-400">Vehicle / driver editable</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                disabled={!selectedOrder}
                onClick={() => openGatePass?.(selectedOrder)}
                className="flex items-center justify-center space-x-1 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 py-2 rounded-xl font-bold text-[11px] transition disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              <a
                href={`${API_BASE}/export/pdf/gate-pass/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-sky-700 hover:bg-sky-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>
              <a
                href={`${API_BASE}/export/docx/gate-pass/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word</span>
              </a>
            </div>
          </div>

          {/* Packing List */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-700" />
                <span>Packing List</span>
              </span>
              <span className="text-[10px] text-slate-400">Weights / cartons editable</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                disabled={!selectedOrder}
                onClick={() => openPackingList?.(selectedOrder)}
                className="flex items-center justify-center space-x-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 py-2 rounded-xl font-bold text-[11px] transition disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              <a
                href={`${API_BASE}/export/pdf/packing-list/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>
              <a
                href={`${API_BASE}/export/docx/packing-list/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word</span>
              </a>
            </div>
          </div>

          {/* Commercial Invoice */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Receipt className="w-3.5 h-3.5 text-violet-700" />
                <span>Commercial Invoice</span>
              </span>
              <span className="text-[10px] text-slate-400">Terms / bank editable</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                disabled={!selectedOrder}
                onClick={() => openInvoice?.(selectedOrder)}
                className="flex items-center justify-center space-x-1 bg-violet-50 hover:bg-violet-100 border border-violet-300 text-violet-800 py-2 rounded-xl font-bold text-[11px] transition disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              <a
                href={`${API_BASE}/export/pdf/invoice/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-violet-700 hover:bg-violet-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>
              <a
                href={`${API_BASE}/export/docx/invoice/${orderId}`}
                download
                className="flex items-center justify-center space-x-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl font-bold text-[11px] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {viewer && (
        <DocumentViewerModal
          key={`${viewer.initialTab}-${viewer.orderId || 'all'}-${viewer.pdfUrl || 'default'}`}
          title={viewer.title}
          order={viewerOrder}
          orders={viewer.initialTab === 'excel' || viewer.orderId ? orders : undefined}
          payments={payments}
          company={company}
          initialTab={viewer.initialTab}
          pdfUrl={viewer.pdfUrl}
          onClose={() => setViewer(null)}
        />
      )}

    </div>
  );
}
