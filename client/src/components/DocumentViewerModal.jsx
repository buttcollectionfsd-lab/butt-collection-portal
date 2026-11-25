import React, { useMemo, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import WorkOrderDocument from './WorkOrderDocument';
import ExcelWorkbookPreview from './ExcelWorkbookPreview';

const API_BASE = 'http://localhost:5000/api';

const withInline = (url) =>
  url ? `${url}${url.includes('?') ? '&' : '?'}inline=1` : '';

/**
 * In-app document viewer. Shows the work-order layout, the real PDF
 * (inline, no forced download) and the Excel workbook data in HTML.
 */
export default function DocumentViewerModal({
  title = 'Document Preview',
  order,
  orders,
  payments,
  company,
  initialTab = 'work-order',
  pdfUrl,
  onClose
}) {
  const basePdfUrl = pdfUrl || (order ? `${API_BASE}/export/pdf/order/${order.id}` : '');
  const inlinePdfUrl = withInline(basePdfUrl);
  const excelDownloadUrl = `${API_BASE}/export/excel`;
  const docxDownloadUrl = order ? `${API_BASE}/export/docx/order/${order.id}` : '';

  const tabs = useMemo(() => {
    const list = [];
    if (order) list.push({ id: 'work-order', label: 'Work Order', icon: Eye });
    if (basePdfUrl) list.push({ id: 'pdf', label: 'PDF', icon: FileText });
    if (Array.isArray(orders)) list.push({ id: 'excel', label: 'Excel', icon: FileSpreadsheet });
    return list;
  }, [order, basePdfUrl, orders]);

  const [activeTab, setActiveTab] = useState(() =>
    tabs.some(t => t.id === initialTab) ? initialTab : (tabs[0]?.id || 'pdf')
  );

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm p-2 sm:p-5 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-6xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[94vh] overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Eye className="w-4 h-4 text-blue-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{title}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {order ? `${order.orderNumber} • ${order.customer}` : 'Preview without downloading'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs + actions */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {activeTab === 'pdf' && inlinePdfUrl && (
              <>
                <a
                  href={inlinePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </a>
                <a
                  href={basePdfUrl}
                  download
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </>
            )}

            {activeTab === 'work-order' && order && (
              <>
                {basePdfUrl && (
                  <a
                    href={basePdfUrl}
                    download
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}
                <a
                  href={docxDownloadUrl}
                  download
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word</span>
                </a>
              </>
            )}

            {activeTab === 'excel' && (
              <a
                href={excelDownloadUrl}
                download
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xlsx</span>
              </a>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-200/70">
          {activeTab === 'work-order' && order && (
            <div className="max-w-4xl mx-auto">
              <WorkOrderDocument order={order} company={company} />
            </div>
          )}

          {activeTab === 'pdf' && inlinePdfUrl && (
            <div className="space-y-2">
              <iframe
                key={inlinePdfUrl}
                src={inlinePdfUrl}
                title="PDF preview"
                className="w-full h-[65vh] bg-white rounded-xl border border-slate-300 shadow-sm"
              />
              <p className="text-center text-[10px] text-slate-500">
                PDF browser ke andar khul raha hai (bina download). Agar blank dikhe to "New Tab" use karein.
              </p>
            </div>
          )}

          {activeTab === 'excel' && (
            <ExcelWorkbookPreview orders={orders || []} payments={payments || []} company={company} />
          )}
        </div>

      </div>
    </div>
  );
}
