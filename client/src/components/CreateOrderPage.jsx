import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Building2, 
  Calendar, 
  Clock, 
  PoundSterling, 
  Package, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function CreateOrderPage({ onSave, onCancel, editingOrder }) {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customer: 'Shahid Sab',
    manufacturer: 'Butt Collection',
    dispatchCity: 'Faisalabad',
    orderDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'In Progress',
    notes: '',
    advancePaid: 0,
    paymentMethod: 'Bank Transfer',
    paymentRef: 'Advance Wasool',
    items: [
      {
        id: `item-${Date.now()}-0`,
        style: '',
        gsm: '300',
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
        advancePaid: editingOrder.amountReceived || 0,
        paymentMethod: 'Bank Transfer',
        paymentRef: 'Wasool Record',
        items: editingOrder.items && editingOrder.items.length > 0 ? editingOrder.items : [
          {
            id: `item-${Date.now()}-0`,
            style: '',
            gsm: '300',
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
  }, [editingOrder]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}-${prev.items.length}`,
          style: prev.items[prev.items.length - 1]?.style || '',
          gsm: prev.items[prev.items.length - 1]?.gsm || '300',
          color: 'Gray',
          sizeBreakdown: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
          cartons: 0,
          setsPerCarton: 0,
          qty: 0,
          rate: prev.items[prev.items.length - 1]?.rate || 7.50,
          amount: 0
        }
      ]
    }));
  };

  const handleDuplicateItem = (idx) => {
    const source = formData.items[idx];
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...source,
          id: `item-${Date.now()}-${prev.items.length}`,
          color: source.color === 'Black' ? 'Gray' : 'Pink'
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

      // Calculate total pieces from sizes
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
  const totalCartons = formData.items.reduce((sum, i) => sum + (Number(i.cartons) || 0), 0);
  const balance = totalAmount - (Number(formData.advancePaid) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orderNumber.trim()) {
      alert('Order Number likhna zaroori hai (e.g. Order 6, ALOO9, JY008)');
      return;
    }
    if (!formData.customer.trim()) {
      alert('Customer / Buyer ka naam likhna zaroori hai (e.g. Shahid Sab, SP Imports)');
      return;
    }

    onSave({
      ...formData,
      totalPieces,
      totalAmount,
      amountReceived: Number(formData.advancePaid) || 0,
      balance
    });
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders List</span>
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {editingOrder ? `Edit Order Record — ${editingOrder.orderNumber}` : 'Full Production Order Entry Form'}
            </h1>
            <p className="text-xs text-slate-500">
              Butt Collection Faisalabad • Full Merchandiser Order Sheet & Production Record
            </p>
          </div>
        </div>

        {/* Live Top Financial Metric Ticker */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Pieces</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{totalPieces.toLocaleString()} Pcs</span>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Total</span>
            <span className="font-mono font-extrabold text-blue-700 text-sm">
              £{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Order Meta & Customer Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Order & Customer Details</h2>
              <p className="text-xs text-slate-400">Order identifier, buyer profile, production status, and timeline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-sm">
            
            {/* Order Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Order / PO Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Order 6, ALOO9, JY008"
                value={formData.orderNumber}
                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Customer / Buyer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shahid Sab, SP Imports"
                value={formData.customer}
                onChange={e => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              {/* Quick chip suggestions */}
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className="text-[10px] text-slate-400">Quick:</span>
                {['Shahid Sab', 'SP Imports'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, customer: c })}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Deadline Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Delivery Deadline Date <span className="text-amber-500 text-xs">(Alerts)</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Production Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Production Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                <option value="In Progress">In Progress (Currently in Production)</option>
                <option value="Shipped">Shipped (Dispatched from Factory)</option>
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Manufacturer / Factory</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Dispatch City */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Dispatch City / Origin</label>
              <input
                type="text"
                value={formData.dispatchCity}
                onChange={e => setFormData({ ...formData, dispatchCity: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Shipped Date if applicable */}
            {formData.status === 'Shipped' && (
              <div>
                <label className="block font-bold text-emerald-700 mb-1.5">Actual Shipped Date</label>
                <input
                  type="date"
                  value={formData.shippedOn || formData.orderDate}
                  onChange={e => setFormData({ ...formData, shippedOn: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            )}

          </div>
        </div>

        {/* Section 2: Garment Items Matrix (Wide, Full-Width Table) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Garment Items, Fabrics & Sizing Matrix</h2>
                <p className="text-xs text-slate-400">Add all line items, GSM, colors, size distributions (XS-XL), rates in £ GBP</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Line Item</span>
            </button>
          </div>

          {/* Large Line Items Table */}
          <div className="space-y-4">
            {formData.items.map((item, idx) => (
              <div key={item.id} className="bg-slate-50/80 border-2 border-slate-200 hover:border-blue-200 rounded-2xl p-4 transition space-y-3">
                
                {/* Row 1: Style, GSM, Color, Cartons, Qty, Rate, Amount */}
                <div className="grid grid-cols-12 gap-3 text-xs items-center">
                  
                  {/* Style Name */}
                  <div className="col-span-12 sm:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">
                      Style / Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 300 GSM Gym Set, W-FOX"
                      value={item.style}
                      onChange={e => handleItemChange(idx, 'style', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Fabric GSM */}
                  <div className="col-span-6 sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Fabric GSM</label>
                    <input
                      type="text"
                      placeholder="e.g. 300, 280"
                      value={item.gsm}
                      onChange={e => handleItemChange(idx, 'gsm', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                    />
                  </div>

                  {/* Color */}
                  <div className="col-span-6 sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Color / Fabric Tone</label>
                    <input
                      type="text"
                      placeholder="Black, Gray, Pink, Assorted"
                      value={item.color}
                      onChange={e => handleItemChange(idx, 'color', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                    />
                  </div>

                  {/* Cartons */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="font-bold text-slate-700 block mb-1">Cartons</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ctns"
                      value={item.cartons || ''}
                      onChange={e => handleItemChange(idx, 'cartons', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold"
                    />
                  </div>

                  {/* Total Qty (Pcs) */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="font-bold text-slate-700 block mb-1">Total Pcs</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Qty"
                      value={item.qty || ''}
                      onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-black text-slate-900"
                    />
                  </div>

                  {/* Rate in Pounds */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="font-bold text-slate-700 block mb-1">Rate (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="£"
                      value={item.rate}
                      onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-blue-700"
                    />
                  </div>

                  {/* Total Line Amount (£) */}
                  <div className="col-span-8 sm:col-span-1 text-right">
                    <label className="font-bold text-slate-700 block mb-1">Amount (£)</label>
                    <div className="py-2 font-mono font-black text-slate-900 text-sm">
                      £{Number(item.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Actions: Copy & Delete */}
                  <div className="col-span-4 sm:col-span-1 flex items-center justify-end space-x-1 pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(idx)}
                      title="Duplicate this row"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={formData.items.length === 1}
                      title="Remove this item"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Row 2: Comprehensive Sizing Breakdown Matrix (XS, S, M, L, XL) */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-xs bg-white/70 p-2.5 rounded-xl">
                  <span className="font-bold text-slate-600 flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    <span>Size Breakdown Ratio (Pcs):</span>
                  </span>

                  {['xs', 's', 'm', 'l', 'xl'].map(sz => (
                    <div key={sz} className="flex items-center space-x-1">
                      <span className="uppercase text-[11px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {sz}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.sizeBreakdown?.[sz] || ''}
                        onChange={e => handleSizeChange(idx, sz, e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md text-center font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}

                  <span className="text-[11px] text-slate-400 italic ml-auto">
                    (Sizes input karne se Qty khud ba khud calculate hoti hai)
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Initial Wasool (Advance Payment) & Financials */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment & Advance Wasool (Ledger Setup)</h2>
              <p className="text-xs text-slate-400">Record advance deposit received from buyer for this order</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Advance Wasool Received (£ GBP)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.advancePaid || ''}
                  onChange={e => setFormData({ ...formData, advancePaid: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 text-base focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
              >
                <option value="Bank Transfer">Bank Transfer (HBL / Faisalabad)</option>
                <option value="Cash / Hand">Cash / Hand</option>
                <option value="Online / Wire">Online / Wire Transfer</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Deposit Reference / Slip ID</label>
              <input
                type="text"
                placeholder="e.g. Advance Deposit, Bank Ref #1029"
                value={formData.paymentRef}
                onChange={e => setFormData({ ...formData, paymentRef: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Merchandiser Notes & Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Merchandiser Instructions & Packing Notes</h2>
              <p className="text-xs text-slate-400">Master cartons packing (e.g. 4 master × 8 sets = 32 sets), fabric cutting notes</p>
            </div>
          </div>

          <textarea
            rows="3"
            placeholder="e.g. Master packing 4 cartons × 8 sets (Black: 2, 2, 2, 1, 1). Total 32 sets. Special washing instructions..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Bottom Sticky Action Bar with Grand Totals */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky bottom-4 z-30 border border-slate-800">
          
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Quantity</span>
              <span className="font-mono font-bold text-white text-base">{totalPieces.toLocaleString()} Pcs</span>
              {totalCartons > 0 && <span className="text-xs text-slate-400 ml-1">({totalCartons} Cartons)</span>}
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Billed Value</span>
              <span className="font-mono font-extrabold text-blue-300 text-lg">
                £{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Wasool (Advance)</span>
              <span className="font-mono font-bold text-emerald-400 text-base">
                £{(Number(formData.advancePaid) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Remaining Bakaya</span>
              <span className="font-mono font-extrabold text-rose-400 text-base">
                £{balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{editingOrder ? 'Update Order Record' : 'Save Full Order Record'}</span>
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
