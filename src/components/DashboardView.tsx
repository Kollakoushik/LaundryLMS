import React, { useState, useEffect } from 'react';
import { DashboardStats, OrderDetail } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Plus,
  Users,
  FileText,
  DollarSign as PricingIcon,
  ArrowRight,
  TrendingUp,
  Eye,
  Calendar,
} from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';

interface DashboardViewProps {
  onOpenNewOrder: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onViewOrder: (orderId: number) => void;
  onViewInvoice: (orderId: number) => void;
  refreshTrigger: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewOrder,
  onNavigate,
  onViewOrder,
  onViewInvoice,
  refreshTrigger,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DashboardStats>('/api/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading dashboard metrics and active orders...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Could not retrieve operational data.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
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
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time overview of orders, fabric processing throughput, and billing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Laundry Order
          </button>
        </div>
      </div>

      {/* Pending Deliveries Alert Banner (if any) */}
      {stats.pendingDeliveries > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{stats.pendingDeliveries} order(s)</strong> have scheduled deliveries due soon. Check turnaround queue to prevent fulfillment delays.
            </span>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="font-semibold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalOrders}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded orders</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Processing</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.pendingOrders}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently active</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.completedOrders}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Delivered to customer</p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Deliveries</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">{stats.pendingDeliveries}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting dispatch</p>
        </div>
      </div>

      {/* Revenue Summary Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Basic Revenue Overview
            </h2>
            <p className="text-xs text-slate-500">Summary of total billed, collected, and pending receipts</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold self-start sm:self-auto cursor-pointer"
          >
            Detailed Analytics &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Total Order Revenue
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ₹{parseFloat(stats.totalRevenue).toFixed(2)}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">
              Paid Revenue Collected
            </span>
            <p className="text-xl font-bold text-emerald-800 mt-1">
              ₹{parseFloat(stats.paidRevenue).toFixed(2)}
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">
              Pending Receivables
            </span>
            <p className="text-xl font-bold text-amber-800 mt-1">
              ₹{parseFloat(stats.pendingPayments).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access to Important Functions */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Access Functions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenNewOrder}
            className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl text-left transition shadow-2xs flex flex-col justify-between cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">New Order</p>
              <p className="text-[11px] text-slate-500">Book customer order</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl text-left transition shadow-2xs flex flex-col justify-between cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">Add Customer</p>
              <p className="text-[11px] text-slate-500">Directory &amp; contacts</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('invoices')}
            className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl text-left transition shadow-2xs flex flex-col justify-between cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">Invoices &amp; Print</p>
              <p className="text-[11px] text-slate-500">PDFs &amp; tax receipts</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-xl text-left transition shadow-2xs flex flex-col justify-between cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <PricingIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">Services &amp; Pricing</p>
              <p className="text-[11px] text-slate-500">Rates &amp; fabric matrix</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Laundry Orders</h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            View All ({stats.totalOrders}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No recent orders recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Delivery Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map(({ order, customer }) => (
                  <tr
                    key={order.id}
                    onClick={() => onViewOrder(order.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-900">{customer?.name}</p>
                      <p className="text-[11px] text-slate-500">{customer?.phone}</p>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={
                          order.paymentStatus === 'Paid'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      ₹{parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInvoice(order.id);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                        title="View Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
