import React from 'react';
import { 
  Package, 
  Truck, 
  Clock, 
  AlertTriangle, 
  PoundSterling, 
  CheckCircle2, 
  PlusCircle, 
  FileSpreadsheet, 
  ArrowUpRight,
  ChevronRight,
  Tag,
  FilePlus
} from 'lucide-react';

export default function DashboardTab({ 
  stats, 
  orders, 
  company, 
  setActiveTab, 
  openNewOrderModal, 
  openPaymentModal,
  openOrderDetails
}) {
  const lateOrUrgentOrders = (orders || []).filter(o => 
    o.status !== 'Shipped' && (o.alert?.includes('LATE') || o.alert?.includes('Urgent'))
  );

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800">
            Merchandiser Workspace
          </span>
          <h1 className="text-2xl font-bold mt-2">Welcome to {company?.name || 'Butt Collection'} Portal</h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">
            Track garment production orders, dispatch schedules, payment ledgers (Wasool & Bakaya), and generate Carton Labels & Excel/PDF/Word files instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={openNewOrderModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>

          <button 
            onClick={openPaymentModal}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm active:scale-95"
          >
            <PoundSterling className="w-4 h-4" />
            <span>Record Wasool</span>
          </button>

          <button 
            onClick={() => setActiveTab('documents')}
            className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm active:scale-95"
          >
            <FilePlus className="w-4 h-4" />
            <span>Create Gate Pass / Invoice / Packing</span>
          </button>

          <a 
            href="http://localhost:5000/api/export/excel"
            download
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Tracker</span>
          </a>
        </div>
      </div>

      {/* Primary KPI Metrics: Shipments & Production */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Shipment & Production Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Orders</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalOrders || 0}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{stats?.totalPieces?.toLocaleString() || 0} Total Pieces</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase">Shipped / Dispatched</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats?.shippedOrders || 0}</h3>
              <p className="text-xs text-emerald-600/70 mt-0.5">Dispatched Orders</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase">In Progress</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.inProgressOrders || 0}</h3>
              <p className="text-xs text-amber-600/70 mt-0.5">Currently In Production</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className={`bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between ${
            (stats?.lateOrders || 0) > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
          }`}>
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase">Late / Attention</p>
              <h3 className={`text-2xl font-extrabold mt-1 ${(stats?.lateOrders || 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {stats?.lateOrders || 0}
              </h3>
              <p className="text-xs text-rose-600/70 mt-0.5">
                {stats?.urgentOrders || 0} Urgent (&lt;7 days)
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              (stats?.lateOrders || 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

        </div>
      </div>

      {/* Financial Overview Cards: Billed, Wasool, Bakaya */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Financial Accounts (Ledger in GBP £)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-sm border border-slate-700">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Billed / Value</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                £{Number(stats?.totalBilled || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Across all recorded production orders</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl p-5 text-white shadow-sm border border-emerald-700">
            <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">Wasool / Payments Received</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-300">
                £{Number(stats?.totalReceived || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-2">Cleared into Butt Collection account</p>
          </div>

          <div className="bg-gradient-to-br from-rose-900 to-rose-800 rounded-xl p-5 text-white shadow-sm border border-rose-700">
            <span className="text-xs font-medium text-rose-200 uppercase tracking-wider">Bakaya / Outstanding Balance</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-rose-300">
                £{Number(stats?.balanceDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-rose-200/80 mt-2">Net remaining balance to collect</p>
          </div>

        </div>
      </div>

      {/* Grid: Attention Orders & Active Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Urgent & Late Orders */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Deadlines & Urgent Orders</span>
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {lateOrUrgentOrders.length}
            </span>
          </div>

          {lateOrUrgentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              All orders are on schedule!
            </div>
          ) : (
            <div className="space-y-3">
              {lateOrUrgentOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => openOrderDetails(order)}
                  className="p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.alert?.includes('LATE') 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.alert}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{order.customer}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>Deadline: <strong>{order.deadline || 'None'}</strong></span>
                    <span className="font-mono font-semibold text-slate-700">£{Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Orders Tracker Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Recent Production & Shipments</span>
            </h3>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Order #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Pieces</th>
                  <th className="pb-2">Deadline</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(orders || []).slice(0, 5).map(o => (
                  <tr 
                    key={o.id}
                    onClick={() => openOrderDetails(o)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="py-2.5 text-slate-600">{o.customer}</td>
                    <td className="py-2.5 font-mono text-slate-600">{o.totalPieces?.toLocaleString()}</td>
                    <td className="py-2.5 text-slate-500">{o.deadline || '-'}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'Shipped' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-800">
                      £{Number(o.balance || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
