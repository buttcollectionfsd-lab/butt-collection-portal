import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Info } from 'lucide-react';

export default function OrderModal({ isOpen, onClose, onSave, editingOrder }) {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customer: 'Shahid Sab',
    manufacturer: 'Butt Collection',
    dispatchCity: 'Faisalabad',
    orderDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'In Progress',
    notes: '',
    items: [
      {
        id: `item-${Date.now()}-0`,
        style: '',
        gsm: '',
        color: 'Black',
        sizeBreakdown: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
        cartons: 0,
        setsPerCarton: 0,
        qty: 0,
        rate: 7.50,
        amount: 0
      }
    ]
  });

  useEffect(() => {
    if (editingOrder) {
      setFormData({
        ...editingOrder,
        items: editingOrder.items && editingOrder.items.length > 0 ? editingOrder.items : [
          {
            id: `item-${Date.now()}-0`,
            style: '',
            gsm: '',
            color: 'Black',
            sizeBreakdown: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
            cartons: 0,
            setsPerCarton: 0,
            qty: 0,
            rate: 7.50,
            amount: 0
          }
        ]
      });
    } else {
      setFormData({
        orderNumber: '',
        customer: 'Shahid Sab',
        manufacturer: 'Butt Collection',
        dispatchCity: 'Faisalabad',
        orderDate: new Date().toISOString().split('T')[0],
        deadline: '',
        status: 'In Progress',
        notes: '',
        items: [
          {
            id: `item-${Date.now()}-0`,
            style: '',
            gsm: '',
            color: 'Black',
            sizeBreakdown: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
            cartons: 0,
            setsPerCarton: 0,
            qty: 0,
            rate: 7.50,
            amount: 0
          }
        ]
      });
    }
  }, [editingOrder, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}-${prev.items.length}`,
          style: '',
          gsm: '',
          color: 'Black',
          sizeBreakdown: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
          cartons: 0,
          setsPerCarton: 0,
          qty: 0,
          rate: 7.50,
          amount: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: value };

      if (field === 'qty' || field === 'rate') {
        const q = field === 'qty' ? Number(value) || 0 : Number(item.qty) || 0;
        const r = field === 'rate' ? Number(value) || 0 : Number(item.rate) || 0;
        item.amount = Number((q * r).toFixed(2));
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const handleSizeChange = (index, size, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index] };
      item.sizeBreakdown = { ...item.sizeBreakdown, [size]: Number(value) || 0 };
      
      // Auto calculate sum of sizes for total qty
      const totalSizeQty = Object.values(item.sizeBreakdown).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
      if (totalSizeQty > 0) {
        item.qty = totalSizeQty;
        item.amount = Number((item.qty * (Number(item.rate) || 0)).toFixed(2));
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const totalPieces = formData.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  const totalAmount = formData.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orderNumber.trim() || !formData.customer.trim()) {
      alert('Please provide Order Number and Customer Name');
      return;
    }
    onSave({
      ...formData,
      totalPieces,
      totalAmount
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {editingOrder ? `Edit ${editingOrder.orderNumber}` : 'Create New Merchandiser Order'}
            </h2>
            <p className="text-xs text-slate-400">
              Butt Collection • Faisalabad Manufacturing & Export
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* General Order Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order / PO Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Order 6, ALOO9, JY008"
                value={formData.orderNumber}
                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Buyer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shahid Sab, SP Imports"
                value={formData.customer}
                onChange={e => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="In Progress">In Progress (Production)</option>
                <option value="Shipped">Shipped (Dispatched)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Deadline Date</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer & Dispatch City</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Manufacturer"
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={formData.dispatchCity}
                  onChange={e => setFormData({ ...formData, dispatchCity: e.target.value })}
                  placeholder="City"
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Garment Items & Production Breakdown</h3>
                <p className="text-xs text-slate-500">Styles, Fabric GSM, Color, Size distribution, and Rates in £ GBP</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    
                    <div className="col-span-12 md:col-span-3">
                      <label className="font-medium text-slate-600">Style / Item Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 300 GSM Gym Set"
                        value={item.style}
                        onChange={e => handleItemChange(idx, 'style', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="font-medium text-slate-600">Fabric GSM</label>
                      <input
                        type="text"
                        placeholder="e.g. 300"
                        value={item.gsm}
                        onChange={e => handleItemChange(idx, 'gsm', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="font-medium text-slate-600">Color</label>
                      <input
                        type="text"
                        placeholder="Black, Pink, etc."
                        value={item.color}
                        onChange={e => handleItemChange(idx, 'color', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <label className="font-medium text-slate-600">Cartons</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ctns"
                        value={item.cartons || ''}
                        onChange={e => handleItemChange(idx, 'cartons', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5 font-mono"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <label className="font-medium text-slate-600">Qty (Pcs)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={item.qty || ''}
                        onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5 font-mono font-semibold"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-1">
                      <label className="font-medium text-slate-600">Rate (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="£"
                        value={item.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs mt-0.5 font-mono"
                      />
                    </div>

                    <div className="col-span-3 md:col-span-1">
                      <label className="font-medium text-slate-600">Amount (£)</label>
                      <div className="py-1.5 font-mono font-bold text-slate-900 mt-0.5 text-right">
                        £{Number(item.amount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-end justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formData.items.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Size breakdown optional inputs */}
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">Size Breakdown (Pcs):</span>
                    {['xs', 's', 'm', 'l', 'xl'].map(sz => (
                      <div key={sz} className="flex items-center space-x-1">
                        <span className="uppercase text-[10px] font-bold text-slate-600">{sz}:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.sizeBreakdown?.[sz] || ''}
                          onChange={e => handleSizeChange(idx, sz, e.target.value)}
                          className="w-12 px-1 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Merchandiser Notes / Instructions
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Master packing 4 cartons × 8 sets, special stitching, buyer instructions"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer with Live Totals */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 bg-slate-100 px-4 py-2 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Total Quantity:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{totalPieces.toLocaleString()} Pcs</p>
              </div>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Order Total Value:</span>
                <p className="font-mono font-extrabold text-blue-700 text-sm">
                  £{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md transition"
              >
                {editingOrder ? 'Update Order' : 'Save Order'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
