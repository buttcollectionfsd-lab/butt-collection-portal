import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function OrdersTab({ 
  orders, 
  openNewOrderModal, 
  openEditOrderModal, 
  openOrderDetails, 
  deleteOrder, 
  updateOrderStatus 
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = (orders || []).filter(order => {
    // Status filter
    if (filterStatus === 'Shipped' && order.status !== 'Shipped') return false;
    if (filterStatus === 'In Progress' && order.status !== 'In Progress') return false;
    if (filterStatus === 'Late' && !order.alert?.includes('LATE')) return false;
    if (filterStatus === 'Urgent' && !order.alert?.includes('Urgent')) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber?.toLowerCase().includes(q);
      const matchCust = order.customer?.toLowerCase().includes(q);
      const matchNotes = order.notes?.toLowerCase().includes(q);
      const matchItems = (order.items || []).some(i => i.style?.toLowerCase().includes(q));
      if (!matchNum && !matchCust && !matchNotes && !matchItems) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Top Controls: Search, Filters & Action */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Customer (Shahid Sab, SP Imports), Style..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'In Progress', 'Shipped', 'Urgent', 'Late'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Add Order Button */}
        <button
          onClick={openNewOrderModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition shadow-sm whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Order</span>
        </button>

      </div>

      {/* Main Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3 text-right">Pcs</th>
                <th className="py-3 px-3 text-right">Cartons</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Order Value</th>
                <th className="py-3 px-3 text-right">Wasool</th>
                <th className="py-3 px-3 text-right">Bakaya</th>
                <th className="py-3 px-3 text-center">Files & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const totalCartons = (order.items || []).reduce((sum, i) => sum + (Number(i.cartons) || 0), 0);
                  const itemsSummary = (order.items || []).map(i => i.style).join(', ') || 'N/A';

                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-blue-50/40 transition group"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <button 
                          onClick={() => openOrderDetails(order)}
                          className="hover:text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <span>{order.orderNumber}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {order.customer}
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={itemsSummary}>
                        {itemsSummary}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {order.totalPieces?.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {totalCartons > 0 ? totalCartons : '-'}
                      </td>

                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {order.orderDate || '-'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-700">{order.deadline || '-'}</span>
                          {order.status !== 'Shipped' && order.alert && (
                            <span className={`text-[10px] font-bold ${
                              order.alert.includes('LATE') ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              {order.alert}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-full cursor-pointer focus:outline-none border-0 ${
                            order.status === 'Shipped'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Shipped">Shipped</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        £{Number(order.totalAmount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-700 whitespace-nowrap">
                        £{Number(order.amountReceived || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        £{Number(order.balance || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Instant Export & Action Buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          {/* View details */}
                          <button
                            onClick={() => openOrderDetails(order)}
                            title="View Full Order Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download PDF */}
                          <a
                            href={`http://localhost:5000/api/export/pdf/order/${order.id}`}
                            download
                            title="Download PDF Work Order"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <FileText className="w-4 h-4" />
                          </a>

                          {/* Download Word (.docx) */}
                          <a
                            href={`http://localhost:5000/api/export/docx/order/${order.id}`}
                            download
                            title="Download Word Document (.docx)"
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* Edit Order */}
                          <button
                            onClick={() => openEditOrderModal(order)}
                            title="Edit Full Order Record"
                            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg font-bold text-[11px] transition shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteOrder(order.id)}
                            title="Delete Order"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
