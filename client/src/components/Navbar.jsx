import React from 'react';
import { LayoutDashboard, ShoppingBag, FileSpreadsheet, Tag, Download, Clock, Database, PlusCircle, FilePlus } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, company, stats, todayDate, database, onNewOrderClick }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Production', icon: ShoppingBag, badge: stats?.inProgressOrders },
    { id: 'create-order', label: '+ New Order Entry', icon: PlusCircle, isHighlight: true },
    { id: 'documents', label: '+ Create Gate Pass / Invoice / Packing', icon: FilePlus, isAmber: true },
    { id: 'ledger', label: 'Payment Ledger (Wasool/Bakaya)', icon: FileSpreadsheet },
    { id: 'labels', label: 'Carton Labels (Bold Poster)', icon: Tag },
    { id: 'exports', label: 'Exports Hub (Excel/PDF/Word)', icon: Download }
  ];

  const isMongo = database === 'MongoDB';

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Merchandiser Company Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md font-bold text-xl text-white">
              BC
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  {company?.name || 'BUTT COLLECTION'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 font-semibold border border-blue-700/50">
                  {company?.city || 'Faisalabad'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Merchandiser Portal & Production Manager
              </p>
            </div>
          </div>

          {/* Database & Quick Stats */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Live Database Badge */}
            <div className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold ${
              isMongo 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              <Database className={`w-3.5 h-3.5 ${isMongo ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span>{isMongo ? '🍃 MongoDB Active' : 'DB: MongoDB Configured'}</span>
            </div>

            <div className="flex items-center space-x-2 text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Today: <strong className="text-white font-mono">{todayDate || new Date().toISOString().split('T')[0]}</strong></span>
            </div>

            <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <div>
                <span className="text-slate-400">Total Billed: </span>
                <span className="font-mono font-bold text-emerald-400">£{Number(stats?.totalBilled || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-4 w-px bg-slate-700"></div>
              <div>
                <span className="text-slate-400">Balance: </span>
                <span className="font-mono font-bold text-rose-400">£{Number(stats?.balanceDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800 text-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'create-order' && onNewOrderClick) {
                    onNewOrderClick();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab.isAmber
                    ? 'bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-slate-900 border border-amber-400/50'
                    : tab.isHighlight
                    ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isAmber ? 'text-amber-300' : tab.isHighlight ? 'text-blue-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-900 text-blue-200' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
