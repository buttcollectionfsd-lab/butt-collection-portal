import React, { useState, useEffect } from 'react';
import { X, PoundSterling, Check } from 'lucide-react';

const defaultForm = {
  orderId: '',
  orderNumber: '',
  customer: 'Shahid Sab',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  method: 'Bank Transfer',
  reference: 'Wasool',
  notes: ''
};

export default function PaymentModal({ isOpen, onClose, onSave, orders }) {
  const [formData, setFormData] = useState(defaultForm);

  // Reset form every time modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...defaultForm,
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOrderSelect = (orderId) => {
    const selected = (orders || []).find(o => o.id === orderId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        orderId: selected.id,
        orderNumber: selected.orderNumber,
        customer: selected.customer,
        notes: `Payment for ${selected.orderNumber}`
      }));
    } else {
      setFormData(prev => ({ ...prev, orderId: '', orderNumber: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <PoundSterling className="w-5 h-5 text-emerald-400" />
              <span>Record Wasool (Payment)</span>
            </h2>
            <p className="text-xs text-emerald-200">
              Update Butt Collection ledger balance
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs md:text-sm">
          
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Related Order (Optional)
            </label>
            <select
              value={formData.orderId}
              onChange={e => handleOrderSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="">-- General Account Payment (Not tied to single order) --</option>
              {(orders || []).map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.customer} (Balance: £{Number(o.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Customer / Buyer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.customer}
              onChange={e => setFormData({ ...formData, customer: e.target.value })}
              placeholder="e.g. Shahid Sab, SP Imports"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Wasool Amount in GBP (£) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 5000"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Received</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash / Hand">Cash / Hand</option>
                <option value="Online / Wire">Online / Wire</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Slip / Reference ID</label>
            <input
              type="text"
              placeholder="e.g. Wasool - Installment 2, Bank Ref #1234"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Cleared via Habib Bank / Faisalabad factory"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition"
            >
              Save Payment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
