import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { PricingView } from './components/PricingView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { NewOrderModal } from './components/NewOrderModal.tsx';
import { OrderDetailModal } from './components/OrderDetailModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { OrderDetail } from './types.ts';
import { apiRequest } from './lib/api.ts';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Modals state
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<number | undefined>(undefined);

  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrderDetail, setInvoiceOrderDetail] = useState<OrderDetail | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenNewOrder = (customerId?: number) => {
    setPreselectedCustomerId(customerId);
    setNewOrderModalOpen(true);
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const detail = await apiRequest<OrderDetail>(`/api/orders/${orderId}`);
      setSelectedOrderDetail(detail);
      setOrderDetailModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load order details');
    }
  };

  const handleViewInvoice = async (orderId: number) => {
    try {
      const detail = await apiRequest<OrderDetail>(`/api/orders/${orderId}`);
      setInvoiceOrderDetail(detail);
      setInvoiceModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice');
    }
  };

  const handleOrderCreated = (newDetail: OrderDetail) => {
    triggerRefresh();
    // Promptly show invoice modal for the newly generated order!
    setInvoiceOrderDetail(newDetail);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => handleOpenNewOrder()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenNewOrder={() => handleOpenNewOrder()}
            onNavigate={(tab) => setActiveTab(tab)}
            onViewOrder={handleViewOrder}
            onViewInvoice={handleViewInvoice}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            onOpenNewOrder={() => handleOpenNewOrder()}
            onViewOrder={handleViewOrder}
            onViewInvoice={handleViewInvoice}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            onSelectCustomerForNewOrder={(custId) => handleOpenNewOrder(custId)}
            onViewOrder={handleViewOrder}
          />
        )}

        {activeTab === 'pricing' && <PricingView />}

        {activeTab === 'invoices' && (
          <InvoicesView onViewInvoiceModal={handleViewInvoice} />
        )}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Modals */}
      <NewOrderModal
        isOpen={newOrderModalOpen}
        onClose={() => {
          setNewOrderModalOpen(false);
          setPreselectedCustomerId(undefined);
        }}
        onOrderCreated={handleOrderCreated}
        preselectedCustomerId={preselectedCustomerId}
      />

      <OrderDetailModal
        isOpen={orderDetailModalOpen}
        onClose={() => setOrderDetailModalOpen(false)}
        orderDetail={selectedOrderDetail}
        onViewInvoice={() => {
          setInvoiceOrderDetail(selectedOrderDetail);
          setInvoiceModalOpen(true);
        }}
        onOrderUpdated={triggerRefresh}
      />

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        orderDetail={invoiceOrderDetail}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
