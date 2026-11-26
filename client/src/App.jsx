import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import CreateOrderPage from './components/CreateOrderPage';
import OrderDetailsModal from './components/OrderDetailsModal';
import GatePassModal from './components/GatePassModal';
import PackingListModal from './components/PackingListModal';
import InvoiceModal from './components/InvoiceModal';
import CreateDocumentsModal from './components/CreateDocumentsModal';
import PaymentLedgerTab from './components/PaymentLedgerTab';
import PaymentModal from './components/PaymentModal';
import CartonLabelTab from './components/CartonLabelTab';
import ExportsTab from './components/ExportsTab';
import OrderDocumentsTab from './components/OrderDocumentsTab';
import ScriptWarning from './components/ScriptWarning';
import { findArabicIssues } from './utils/arabicScript';
import { getGatePassMeta } from './utils/gatePass';
import { getPackingMeta } from './utils/packingList';
import { getInvoiceMeta } from './utils/invoice';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Data
  const [company, setCompany] = useState(null);
  const [database, setDatabase] = useState('MongoDB');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [standaloneDocs, setStandaloneDocs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [labels, setLabels] = useState([]);
  const [todayDate, setTodayDate] = useState('');
 
  // Modals & Active Selections
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [gatePassOrder, setGatePassOrder] = useState(null);
  const [packingListOrder, setPackingListOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [documentCreateOrder, setDocumentCreateOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const [cleaningStoredUrdu, setCleaningStoredUrdu] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };


  // Fetch all initial data (silent = no loading spinner on refresh)
  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const [dashRes, ordersRes, payRes, labelRes, standaloneRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`),
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/payments`),
        fetch(`${API_BASE}/labels`),
        fetch(`${API_BASE}/standalone-documents`)
      ]);

      if (!dashRes.ok) throw new Error('Backend server is starting or unreachable');

      const dashData = await dashRes.json();
      const ordersData = await ordersRes.json();
      const payData = await payRes.json();
      const labelData = await labelRes.json();
      const standaloneData = standaloneRes.ok ? await standaloneRes.json() : [];

      setCompany(dashData.company);
      setDatabase(dashData.database || 'MongoDB');
      setStats(dashData.stats);
      setOrders(ordersData);
      setStandaloneDocs(Array.isArray(standaloneData) ? standaloneData : []);
      setPayments(payData);
      setLabels(labelData);
      setTodayDate(dashData.todayDate);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (!silent) setError(err.message || 'Error connecting to backend');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Order Handlers
  const handleOpenNewOrderPage = () => {
    setEditingOrder(null);
    setActiveTab('create-order');
  };

  const handleOpenEditOrderPage = (order) => {
    setEditingOrder(order);
    setActiveTab('create-order');
  };

  // Har document kholne se pehle taaza order fetch karein taake purani
  // (cached list wali) copy edit/save na ho jaye.
  const refreshOrder = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`);
      if (!res.ok) return null;
      const fresh = await res.json();
      setOrders(prev => prev.map(o => (o.id === fresh.id ? { ...o, ...fresh } : o)));
      return fresh;
    } catch (_) {
      return null;
    }
  };

  const handleOpenGatePass = (order) => {
    setSelectedOrderDetails(null);
    setGatePassOrder(order);
    refreshOrder(order.id).then(fresh => {
      if (!fresh) return;
      setGatePassOrder(prev => (prev && prev.id === fresh.id ? { ...prev, ...fresh } : prev));
    });
  };

  const handleOpenPackingList = (order) => {
    setSelectedOrderDetails(null);
    setPackingListOrder(order);
    refreshOrder(order.id).then(fresh => {
      if (!fresh) return;
      setPackingListOrder(prev => (prev && prev.id === fresh.id ? { ...prev, ...fresh } : prev));
    });
  };

  const handleOpenInvoice = (order) => {
    setSelectedOrderDetails(null);
    setInvoiceOrder(order);
    refreshOrder(order.id).then(fresh => {
      if (!fresh) return;
      setInvoiceOrder(prev => (prev && prev.id === fresh.id ? { ...prev, ...fresh } : prev));
    });
  };

  const handleOpenCreateDocuments = (order) => {
    setSelectedOrderDetails(null);
    setDocumentCreateOrder(order);
  };

  const handleOpenDocument = (type, order) => {
    if (type === 'gatePass') handleOpenGatePass(order);
    else if (type === 'packingList') handleOpenPackingList(order);
    else if (type === 'invoice') handleOpenInvoice(order);
  };

  const handleSaveGatePass = async (id, gatePassData) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gatePassData)
    });

    if (!res.ok) {
      let message = 'Gate pass details could not be saved';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {
        // keep default message
      }
      throw new Error(message);
    }

    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...gatePassData, ...updated } : o)));
    setGatePassOrder(prev => (prev && prev.id === id ? { ...prev, ...gatePassData } : prev));
    setSelectedOrderDetails(prev =>
      prev && prev.id === id ? { ...prev, ...gatePassData } : prev
    );
    await loadData(true);
    showToast('Gate pass details saved successfully!');
    return updated;
  };

  const handleSavePackingList = async (id, packingData) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packingData)
    });

    if (!res.ok) {
      let message = 'Packing list details could not be saved';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {
        // keep default message
      }
      throw new Error(message);
    }

    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...packingData, ...updated } : o)));
    setPackingListOrder(prev => (prev && prev.id === id ? { ...prev, ...packingData } : prev));
    setSelectedOrderDetails(prev =>
      prev && prev.id === id ? { ...prev, ...packingData } : prev
    );
    await loadData(true);
    showToast('Packing list details saved successfully!');
    return updated;
  };

  const handleSaveInvoice = async (id, invoiceData) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });

    if (!res.ok) {
      let message = 'Invoice details could not be saved';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {
        // keep default message
      }
      throw new Error(message);
    }

    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...invoiceData, ...updated } : o)));
    setInvoiceOrder(prev => (prev && prev.id === id ? { ...prev, ...invoiceData } : prev));
    setSelectedOrderDetails(prev =>
      prev && prev.id === id ? { ...prev, ...invoiceData } : prev
    );
    await loadData(true);
    showToast('Invoice details saved successfully!');
    return updated;
  };

  const handleCreateDocument = async (type, order) => {
    if (!order?.id) return;

    let fields = {};
    let label = 'Document';

    if (type === 'gatePass') {
      const meta = getGatePassMeta(order);
      label = 'Gate Pass';
      fields = {
        gatePassNo: order.gatePassNo || meta.no,
        gatePassDate: order.gatePassDate || meta.date,
        gatePassDestination: order.gatePassDestination || meta.destination,
        gatePassPurpose: order.gatePassPurpose || meta.purpose
      };
    } else if (type === 'packingList') {
      const meta = getPackingMeta(order);
      label = 'Packing List';
      fields = {
        packingListNo: order.packingListNo || meta.no,
        packingDate: order.packingDate || meta.date
      };
    } else if (type === 'invoice') {
      const meta = getInvoiceMeta(order);
      label = 'Invoice';
      fields = {
        invoiceNo: order.invoiceNo || meta.no,
        invoiceDate: order.invoiceDate || meta.date,
        invoiceTerms: order.invoiceTerms || meta.terms
      };
    } else {
      return;
    }

    const res = await fetch(`${API_BASE}/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });

    if (!res.ok) {
      let message = `${label} create nahi ho saka`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {
        // keep default message
      }
      throw new Error(message);
    }

    const updated = await res.json();
    const merged = { ...order, ...fields, ...updated };

    setOrders(prev => prev.map(o => (o.id === order.id ? merged : o)));
    setDocumentCreateOrder(null);
    setSelectedOrderDetails(null);

    if (type === 'gatePass') setGatePassOrder(merged);
    if (type === 'packingList') setPackingListOrder(merged);
    if (type === 'invoice') setInvoiceOrder(merged);

    showToast(`${label} created — ab details edit karke PDF/Word nikalein`);
    return merged;
  };

  const handleCreateStandalone = async (type, options = {}) => {
    const labels = {
      gatePass: 'Gate Pass',
      packingList: 'Packing List',
      invoice: 'Commercial Invoice'
    };
    const label = labels[type] || 'Document';

    const res = await fetch(`${API_BASE}/standalone-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        customer: options.customer || '',
        reference: options.reference || '',
        date: options.date || ''
      })
    });

    if (!res.ok) {
      let message = `${label} create nahi ho saka`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch (_) {
        // keep default message
      }
      throw new Error(message);
    }

    const created = await res.json();
    setStandaloneDocs(prev => [created, ...prev]);

    if (type === 'gatePass') setGatePassOrder(created);
    if (type === 'packingList') setPackingListOrder(created);
    if (type === 'invoice') setInvoiceOrder(created);

    showToast(`${label} created — ab details edit karke PDF/Word nikalein`);
    return created;
  };

  const handleDeleteStandalone = async (doc) => {
    if (!doc?.id) return;
    if (!window.confirm(`${doc.customer || 'Document'} — delete karein?`)) return;

    const res = await fetch(`${API_BASE}/orders/${doc.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('Document delete nahi ho saka', 'error');
      return;
    }

    setStandaloneDocs(prev => prev.filter(item => item.id !== doc.id));
    setGatePassOrder(prev => (prev?.id === doc.id ? null : prev));
    setPackingListOrder(prev => (prev?.id === doc.id ? null : prev));
    setInvoiceOrder(prev => (prev?.id === doc.id ? null : prev));
    showToast('Document deleted');
  };

  const handleSaveOrder = async (orderData) => {
    try {
      const isEdit = Boolean(orderData.id);
      const url = isEdit ? `${API_BASE}/orders/${orderData.id}` : `${API_BASE}/orders`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('Failed to save order');
      const savedOrder = await res.json();

      // If advance was provided on creation, also log it in payments ledger
      if (!isEdit && orderData.advancePaid && Number(orderData.advancePaid) > 0) {
        await fetch(`${API_BASE}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            customer: savedOrder.customer,
            date: savedOrder.orderDate || new Date().toISOString().split('T')[0],
            amount: Number(orderData.advancePaid),
            method: orderData.paymentMethod || 'Bank Transfer',
            reference: orderData.paymentRef || 'Advance Wasool',
            notes: `Advance payment for ${savedOrder.orderNumber}`
          })
        });
      }

      // Optimistic update: immediately update the order in state
      if (isEdit) {
        setOrders(prev => prev.map(o => o.id === savedOrder.id ? { ...savedOrder } : o));
      }
      await loadData(true); // silent refresh
      setEditingOrder(null);
      setActiveTab('orders');
      if (!isEdit) {
        setDocumentCreateOrder(savedOrder);
        showToast('Order created — ab Gate Pass, Packing List & Invoice create karein');
      } else {
        showToast('Order updated successfully!');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');
      setOrders(prev => prev.filter(o => o.id !== id)); // optimistic remove
      await loadData(true);
      showToast('Order removed from records', 'info');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const shippedOn = status === 'Shipped' ? new Date().toISOString().split('T')[0] : '';
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, shippedOn })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, shippedOn } : o));
      if (selectedOrderDetails?.id === id) {
        setSelectedOrderDetails(prev => ({ ...prev, status, shippedOn }));
      }
      await loadData(true);
      showToast(`Status updated to ${status}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Payment Handlers
  const handleSavePayment = async (paymentData) => {
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (!res.ok) throw new Error('Failed to record payment');
      await loadData(true);
      setIsPaymentModalOpen(false);
      showToast(`Payment of £${Number(paymentData.amount).toFixed(2)} recorded in ledger!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const res = await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
      setPayments(prev => prev.filter(p => p.id !== id));
      await loadData(true);
      showToast('Payment record deleted');
    } catch (err) {
      alert(err.message);
    }
  };

  // Label Handlers
  const handleSaveLabel = async (labelData) => {
    try {
      const isExisting = labels.some(l => l.id === labelData.id);
      const url = isExisting ? `${API_BASE}/labels/${labelData.id}` : `${API_BASE}/labels`;
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labelData)
      });
      if (!res.ok) throw new Error('Failed to save label');
      await loadData(true);
      showToast('Carton label design saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Saved records that still contain Urdu / Arabic letters
  const storedScriptIssues = useMemo(
    () => [
      ...findArabicIssues(orders),
      ...findArabicIssues(payments),
      ...findArabicIssues(labels)
    ],
    [orders, payments, labels]
  );

  const handleCleanStoredUrdu = async () => {
    try {
      setCleaningStoredUrdu(true);
      const res = await fetch(`${API_BASE}/maintenance/arabic-clean`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not clean the saved records');
      const summary = await res.json();
      await loadData(true);
      showToast(`Cleaned ${summary.fields} field${summary.fields === 1 ? '' : 's'} — records are now in English`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCleaningStoredUrdu(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        company={company}
        stats={stats}
        todayDate={todayDate}
        database={database}
        onNewOrderClick={handleOpenNewOrderPage}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Connecting to Butt Collection Merchandiser Database...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900">Database Connection Notice</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {storedScriptIssues.length > 0 && (
              <div className="mb-5">
                <ScriptWarning
                  issues={storedScriptIssues}
                  title={`Urdu text found in ${storedScriptIssues.length} saved field${storedScriptIssues.length === 1 ? '' : 's'}`}
                  description="These saved records still contain Urdu / Arabic letters, which break the PDF, Word and Excel exports. Fix them once and the data stays clean."
                  actionLabel="Fix saved records"
                  onAction={handleCleanStoredUrdu}
                  isBusy={cleaningStoredUrdu}
                />
              </div>
            )}

            {/* 1. Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                orders={orders}
                company={company}
                setActiveTab={setActiveTab}
                openNewOrderModal={handleOpenNewOrderPage}
                openPaymentModal={() => setIsPaymentModalOpen(true)}
                openOrderDetails={(order) => setSelectedOrderDetails(order)}
              />
            )}

            {/* 2. Full Orders List Table */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                payments={payments}
                company={company}
                openNewOrderModal={handleOpenNewOrderPage}
                openEditOrderModal={handleOpenEditOrderPage}
                openOrderDetails={(order) => setSelectedOrderDetails(order)}
                openGatePass={handleOpenGatePass}
                openPackingList={handleOpenPackingList}
                openInvoice={handleOpenInvoice}
                openCreateDocuments={handleOpenCreateDocuments}
                deleteOrder={handleDeleteOrder}
                updateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {/* 3. DEDICATED FULL-PAGE ORDER ENTRY SCREEN (No modal!) */}
            {activeTab === 'create-order' && (
              <CreateOrderPage
                onSave={handleSaveOrder}
                onCancel={() => {
                  setEditingOrder(null);
                  setActiveTab('orders');
                }}
                editingOrder={editingOrder}
                company={company}
              />
            )}

            {/* 4. Payment Ledger (Wasool/Bakaya) */}
            {activeTab === 'ledger' && (
              <PaymentLedgerTab
                payments={payments}
                orders={orders}
                stats={stats}
                openPaymentModal={() => setIsPaymentModalOpen(true)}
                deletePayment={handleDeletePayment}
              />
            )}

            {/* 5. Carton Label Studio (Screenshot Default & Multi-template) */}
            {activeTab === 'labels' && (
              <CartonLabelTab
                labels={labels}
                saveLabel={handleSaveLabel}
              />
            )}

            {/* 6. Create Gate Pass / Packing List / Invoice */}
            {activeTab === 'documents' && (
              <OrderDocumentsTab
                orders={orders}
                company={company}
                standaloneDocs={standaloneDocs}
                onCreate={handleCreateDocument}
                onOpen={handleOpenDocument}
                onCreateStandalone={handleCreateStandalone}
                onDeleteStandalone={handleDeleteStandalone}
              />
            )}

            {/* 7. Document Exports Hub */}
            {activeTab === 'exports' && (
              <ExportsTab
                orders={orders}
                labels={labels}
                payments={payments}
                company={company}
                openGatePass={handleOpenGatePass}
                openPackingList={handleOpenPackingList}
                openInvoice={handleOpenInvoice}
                openCreateDocuments={handleOpenCreateDocuments}
              />
            )}
          </>
        )}

      </main>

      {/* Deep Dive Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
        company={company}
        onStatusChange={handleUpdateOrderStatus}
        onEdit={handleOpenEditOrderPage}
        onGatePass={handleOpenGatePass}
        onPackingList={handleOpenPackingList}
        onInvoice={handleOpenInvoice}
        onCreateDocuments={handleOpenCreateDocuments}
      />

      {/* Create / manage order documents */}
      <CreateDocumentsModal
        key={documentCreateOrder?.id || 'create-documents'}
        order={documentCreateOrder}
        onSelect={handleCreateDocument}
        onClose={() => setDocumentCreateOrder(null)}
      />

      {/* Dispatch Gate Pass Editor & Preview */}
      <GatePassModal
        key={gatePassOrder?.id || 'gate-pass'}
        order={gatePassOrder}
        company={company}
        onSave={handleSaveGatePass}
        onClose={() => setGatePassOrder(null)}
      />

      {/* Packing List Editor & Preview */}
      <PackingListModal
        key={packingListOrder?.id || 'packing-list'}
        order={packingListOrder}
        company={company}
        onSave={handleSavePackingList}
        onClose={() => setPackingListOrder(null)}
      />

      {/* Commercial Invoice Editor & Preview */}
      <InvoiceModal
        key={invoiceOrder?.id || 'invoice'}
        order={invoiceOrder}
        company={company}
        onSave={handleSaveInvoice}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* Record Wasool Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        orders={orders}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print">
        <p>
          Butt Collection Merchandiser Portal • Faisalabad, Pakistan • Export Management System
        </p>
      </footer>

    </div>
  );
}
