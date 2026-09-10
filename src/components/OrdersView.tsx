import React, { useState, useEffect } from 'react';
import { OrderWithCustomer, OrderDetail } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  ShoppingBag,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Eye,
  Plus,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

interface OrdersViewProps {
  onOpenNewOrder: () => void;
  onViewOrder: (orderId: number) => void;
  onViewInvoice: (orderId: number) => void;
  refreshTrigger: number;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenNewOrder,
  onViewOrder,
  onViewInvoice,
  refreshTrigger,
}) => {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentFilter !== 'ALL') params.append('paymentStatus', paymentFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiRequest<OrderWithCustomer[]>(`/api/orders?${params.toString()}`);
      setOrders(res || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, searchQuery, refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Process':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Order Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laundry Orders
          </h1>
          <p className="text-xs text-slate-500">
            Track and process customer orders, update statuses, and monitor turnaround
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Order
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # (ORD-...), customer name, or phone..."
              className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Received">Received</option>
              <option value="In Process">In Process</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Payment:
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Payments</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading laundry orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No orders found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filter settings or create a new order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Booked Date</th>
                  <th className="py-3 px-4">Delivery Due</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(({ order, customer }) => {
                  const isDeliveryDue =
                    new Date(order.deliveryDate).getTime() <
                      Date.now() + 24 * 3600 * 1000 &&
                    order.status !== 'Delivered' &&
                    order.status !== 'Cancelled';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onViewOrder(order.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {order.orderNumber}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{customer?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-500">{customer?.phone}</p>
                      </td>

                      {/* Order Date */}
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-medium ${
                              isDeliveryDue
                                ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                                : 'text-slate-700'
                            }`}
                          >
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-semibold ${
                            order.paymentStatus === 'Paid'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {order.paymentMethod}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{parseFloat(order.totalAmount).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onViewOrder(order.id)}
                            title="Inspect Order Details & Update Status"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewInvoice(order.id)}
                            title="View / Print Tax Invoice"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
