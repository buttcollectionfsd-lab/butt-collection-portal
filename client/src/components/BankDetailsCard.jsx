import React, { useState } from 'react';
import { Copy, Check, Download, MessageCircle, Building2, CreditCard } from 'lucide-react';
import { getBankDetails, bankDetailsRows, buildBankDetailsText } from '../utils/bankDetails';

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch (_) {
    /* ignore */
  }
}

export default function BankDetailsCard({ company }) {
  const [copied, setCopied] = useState('');

  const bank = getBankDetails(company);
  const rows = bankDetailsRows(bank);
  const fullText = buildBankDetailsText(company);

  const flashCopied = (key) => {
    setCopied(key);
    setTimeout(() => setCopied(current => (current === key ? '' : current)), 1600);
  };

  const handleCopy = (key, value) => {
    copyToClipboard(value).then(() => flashCopied(key));
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const pdfHref = '/api/export/pdf/bank-details';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Bank Payment Details</h3>
            <p className="text-slate-400 text-xs mt-0.5">Client ko payment ke liye yehi details bhejein — copy karein ya PDF bhejein</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded self-start sm:self-auto">
          BANK TRANSFER / IBAN
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map(row => (
            <div
              key={row.key}
              className={`group rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 ${row.wide ? 'sm:col-span-2' : ''}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{row.label}</div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className={`text-sm font-bold text-slate-900 break-all ${row.mono ? 'font-mono' : ''}`}>
                  {row.value}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(row.key, row.value)}
                  title={`Copy ${row.label}`}
                  className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                >
                  {copied === row.key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            Download PDF (A4)
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp par bhejein
          </a>

          <button
            type="button"
            onClick={() => handleCopy('all', fullText)}
            className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-emerald-400 hover:text-emerald-700 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            {copied === 'all' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied === 'all' ? 'Copied!' : 'Copy All Details'}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
          <CreditCard className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Payment ke waqt client ko invoice / order number reference mein likhna batayein — wasool trace karna asaan hota hai.
        </p>
      </div>
    </div>
  );
}
