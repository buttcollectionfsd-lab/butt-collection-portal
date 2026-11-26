import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Save,
  Download,
  ExternalLink,
  FileText,
  Eye,
  Loader2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { renderPdfPages, printImages, getPdfPrintStats } from '../utils/printPdf';
import PrintPreviewModal from './PrintPreviewModal';

const API_BASE = 'http://localhost:5000/api';

/**
 * Shared editor + preview shell for order documents (gate pass, packing
 * list, invoice). Each document supplies its fields and paper preview.
 */
export default function DocumentEditorModal({
  order,
  company,
  title,
  subtitle,
  icon: Icon,
  fields,
  buildDefaults,
  Preview,
  pdfEndpoint,
  docxEndpoint,
  pdfQuery,
  pdfLayout,
  pdfLayoutOptions,
  onPdfLayoutChange,
  format,
  formatOptions,
  onFormatChange,
  formatHint,
  helpText,
  summaryText,
  renderExtra,
  extraFirst = false,
  onSave,
  onClose
}) {
  const [form, setForm] = useState(() => buildDefaults(order, company));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('document');
  const [pdfVersion, setPdfVersion] = useState(0);
  const [pdfStamp, setPdfStamp] = useState(() => Date.now());
  const [printing, setPrinting] = useState(false);
  const [printStats, setPrintStats] = useState(null);
  const [printPreview, setPrintPreview] = useState(null);

  useEffect(() => {
    setForm(buildDefaults(order, company));
    setDirty(false);
    setPdfVersion(0);
    setPdfStamp(Date.now());
    setView('document');
  }, [order?.id]);

  const previewOrder = useMemo(() => ({ ...order, ...form }), [order, form]);

  const pdfUrl = order
    ? `${API_BASE}${pdfEndpoint}/${order.id}${pdfQuery ? `?${pdfQuery}` : ''}`
    : '';

  useEffect(() => {
    if (!pdfUrl) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const stats = await getPdfPrintStats(pdfUrl);
        if (!cancelled) setPrintStats(stats);
      } catch (_) {
        if (!cancelled) setPrintStats(null);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pdfUrl, pdfVersion]);

  if (!order) return null;

  const inlinePdfUrl = `${pdfUrl}${pdfQuery ? '&' : '?'}inline=1&v=${pdfVersion}&t=${pdfStamp}`;
  const docxUrl = `${API_BASE}${docxEndpoint}/${order.id}`;

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setSaving(true);
      await onSave(order.id, form);
      setDirty(false);
      setPdfVersion(v => v + 1);
    } catch (err) {
      alert(err.message || 'Document details save nahi ho sake');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      // Har print par taaza PDF, phir exact preview jo printer ko jayega.
      const printUrl = `${pdfUrl}${pdfQuery ? '&' : '?'}v=${Date.now()}`;
      const images = await renderPdfPages(printUrl);
      if (!images.length) throw new Error('PDF mein koi page nahi mila.');
      setPrintPreview({
        images,
        landscape: images[0].width > images[0].height,
        title: `${title} • ${order.orderNumber}`
      });
    } catch (err) {
      alert(err.message || 'Print preview nahi ban saka');
    } finally {
      setPrinting(false);
    }
  };

  const handleConfirmPrint = async () => {
    if (!printPreview) return;
    try {
      setPrintPreview(prev => (prev ? { ...prev, printing: true } : prev));
      await printImages(printPreview.images, {
        landscape: printPreview.landscape,
        title: printPreview.title
      });
      setPrintPreview(null);
    } catch (err) {
      setPrintPreview(prev => (prev ? { ...prev, printing: false } : prev));
      alert(err.message || 'Print nahi ho saka');
    }
  };

  return (
    <div className="fixed inset-0 z-[75] bg-slate-900/80 backdrop-blur-sm p-2 sm:p-5 flex items-start sm:items-center justify-center">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
              {Icon ? <Icon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{title}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {subtitle ? `${subtitle} • ` : ''}{order.orderNumber} • {order.customer}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            title="Close document"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] overflow-hidden">

          {/* Editor */}
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-y-auto max-h-[42vh] lg:max-h-none">
            <div className="space-y-3">
              {extraFirst && renderExtra ? renderExtra({ form, update }) : null}
              {fields.map((field, index) => {
                const previousSection = index > 0 ? fields[index - 1].section : null;
                return (
                  <React.Fragment key={field.key}>
                    {field.section && field.section !== previousSection && (
                      <p className="pt-2 text-[10px] font-extrabold uppercase tracking-widest text-blue-700 border-b border-slate-200 pb-1">
                        {field.section}
                      </p>
                    )}
                    <label className="block">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                        {field.label}
                      </span>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={field.rows || 3}
                          value={form[field.key] || ''}
                          onChange={e => update(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-y"
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={form[field.key] || ''}
                          onChange={e => update(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                      )}
                      {field.hint && (
                        <span className="mt-1 block text-[10px] font-semibold text-blue-700">
                          {field.hint}
                        </span>
                      )}
                    </label>
                  </React.Fragment>
                );
              })}

              {!extraFirst && renderExtra ? renderExtra({ form, update }) : null}
            </div>

            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
              <p className="font-bold text-slate-700 mb-1">Order se auto-linked</p>
              <p>{summaryText}</p>
              <p className="mt-1 text-slate-500">
                {helpText || 'Items order se auto aate hain. Style / qty change karne ke liye Edit Order use karein.'}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {formatOptions?.length > 0 && onFormatChange && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                    Document Format
                  </p>
                  <div className="flex flex-wrap gap-1 p-1 bg-slate-100 border border-slate-300 rounded-xl">
                    {formatOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onFormatChange(option.value)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                          format === option.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                        title={option.hint || option.label}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formatHint && (
                    <p className="mt-1 text-[10px] text-slate-500">{formatHint}</p>
                  )}
                </div>
              )}

              {pdfLayoutOptions?.length > 0 && onPdfLayoutChange && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                    Print Layout
                  </p>
                  <div className={`grid ${pdfLayoutOptions.length > 2 ? 'grid-cols-1' : 'grid-cols-2'} gap-1 p-1 bg-slate-100 border border-slate-300 rounded-xl`}>
                    {pdfLayoutOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onPdfLayoutChange(option.value)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                          pdfLayout === option.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                        title={option.hint || option.label}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {pdfLayout === 'landscape-2up' && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      PDF: landscape A4 par ek hi paper par do copies (left + right, beech mein cut guide). Word single portrait rehta hai.
                    </p>
                  )}
                  {pdfLayout === '2pages' && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      PDF: do full-size A4 pages — dono copies bilkul same size (1 per page jaisi), har page par ek. Word single portrait rehta hai.
                    </p>
                  )}
                  {pdfLayout === 'compact' && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      PDF: sirf jitni rows chahiye utni (jitne items) — khali numbered lines nahi, signatures table ke qareeb. Paper A4 portrait.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold transition shadow-sm"
              >
                {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>{printing ? 'Print preview ban raha hai...' : 'Print (pehle preview)'}</span>
              </button>
              <p className="text-[10px] text-slate-500 -mt-1">
                Print dabate hi pehle <b>Print Preview</b> khulega — paper ka size, direction (portrait/landscape) aur exact design waisa hi dikhega jaisa chhapega. Wahan <b>Print karein</b> se browser ka full print dialog khulega.
                PDF ka portrait/landscape pehle se <b>Print Layout</b> se tay hota hai (1 per page / 2 copies = portrait, 2 per page = landscape).
                {dirty ? ' Unsaved changes print nahi honge — pehle Save karein.' : ''}
              </p>

              {printStats && (
                <p className="text-[10px] font-semibold text-sky-700 -mt-1">
                  A4 {printStats.orientation === 'landscape' ? 'landscape' : 'portrait'} • {printStats.pages} page
                  {' • '}aakhri page {printStats.fillPercent}% bhara, {printStats.blankPercent}% khali
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !onSave}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-extrabold transition shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Document Details'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={pdfUrl}
                  download
                  className="flex items-center justify-center space-x-1.5 px-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
                <a
                  href={docxUrl}
                  download
                  className="flex items-center justify-center space-x-1.5 px-2 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word</span>
                </a>
              </div>

              <a
                href={inlinePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PDF in New Tab</span>
              </a>
            </div>
          </aside>

          {/* Preview */}
          <section className="bg-slate-200/70 overflow-y-auto flex flex-col min-h-0">
            <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setView('document')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    view === 'document'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Har baar PDF tab kholne par taaza PDF fetch ho (cached purani copy na dikhe).
                    setPdfStamp(Date.now());
                    setView('pdf');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    view === 'pdf'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                dirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {dirty ? 'Unsaved changes' : 'Saved'}
              </span>
            </div>

            <div className="p-3 sm:p-4 flex-1">
              {view === 'document' && (
                <div className="max-w-4xl mx-auto">
                  <Preview order={previewOrder} company={company} />
                </div>
              )}

              {view === 'pdf' && (
                <div className="space-y-2">
                  {dirty && (
                    <div className="flex items-start space-x-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-3 py-2 text-[11px]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>PDF purani saved details dikha raha hai. Naya PDF dekhne ke liye pehle Save karein.</span>
                    </div>
                  )}
                  <iframe
                    key={inlinePdfUrl}
                    src={inlinePdfUrl}
                    title={`${title} PDF preview`}
                    className="w-full h-[62vh] bg-white rounded-xl border border-slate-300 shadow-sm"
                  />
                  <p className="text-center text-[10px] text-slate-500">
                    PDF browser ke andar khul raha hai (bina download). Blank dikhe to "Open PDF in New Tab" use karein.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      <PrintPreviewModal
        preview={printPreview}
        onClose={() => setPrintPreview(null)}
        onPrint={handleConfirmPrint}
      />
    </div>
  );
}
