import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const inputClass = 'w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

const emptyItem = () => ({
  style: '',
  gsm: '',
  color: '',
  cartons: '',
  qty: '',
  rate: '',
  amount: 0
});

/**
 * Item editor for standalone packing lists / invoices (documents created
 * without an existing order). Gate pass has its own richer editor.
 */
export default function DocumentItemsEditor({ items, onChange, mode = 'packing' }) {
  const list = Array.isArray(items) ? items : [];

  const updateItem = (index, key, value) => {
    onChange(list.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [key]: value };
      if (mode === 'invoice') {
        const qty = key === 'qty' ? Number(value) || 0 : Number(item.qty) || 0;
        const rate = key === 'rate' ? Number(value) || 0 : Number(item.rate) || 0;
        next.amount = qty * rate;
      }
      return next;
    }));
  };

  const addItem = () => onChange([...list, emptyItem()]);
  const removeItem = (index) => onChange(list.filter((_, i) => i !== index));

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
          Document Items ({list.length})
        </p>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center space-x-1 text-[10px] font-bold text-blue-700 hover:text-blue-900"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {list.map((item, index) => (
          <div key={item.id || index} className="bg-white border border-slate-300 rounded-lg p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Item {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              value={item.style || ''}
              onChange={e => updateItem(index, 'style', e.target.value)}
              placeholder="Style / Description"
              className={inputClass}
            />

            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={item.gsm || ''}
                onChange={e => updateItem(index, 'gsm', e.target.value)}
                placeholder="GSM"
                className={inputClass}
              />
              <input
                value={item.color || ''}
                onChange={e => updateItem(index, 'color', e.target.value)}
                placeholder="Color"
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                value={item.qty ?? ''}
                onChange={e => updateItem(index, 'qty', e.target.value)}
                placeholder="Qty (pcs)"
                className={inputClass}
              />
              {mode === 'packing' ? (
                <input
                  type="number"
                  min="0"
                  value={item.cartons ?? ''}
                  onChange={e => updateItem(index, 'cartons', e.target.value)}
                  placeholder="Cartons"
                  className={inputClass}
                />
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate ?? ''}
                  onChange={e => updateItem(index, 'rate', e.target.value)}
                  placeholder="Rate"
                  className={inputClass}
                />
              )}
            </div>

            {mode === 'invoice' && (
              <p className="text-right text-[10px] font-bold text-slate-600">
                Amount: £{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}
              </p>
            )}
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-2">
            Koi item nahi. Neeche Add se items likhein.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 w-full flex items-center justify-center space-x-1 px-2 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-[11px] font-bold transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Item</span>
      </button>
    </div>
  );
}
