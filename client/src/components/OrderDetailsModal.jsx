import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, Clock, Truck, Building2, Calendar, PoundSterling, Edit3, Eye, Package, Receipt, FilePlus } from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';

export default function OrderDetailsModal({ isOpen, onClose, order, company, onStatusChange, onEdit, onGatePass, onPackingList, onInvoice, onCreateDocuments }) {
  const [showViewer, setShowViewer] = useState(false);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold tracking-tight">{order.orderNumber}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                order.status === 'Shipped' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Customer: <strong className="text-white">{order.customer}</strong> • Manufacturer: <strong className="text-white">{order.manufacturer || 'Butt Collection'}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Gate Pass */}
            {onGatePass && (
              <button
                onClick={() => {
                  onClose();
                  onGatePass(order);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Gate Pass</span>
              </button>
            )}

            {/* Packing List */}
            {onPackingList && (
              <button
                onClick={() => {
                  onClose();
                  onPackingList(order);
                }}
                title="Packing List (view, edit & print)"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm"
              >
                <Package className="w-4 h-4" />
              </button>
            )}

            {/* Commercial Invoice */}
            {onInvoice && (
              <button
                onClick={() => {
                  onClose();
                  onInvoice(order);
                }}
                title="Commercial Invoice (view, edit & print)"
                className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition shadow-sm"
              >
                <Receipt className="w-4 h-4" />
              </button>
            )}

            {/* Edit Button in Header */}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Order</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Meta Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Order Date</span>
              <strong className="text-slate-800 text-sm">{order.orderDate || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Delivery Deadline</span>
              <strong className="text-slate-800 text-sm">{order.deadline || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Dispatch City</span>
              <strong className="text-slate-800 text-sm">{order.dispatchCity || 'Faisalabad'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Shipped On</span>
              <strong className="text-emerald-700 text-sm">{order.shippedOn || 'Pending'}</strong>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Production Items Specification</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Style / Item</th>
                    <th className="py-2.5 px-3">GSM</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3 text-right">Cartons</th>
                    <th className="py-2.5 px-3 text-right">Qty (Pcs)</th>
                    <th className="py-2.5 px-3 text-right">Rate (£)</th>
                    <th className="py-2.5 px-3 text-right">Amount (£)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.style}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{item.gsm || '-'}</td>
                      <td className="py-2 px-3 text-slate-600">{item.color || 'Assorted'}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{item.cartons || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                        {Number(item.qty || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        £{Number(item.rate || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        £{Number(item.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan="4" className="py-2.5 px-3 text-slate-700">TOTAL:</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      {order.totalPieces?.toLocaleString()} Pcs
                    </td>
                    <td></td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm">
                      £{Number(order.totalAmount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Size Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Size Breakdown Matrix (Pcs)</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-800 text-white font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-left">Item Style</th>
                    <th className="py-2 px-2">XS</th>
                    <th className="py-2 px-2">S</th>
                    <th className="py-2 px-2">M</th>
                    <th className="py-2 px-2">L</th>
                    <th className="py-2 px-2">XL</th>
                    <th className="py-2 px-3 font-bold">Total Pcs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => {
                    const sb = item.sizeBreakdown || {};
                    const totalSz = (Number(sb.xs) || 0) + (Number(sb.s) || 0) + (Number(sb.m) || 0) + (Number(sb.l) || 0) + (Number(sb.xl) || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-left font-medium text-slate-800">{item.style}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{sb.xs || 0}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{sb.s || 0}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{sb.m || 0}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{sb.l || 0}</td>
                        <td className="py-2 px-2 font-mono text-slate-600">{sb.xl || 0}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{totalSz || item.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Financial Ledger Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Account & Payment Ledger Status</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Total Billed</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  £{Number(order.totalAmount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-medium">Received</span>
                <p className="font-mono font-bold text-emerald-600 text-sm mt-0.5">
                  £{Number(order.amountReceived || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-rose-200">
                <span className="text-[11px] text-rose-700 font-medium">Balance Due</span>
                <p className="font-mono font-bold text-rose-600 text-sm mt-0.5">
                  £{Number(order.balance || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {order.notes && (
              <p className="text-xs text-slate-500 italic mt-3 bg-white p-2.5 rounded-lg border border-slate-200">
                <strong>Notes:</strong> {order.notes}
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer with One-Click Exports and Edit */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Quick Status:</span>
            <button
              onClick={() => onStatusChange(order.id, order.status === 'Shipped' ? 'In Progress' : 'Shipped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                order.status === 'Shipped'
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {order.status === 'Shipped' ? 'Mark as In Progress' : 'Mark as Shipped'}
            </button>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Full Order</span>
              </button>
            )}

            {onCreateDocuments && (
              <button
                onClick={() => {
                  onClose();
                  onCreateDocuments(order);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Create Documents</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            
            {/* In-app viewer: work order + PDF, no download */}
            <button
              type="button"
              onClick={() => setShowViewer(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 rounded-lg text-xs font-bold transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>

            {/* Word .docx Export */}
            <a
              href={`http://localhost:5000/api/export/docx/order/${order.id}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Word (.docx)</span>
            </a>

            {/* PDF Export */}
            <a
              href={`http://localhost:5000/api/export/pdf/order/${order.id}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
          </div>

        </div>

      </div>

      {showViewer && (
        <DocumentViewerModal
          key={order.id}
          title="Order Documents"
          order={order}
          company={company}
          initialTab="work-order"
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
}
