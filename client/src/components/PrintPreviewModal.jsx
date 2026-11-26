import React from 'react';
import { Printer, X, Loader2, FileText } from 'lucide-react';

/**
 * Exact print preview: freshly rendered PDF pages jaisa hi print hoga —
 * paper size/orientation, page count aur design pehle dikhaya jata hai,
 * phir browser ka print dialog khulta hai.
 */
export default function PrintPreviewModal({ preview, onClose, onPrint }) {
  if (!preview) return null;
  const { images = [], landscape, title, printing } = preview;
  const orientation = landscape ? 'landscape (leti)' : 'portrait (khadi)';

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/90 backdrop-blur-sm p-2 sm:p-5 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 flex flex-col max-h-[96vh] overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">Print Preview</p>
              <p className="text-[10px] text-slate-400 truncate">
                {images.length} page • A4 {orientation} — bilkul yehi print hoga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Preview band karein"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-300 p-3 sm:p-6 space-y-5">
          {images.map((image, index) => (
            <div key={index} className="mx-auto w-full max-w-[600px]">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-600 mb-1">
                Page {index + 1} of {images.length} • A4 {landscape ? 'landscape' : 'portrait'}
              </p>
              <img
                src={image.dataUrl}
                alt={`Print page ${index + 1}`}
                className="w-full bg-white shadow-2xl border border-slate-400 rounded-sm"
              />
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between gap-2 text-white">
          <p className="hidden sm:block text-[10px] text-slate-400">
            {title} — paper A4, scale 100% par print karein.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-slate-700 hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onPrint}
              disabled={printing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition shadow-sm"
            >
              {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>{printing ? 'Print dialog khul raha hai...' : 'Print karein'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
