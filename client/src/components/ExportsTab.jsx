import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Tag, CheckCircle2, ArrowRight, Layers } from 'lucide-react';

export default function ExportsTab({ orders, labels }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders?.[0]?.id || '');
  const [selectedLabelId, setSelectedLabelId] = useState(labels?.[0]?.id || '');
  const [labelTemplate, setLabelTemplate] = useState('screenshot_bold');

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Merchandiser Exports & Documentation Center</h2>
        <p className="text-sm text-slate-500 mt-1">
          Generate and download instant production sheets, ledgers, factory work orders, and carton labels in Microsoft Excel (.xlsx), Microsoft Word (.docx), and Adobe PDF formats.
        </p>
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
              Downloads complete multi-sheet spreadsheet:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1.5 list-disc list-inside">
              <li><strong>Order Tracker:</strong> Dashboard cards & shipment status</li>
              <li><strong>Order Details:</strong> Line items, GSM, Qty, Rates (£)</li>
              <li><strong>Payment Ledger:</strong> Wasool & Bakaya balances</li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <a
              href="http://localhost:5000/api/export/excel"
              download
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Tracker</span>
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

          <div className="pt-6 mt-6 border-t border-slate-100">
            <a
              href={`http://localhost:5000/api/export/docx/order/${selectedOrderId || orders?.[0]?.id}`}
              download
              className="w-full flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Word (.docx)</span>
            </a>
          </div>
        </div>

        {/* Card 3: PDF Work Orders & Carton Labels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">PDF Documents & Labels</h3>
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

          <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
            <a
              href={`http://localhost:5000/api/export/pdf/label/${selectedLabelId || labels?.[0]?.id}?template=${labelTemplate}`}
              download
              className="w-full flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Tag className="w-4 h-4" />
              <span>Download Carton Label PDF</span>
            </a>

            <a
              href={`http://localhost:5000/api/export/pdf/order/${selectedOrderId || orders?.[0]?.id}`}
              download
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl font-bold text-xs transition"
            >
              <FileText className="w-4 h-4" />
              <span>Download Order Sheet PDF</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
