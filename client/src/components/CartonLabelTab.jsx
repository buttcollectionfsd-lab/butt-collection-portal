import React, { useState } from 'react';
import { Tag, Plus, Trash2, Printer, Download, Save, Check, Layout, Sparkles, Sliders } from 'lucide-react';
import ScriptWarning from './ScriptWarning';
import FitColorText from './FitColorText';
import { findArabicIssues, stripArabicFrom } from '../utils/arabicScript';

export default function CartonLabelTab({ labels, saveLabel }) {
  // Available Templates with 'screenshot_bold' as Default!
  const templates = [
    {
      id: 'screenshot_bold',
      name: 'Bold Dual-Box',
      badge: 'Screenshot Default',
      desc: 'Outer double border, prominent style title, bottom-split Total & CTN# boxes'
    },
    {
      id: 'classic_box',
      name: 'Classic Boxed',
      badge: 'Design 1',
      desc: 'Description label, top-right CTN# stamp box, and wide bottom total'
    },
    {
      id: 'minimal_clean',
      name: 'Minimal Rounded',
      badge: 'Design 3',
      desc: 'Modern rounded border, horizontal ruled table lines, clean minimalist typography'
    },
    {
      id: 'top_ctn',
      name: 'Top CTN Master',
      badge: 'Design 4',
      desc: 'Full-width CTN# box on very top, dual middle boxes for Buyer and Sets'
    }
  ];

  const [activeTemplate, setActiveTemplate] = useState('screenshot_bold');

  const [selectedLabel, setSelectedLabel] = useState(
    labels && labels.length > 0 ? labels[0] : {
      id: 'lbl-2',
      buyer: 'SP IMPORTS',
      style: 'ALOO7',
      description: 'ALOO7 SET',
      cartonNo: '',
      totalCartons: 32,
      masterCartons: 32,
      setsPerCarton: 30,
      totalSets: 30,
      rows: [
        { color: 'Black', xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 },
        { color: 'Gray', xs: 3, s: 3, m: 3, l: 3, xl: 3, total: 15 }
      ]
    }
  );

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...selectedLabel.rows];
    const row = { ...updatedRows[index], [field]: value };

    if (['xs', 's', 'm', 'l', 'xl'].includes(field)) {
      row[field] = Number(value) || 0;
      row.total = (Number(row.xs) || 0) + (Number(row.s) || 0) + (Number(row.m) || 0) + (Number(row.l) || 0) + (Number(row.xl) || 0);
    }

    updatedRows[index] = row;
    const perCarton = updatedRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

    setSelectedLabel(prev => ({
      ...prev,
      rows: updatedRows,
      setsPerCarton: perCarton,
      totalSets: perCarton
    }));
  };

  const addColorRow = () => {
    setSelectedLabel(prev => {
      const newRows = [
        ...prev.rows,
        { color: 'Navy', xs: 2, s: 2, m: 2, l: 2, xl: 2, total: 10 }
      ];
      const perCarton = newRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
      return {
        ...prev,
        rows: newRows,
        setsPerCarton: perCarton,
        totalSets: perCarton
      };
    });
  };

  const removeColorRow = (index) => {
    if (selectedLabel.rows.length === 1) return;
    setSelectedLabel(prev => {
      const newRows = prev.rows.filter((_, i) => i !== index);
      const perCarton = newRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
      return {
        ...prev,
        rows: newRows,
        setsPerCarton: perCarton,
        totalSets: perCarton
      };
    });
  };

  // Urdu / Arabic letters cannot be rendered by the carton label PDF.
  const scriptIssues = findArabicIssues(selectedLabel);

  const handleRemoveUrdu = () => {
    setSelectedLabel(prev => stripArabicFrom(prev));
  };

  // Naya label: bilkul khali form (naya id), save karne par presets mein add hota hai.
  const startNewLabel = () => {
    setSelectedLabel({
      id: `lbl-${Date.now()}`,
      buyer: selectedLabel.buyer || 'SP IMPORTS',
      style: '',
      styleSuffix: 'SET',
      masterLabel: 'MASTER',
      masterValue: '',
      cartonNo: '',
      setsPerCarton: 30,
      totalSets: 30,
      rows: [{ color: 'Black', xs: 2, s: 2, m: 2, l: 2, xl: 2, total: 10 }],
      notes: ''
    });
  };

  const isSavedLabel = (labels || []).some(lbl => lbl.id === selectedLabel.id);

  const handleSaveLabel = async () => {
    if (scriptIssues.length > 0) {
      alert('Urdu / Arabic text is not allowed on carton labels. Please fix the highlighted fields, or click "Remove Urdu text".');
      return;
    }
    if (!String(selectedLabel.buyer || '').trim() || !String(selectedLabel.style || '').trim()) {
      alert('Buyer / Brand Name aur Style / Model likhna zaroori hai — label ka naam inhi se banta hai.');
      return;
    }
    try {
      const saved = await saveLabel(selectedLabel);
      if (saved && saved.id && saved.id !== selectedLabel.id) {
        setSelectedLabel(prev => ({ ...prev, id: saved.id }));
      }
    } catch (_) {
      /* saveLabel khud error dikhata hai */
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Style ke aage ka lafz (SET / SUIT / PCS) user khud likhta hai.
  // Khali chhora jaye to title mein kuch nahi judta — bilkul jo type kiya wohi chhapta hai.
  const suffixValue = selectedLabel.styleSuffix === undefined || selectedLabel.styleSuffix === null
    ? 'SET'
    : String(selectedLabel.styleSuffix);
  const styleSuffix = suffixValue.trim().toUpperCase();
  const styleBase = String(selectedLabel.style || '').trim();
  const styleBaseUpper = styleBase.toUpperCase();
  const styleHasSuffix = Boolean(styleSuffix)
    && new RegExp(`(^|\\s)${styleSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(styleBaseUpper);
  const displayStyleTitle = styleBase
    ? (styleHasSuffix ? styleBaseUpper : [styleBaseUpper, styleSuffix].filter(Boolean).join(' '))
    : ['ALOO7', styleSuffix].filter(Boolean).join(' ');
  const unitPlural = styleSuffix ? `${styleSuffix}S` : '';
  const setsText = (count) => `${count}${unitPlural ? ` ${unitPlural}` : ''}`;

  // Master line optional hai: value likhi jaye to label par dikhti hai,
  // khali chhori jaye to box bilkul nahi aata (default label: MASTER).
  const masterLabelRaw = selectedLabel.masterLabel;
  const masterLabelText = (masterLabelRaw === undefined || masterLabelRaw === null ? 'MASTER' : String(masterLabelRaw)).trim();
  const masterValueText = String(selectedLabel.masterValue ?? '').trim();
  const hasMaster = Boolean(masterValueText);
  const masterText = masterLabelText ? `${masterLabelText}: ${masterValueText}` : masterValueText;

  // Live preview bhi PDF jaisi A4 height bharti hai (same proportions),
  // taake website par wohi dikhe jo print/PDF mein aata hai.
  const pvRows = Math.max(selectedLabel.rows.length, 1);
  const pvRowH = Math.min(130, Math.max(58, Math.floor((782 - 225 - 48 - 28 - 120) / pvRows)));
  const pvTableH = 48 + pvRowH * pvRows;
  const pvTableEnd = 225 + pvTableH;
  let pvBoxesTop = pvTableEnd + 28;
  let pvBoxH = 782 - pvBoxesTop;
  if (pvBoxH > 320) {
    pvBoxesTop = 782 - 320;
    pvBoxH = 320;
  }
  const PV_UNIT = 740;
  const pvHeaderPct = ((225 - 42) / PV_UNIT) * 100;
  const pvTablePct = (pvTableH / PV_UNIT) * 100;
  const pvGapPct = ((pvBoxesTop - pvTableEnd) / PV_UNIT) * 100;
  const pvBoxPct = (pvBoxH / PV_UNIT) * 100;
  const pvTableHeadPct = (48 / pvTableH) * 100;
  const pvNumClass = pvRowH >= 120 ? 'text-3xl' : pvRowH >= 90 ? 'text-2xl' : 'text-xl';

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Template Chooser */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <span>Carton Label Studio — Factory Ready Templates</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select design template, customize buyer, style & size breakdowns, and export print-ready labels.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Labels:</span>
            {(labels || []).map(lbl => (
              <button
                key={lbl.id}
                onClick={() => setSelectedLabel(lbl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                  selectedLabel.id === lbl.id
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lbl.style}
              </button>
            ))}
            <button
              onClick={startNewLabel}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title="Bilkul naya label banao — purane labels chhoote rahenge"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Label</span>
            </button>
          </div>
        </div>

        {/* 4 Multi-Design Template Selector Cards */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Choose Label Template:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map(tmpl => {
              const isSelected = activeTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setActiveTemplate(tmpl.id)}
                  className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    tmpl.id === 'screenshot_bold'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tmpl.badge}
                  </span>

                  <h4 className="font-bold text-slate-900 text-sm mt-1">{tmpl.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tmpl.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor & Live Preview 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print text-xs">
          <ScriptWarning issues={scriptIssues} onAction={handleRemoveUrdu} />

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Label Customizer</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Active: <strong className="text-blue-600">{templates.find(t => t.id === activeTemplate)?.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Buyer / Brand Name</label>
              <input
                type="text"
                value={selectedLabel.buyer}
                onChange={e => setSelectedLabel({ ...selectedLabel, buyer: e.target.value })}
                placeholder="SP IMPORTS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Style / Model</label>
              <div className="flex items-stretch gap-1.5">
                <input
                  type="text"
                  value={selectedLabel.style}
                  onChange={e => setSelectedLabel({ ...selectedLabel, style: e.target.value })}
                  placeholder="ALOO7"
                  className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-blue-700 uppercase focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <input
                  type="text"
                  value={suffixValue}
                  onChange={e => setSelectedLabel({ ...selectedLabel, styleSuffix: e.target.value })}
                  placeholder="SET"
                  title="Style ke aage ka lafz (SET / SUIT / PCS)"
                  className="w-16 shrink-0 px-1 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 uppercase text-center focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-blue-700 leading-tight">
                "SET" ki jagah jo chahein (SUIT / PCS) — khali chhorein to kuch nahi aayega
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Total Sets per Carton</label>
              <input
                type="number"
                value={selectedLabel.setsPerCarton || 30}
                onChange={e => setSelectedLabel({ ...selectedLabel, setsPerCarton: Number(e.target.value) || 0, totalSets: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                CTN # box label par hamesha khali rehta hai — wahan stamp/handwriting hoti hai.
              </span>
            </div>
          </div>

          {/* Master (optional) — ek pack/shopper mein kitne pcs, value likhein to label par box aata hai */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-amber-900 text-xs">Master / Pack (optional)</label>
              <span className="text-[10px] font-semibold text-amber-700 text-right leading-tight">
                {hasMaster ? 'Label par master box lagega' : 'Value khali hai — label par kuch nahi aayega'}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-amber-800 leading-snug">
              Master = ek pack / shopper jis mein suit ya hoodie rakhe jate hain — likhein ke ek pack mein kitne pcs hain (jaise 6 PCS). Yeh har design ke hisaab se alag hota hai, is liye khud edit karein.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-amber-900 block mb-1">Master Label</label>
                <input
                  type="text"
                  value={masterLabelText}
                  onChange={e => setSelectedLabel({ ...selectedLabel, masterLabel: e.target.value })}
                  placeholder="MASTER"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg font-bold text-xs uppercase text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-amber-900 block mb-1">Pcs per Master / Pack</label>
                <input
                  type="text"
                  value={String(selectedLabel.masterValue ?? '')}
                  onChange={e => setSelectedLabel({ ...selectedLabel, masterValue: e.target.value })}
                  placeholder="e.g. 6 PCS / 6 SUIT"
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color & Size Breakdown Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">Color Breakdown & Quantities</label>
              <button
                type="button"
                onClick={addColorRow}
                className="flex items-center space-x-1 text-blue-600 font-bold text-[11px] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Color</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedLabel.rows.map((row, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={row.color}
                      onChange={e => handleRowChange(idx, 'color', e.target.value)}
                      placeholder="Color Name (e.g. Black)"
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-xs w-36"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-800 text-xs">Total: {row.total}</span>
                      <button
                        type="button"
                        onClick={() => removeColorRow(idx)}
                        disabled={selectedLabel.rows.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                    {['xs', 's', 'm', 'l', 'xl'].map(sz => (
                      <div key={sz}>
                        <span className="uppercase font-bold text-slate-500">{sz}</span>
                        <input
                          type="number"
                          min="0"
                          value={row[sz] ?? 0}
                          onChange={e => handleRowChange(idx, sz, e.target.value)}
                          className="w-full py-1 bg-white border border-slate-300 rounded text-center font-mono text-xs font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleSaveLabel}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavedLabel ? 'Save Label Data' : 'Save New Label'}</span>
              </button>
              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap ${
                isSavedLabel ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isSavedLabel ? 'Saved ✓' : 'New — save nahi hua'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              {isSavedLabel
                ? 'Isi label mein tabdeeli kar ke Save dabayein to wohi label update hoga. Alag design rakhna ho to pehle + New Label dabayein.'
                : 'Yeh naya label hai — Save dabane par Saved Labels mein aa jayega aur PDF/export bhi isi se hoga.'}
            </p>
          </div>

        </div>

        {/* Right Column: Live Poster Label Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/5 p-6 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
          
          {/* Action Bar */}
          <div className="w-full max-w-md flex items-center justify-between mb-4 no-print">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Live Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {templates.find(t => t.id === activeTemplate)?.name}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>

              <a
                href={`http://localhost:5000/api/export/pdf/label/${selectedLabel.id}?template=${activeTemplate}&t=${Date.now()}`}
                download
                className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </a>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TEMPLATE 1: SCREENSHOT BOLD (DEFAULT)                          */}
          {/* Exact pixel replica of the user's uploaded screenshot!          */}
          {/* ============================================================== */}
          {activeTemplate === 'screenshot_bold' && (
            <div
              className="bg-white text-black p-3 sm:p-4 rounded-none shadow-2xl max-w-md w-full font-sans select-none border-[5px] border-black"
              style={{ aspectRatio: '595 / 842' }}
            >
              {/* Inner thin border */}
              <div className="border-[1.5px] border-black h-full flex flex-col overflow-hidden px-4 sm:px-5">

                {/* Header block: buyer + style (PDF jaisi proportions) */}
                <div className="flex flex-col shrink-0" style={{ height: `${pvHeaderPct}%` }}>
                  <div className="flex-1 flex items-center justify-center">
                    <h1 className="text-3xl font-black tracking-wide uppercase text-center leading-none">
                      {selectedLabel.buyer || 'SP IMPORTS'}
                    </h1>
                  </div>
                  <div className="h-[2.5px] bg-black w-full shrink-0" />
                  <div className="flex-1 flex items-center justify-center">
                    <h2 className="text-3xl font-black tracking-wide uppercase text-center leading-none break-words">
                      {displayStyleTitle}
                    </h2>
                  </div>
                  <div className="h-[2.5px] bg-black w-full shrink-0" />
                </div>

                {/* Sizing Grid Table (rows stretch to fill) */}
                <div className="border-[2px] border-black flex flex-col shrink-0" style={{ height: `${pvTablePct}%` }}>
                  <div
                    className="grid border-b-[2px] border-black text-center font-black text-xs shrink-0"
                    style={{ height: `${pvTableHeadPct}%`, gridTemplateColumns: '85fr 50fr 50fr 50fr 50fr 50fr 115fr' }}
                  >
                    <div className="border-r-[2px] border-black flex items-center justify-center text-[10px]">COLOUR</div>
                    <div className="border-r-[2px] border-black flex items-center justify-center">XS</div>
                    <div className="border-r-[2px] border-black flex items-center justify-center">S</div>
                    <div className="border-r-[2px] border-black flex items-center justify-center">M</div>
                    <div className="border-r-[2px] border-black flex items-center justify-center">L</div>
                    <div className="border-r-[2px] border-black flex items-center justify-center">XL</div>
                    <div className="flex items-center justify-center text-[10px]">TOTAL</div>
                  </div>

                  {selectedLabel.rows.map((r, i) => (
                    <div
                      key={i}
                      style={{ gridTemplateColumns: '85fr 50fr 50fr 50fr 50fr 50fr 115fr' }}
                      className={`grid text-center font-black flex-1 min-h-0 ${
                        i < selectedLabel.rows.length - 1 ? 'border-b-[2px] border-black' : ''
                      }`}
                    >
                      <div className="border-r-[2px] border-black flex items-center justify-center overflow-hidden [container-type:inline-size]">
                        <FitColorText text={r.color} maxSize={13} />
                      </div>
                      <div className={`border-r-[2px] border-black ${pvNumClass} flex items-center justify-center`}>{r.xs}</div>
                      <div className={`border-r-[2px] border-black ${pvNumClass} flex items-center justify-center`}>{r.s}</div>
                      <div className={`border-r-[2px] border-black ${pvNumClass} flex items-center justify-center`}>{r.m}</div>
                      <div className={`border-r-[2px] border-black ${pvNumClass} flex items-center justify-center`}>{r.l}</div>
                      <div className={`border-r-[2px] border-black ${pvNumClass} flex items-center justify-center`}>{r.xl}</div>
                      <div className={`${pvNumClass} flex items-center justify-center`}>{r.total}</div>
                    </div>
                  ))}
                </div>

                {/* Gap table aur boxes ke darmiyan */}
                <div className="shrink-0" style={{ height: `${pvGapPct}%` }} />

                {/* Bottom Section: TOTAL / MASTER / CTN # (page ke bottom tak)
                    Widths PDF jaisi: TOTAL 32%, MASTER 24.4%, CTN # baqi (zyada). */}
                <div className="flex shrink-0" style={{ height: `${pvBoxPct}%`, columnGap: '3.1%' }}>

                  {/* Left Box: TOTAL */}
                  <div
                    style={{ width: hasMaster ? '32%' : '39.1%' }}
                    className="border-[2.5px] border-black text-center flex flex-col justify-center items-center overflow-hidden"
                  >
                    <span className="text-sm font-black tracking-wider text-black uppercase block">
                      TOTAL
                    </span>
                    <span className="text-2xl font-black text-black tracking-tight mt-1 block">
                      {setsText(selectedLabel.setsPerCarton || 30)}
                    </span>
                  </div>

                  {/* Master Box: sirf tab jab master value likhi ho */}
                  {hasMaster && (
                    <div
                      style={{ width: '24.4%' }}
                      className="border-[2.5px] border-black text-center flex flex-col justify-center items-center overflow-hidden"
                    >
                      <span className="text-[10px] font-black tracking-wider text-black uppercase block leading-tight">
                        {masterLabelText || 'MASTER'}
                      </span>
                      <span className="text-xl font-black text-black tracking-tight mt-1 block break-words">
                        {masterValueText}
                      </span>
                    </div>
                  )}

                  {/* Right Box: CTN # — hamesha khali (hand stamping ke liye) */}
                  <div className="flex-1 border-[2.5px] border-black flex flex-col overflow-hidden">
                    <div className="border-b-[2px] border-black py-1.5 text-center font-black text-sm shrink-0">
                      CTN #
                    </div>
                    <div className="flex-1" />
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TEMPLATE 2: CLASSIC BOXED (Design 1)                           */}
          {/* ============================================================== */}
          {activeTemplate === 'classic_box' && (
            <div className="bg-white text-black p-6 rounded-none shadow-2xl max-w-md w-full font-sans select-none border-[5px] border-black relative">
              <div className="border-[1.5px] border-black p-5">
                
                {/* Header */}
                <div className="pt-2 pb-2">
                  <h1 className="text-3xl font-black tracking-wide uppercase">
                    {selectedLabel.buyer || 'SP IMPORTS'}
                  </h1>
                </div>
                <div className="h-[2px] bg-black w-full mb-3"></div>

                {/* Description on left, CTN# on right */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">DESCRIPTION</span>
                    <h2 className="text-2xl font-black">{displayStyleTitle}</h2>
                  </div>
                  <div className="border-2 border-black w-28 text-center">
                    <div className="bg-black text-white text-[11px] font-black py-0.5">CTN #</div>
                    <div className="h-10" />
                  </div>
                </div>

                {/* Table */}
                <div className="border-[2px] border-black mb-4">
                  <div className="grid border-b-[2px] border-black text-center font-black text-xs py-1.5" style={{ gridTemplateColumns: '85fr 50fr 50fr 50fr 50fr 50fr 120fr' }}>
                    <div className="col-span-1 border-r-[2px] border-black text-[10px]">COLOUR</div>
                    <div className="border-r-[2px] border-black">XS</div>
                    <div className="border-r-[2px] border-black">S</div>
                    <div className="border-r-[2px] border-black">M</div>
                    <div className="border-r-[2px] border-black">L</div>
                    <div className="border-r-[2px] border-black">XL</div>
                    <div>TOTAL</div>
                  </div>
                  {selectedLabel.rows.map((r, i) => (
                    <div key={i} className={`grid text-center font-black ${i < selectedLabel.rows.length - 1 ? 'border-b-[2px] border-black' : ''}`} style={{ gridTemplateColumns: '85fr 50fr 50fr 50fr 50fr 50fr 120fr' }}>
                      <div className="border-r-[2px] border-black py-3 flex items-center justify-center overflow-hidden [container-type:inline-size]">
                        <FitColorText text={r.color} maxSize={12} />
                      </div>
                      <div className="border-r-[2px] border-black py-3 text-lg">{r.xs}</div>
                      <div className="border-r-[2px] border-black py-3 text-lg">{r.s}</div>
                      <div className="border-r-[2px] border-black py-3 text-lg">{r.m}</div>
                      <div className="border-r-[2px] border-black py-3 text-lg">{r.l}</div>
                      <div className="border-r-[2px] border-black py-3 text-lg">{r.xl}</div>
                      <div className="py-3 text-lg">{r.total}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom Full-width Box */}
                <div className="border-[3px] border-black p-3 text-center">
                  <div className="border border-black py-2 text-xl font-black">
                    TOTAL: {setsText(selectedLabel.setsPerCarton || 30)}
                  </div>
                  {hasMaster && (
                    <div className="mt-2 text-sm font-black">{masterText}</div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TEMPLATE 3: MINIMAL ROUNDED (Design 3)                         */}
          {/* ============================================================== */}
          {activeTemplate === 'minimal_clean' && (
            <div className="bg-white text-black p-8 rounded-3xl shadow-2xl max-w-md w-full font-sans select-none border-[3px] border-black relative">
              <div className="flex items-baseline justify-between border-b-2 border-black pb-2 mb-4">
                <h1 className="text-2xl font-black uppercase">{selectedLabel.buyer || 'SP IMPORTS'}</h1>
                <div className="text-xs font-bold">CTN #  __________</div>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">STYLE</span>
                <h2 className="text-3xl font-black">{displayStyleTitle}</h2>
              </div>
              <div className="h-[2px] bg-black w-full mb-4"></div>

              {/* Table with clean horizontal ruled lines */}
              <div className="space-y-2 mb-6">
                <div className="grid text-center font-black text-xs pb-1 border-b border-black" style={{ gridTemplateColumns: '90fr 45fr 45fr 45fr 45fr 45fr 65fr' }}>
                  <div className="text-left">COLOUR</div>
                  <div>XS</div>
                  <div>S</div>
                  <div>M</div>
                  <div>L</div>
                  <div>XL</div>
                  <div>TOTAL</div>
                </div>
                {selectedLabel.rows.map((r, i) => (
                  <div key={i} className="grid text-center font-bold text-sm py-2.5 border-b border-black" style={{ gridTemplateColumns: '90fr 45fr 45fr 45fr 45fr 45fr 65fr' }}>
                    <div className="text-left flex items-center justify-start overflow-hidden [container-type:inline-size]">
                      <FitColorText text={r.color} maxSize={12} align="left" />
                    </div>
                    <div className="text-xl font-black">{r.xs}</div>
                    <div className="text-xl font-black">{r.s}</div>
                    <div className="text-xl font-black">{r.m}</div>
                    <div className="text-xl font-black">{r.l}</div>
                    <div className="text-xl font-black">{r.xl}</div>
                    <div className="text-xl font-black">{r.total}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between border-b-2 border-black pb-2 pt-2">
                <span className="text-base font-black">TOTAL</span>
                <span className="text-3xl font-black">{setsText(selectedLabel.setsPerCarton || 30)}</span>
              </div>
              {hasMaster && (
                <p className="mt-2 text-sm font-black">{masterText}</p>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TEMPLATE 4: TOP CTN MASTER (Design 4)                          */}
          {/* ============================================================== */}
          {activeTemplate === 'top_ctn' && (
            <div className="bg-white text-black p-6 rounded-none shadow-2xl max-w-md w-full font-sans select-none border-[4px] border-black relative">
              {/* CTN # at Top */}
              <div className="border-2 border-black p-3 mb-3 font-black text-xl">
                CTN #  ___________________
              </div>

              {/* Dual Middle Box */}
              <div className="grid grid-cols-12 gap-2 mb-3">
                <div className="col-span-8 border-2 border-black p-3">
                  <h1 className="text-base font-black">{selectedLabel.buyer || 'SP IMPORTS'}</h1>
                  <h2 className="text-xl font-black">{displayStyleTitle}</h2>
                </div>
                <div className="col-span-4 border-2 border-black p-2 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-black">{unitPlural}</span>
                  <span className="text-2xl font-black">{selectedLabel.setsPerCarton || 30}</span>
                </div>
              </div>

              {/* Table */}
              <div className="border-2 border-black mb-3">
                <div className="grid border-b-2 border-black text-center font-black text-xs py-1" style={{ gridTemplateColumns: '95fr 52fr 52fr 52fr 52fr 52fr 120fr' }}>
                  <div className="border-r-2 border-black">COLOUR</div>
                  <div className="border-r-2 border-black">XS</div>
                  <div className="border-r-2 border-black">S</div>
                  <div className="border-r-2 border-black">M</div>
                  <div className="border-r-2 border-black">L</div>
                  <div className="border-r-2 border-black">XL</div>
                  <div>TOTAL</div>
                </div>
                {selectedLabel.rows.map((r, i) => (
                  <div key={i} className={`grid text-center font-bold ${i < selectedLabel.rows.length - 1 ? 'border-b-2 border-black' : ''}`} style={{ gridTemplateColumns: '95fr 52fr 52fr 52fr 52fr 52fr 120fr' }}>
                    <div className="border-r-2 border-black py-2.5 flex items-center justify-center overflow-hidden [container-type:inline-size]">
                      <FitColorText text={r.color} maxSize={12} />
                    </div>
                    <div className="border-r-2 border-black py-2.5 text-lg font-black">{r.xs}</div>
                    <div className="border-r-2 border-black py-2.5 text-lg font-black">{r.s}</div>
                    <div className="border-r-2 border-black py-2.5 text-lg font-black">{r.m}</div>
                    <div className="border-r-2 border-black py-2.5 text-lg font-black">{r.l}</div>
                    <div className="border-r-2 border-black py-2.5 text-lg font-black">{r.xl}</div>
                    <div className="py-2.5 text-lg font-black">{r.total}</div>
                  </div>
                ))}
              </div>

              <div className="border-2 border-black py-2.5 text-center font-black text-xl">
                TOTAL: {setsText(selectedLabel.setsPerCarton || 30)}
                {hasMaster && (
                  <span className="block text-sm mt-0.5">{masterText}</span>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
