import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  ShoppingBag,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface CustomersViewProps {
  onSelectCustomerForNewOrder: (customerId: number) => void;
  onViewOrder: (orderId: number) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onSelectCustomerForNewOrder,
  onViewOrder,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Selected customer history drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCustomers = async (search?: string) => {
    setLoading(true);
    try {
      const endpoint = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : '/api/customers';
      const data = await apiRequest<Customer[]>(endpoint);
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormNotes('');
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormAddress(cust.address);
    setFormNotes(cust.notes || '');
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formName || !formPhone || !formAddress) {
      setModalError('Name, Phone Number, and Address are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        // Update
        const updated = await apiRequest<Customer>(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName,
            phone: formPhone,
            address: formAddress,
            notes: formNotes,
          }),
        });
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      } else {
        // Create
        const created = await apiRequest<Customer>('/api/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: formName,
            phone: formPhone,
            address: formAddress,
            notes: formNotes,
          }),
        });
        setCustomers([created, ...customers]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleViewCustomerHistory = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setHistoryDrawerOpen(true);
    setLoadingHistory(true);
    try {
      const res = await apiRequest<{ customer: Customer; orderHistory: Order[] }>(
        `/api/customers/${cust.id}`
      );
      setCustomerOrders(res?.orderHistory || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500">
            Manage customer accounts, contact details, and view order history
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, or address..."
            className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customers List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading customer records...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No customers found</p>
            <p className="text-xs text-slate-500 mt-1">
              Add your first customer to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleViewCustomerHistory(cust)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cust.name}</p>
                          <p className="text-[11px] text-slate-400">
                            ID: CUST-{cust.id.toString().padStart(4, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {cust.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {cust.address}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate italic">
                      {cust.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectCustomerForNewOrder(cust.id)}
                          title="Create Order for this customer"
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-semibold transition"
                        >
                          + Order
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(cust, e)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleViewCustomerHistory(cust)}
                          title="View Order History"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Flat No, Building, Street, Area, City"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes (Preferences, Starch, Fabric Care)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Prefers heavy starch; Deliver on weekends only"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Order History Side Drawer */}
      {historyDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Order History &amp; Profile
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {selectedCustomer.phone}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {selectedCustomer.address}
                </p>
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Past Laundry Orders ({customerOrders.length})
                </h4>
                <button
                  onClick={() => {
                    setHistoryDrawerOpen(false);
                    onSelectCustomerForNewOrder(selectedCustomer.id);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + New Order
                </button>
              </div>

              {loadingHistory ? (
                <p className="text-xs text-slate-400 py-6 text-center">Loading orders...</p>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No orders recorded yet for this customer.
                </div>
              ) : (
                customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setHistoryDrawerOpen(false);
                      onViewOrder(ord.id);
                    }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Date: {new Date(ord.orderDate).toLocaleDateString()}</span>
                      <span className="font-bold text-indigo-700">
                        ₹{parseFloat(ord.totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Delivery: {new Date(ord.deliveryDate).toLocaleDateString()}</span>
                      <span
                        className={
                          ord.paymentStatus === 'Paid'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {ord.paymentStatus} ({ord.paymentMethod})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
