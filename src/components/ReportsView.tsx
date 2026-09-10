import React, { useState, useEffect } from 'react';
import { ReportData } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const data = await apiRequest<ReportData>('/api/reports');
        setReport(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Compiling business performance reports...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        No report data available yet.
      </div>
    );
  }

  const { summary, statusBreakdown, paymentMethodBreakdown } = report;
  const totalRevenueNum = parseFloat(summary.totalRevenue) || 0;
  const paidRevenueNum = parseFloat(summary.paidRevenue) || 0;
  const pendingRevenueNum = parseFloat(summary.pendingPayments) || 0;

  const collectionRate =
    totalRevenueNum > 0 ? Math.round((paidRevenueNum / totalRevenueNum) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Business Analytics &amp; Reports
        </h1>
        <p className="text-xs text-slate-500">
          Executive summary of order throughput, fulfillment rate, and payment receipts
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalOrders}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime processed orders</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {summary.completedOrders}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.totalOrders > 0
              ? `${Math.round((summary.completedOrders / summary.totalOrders) * 100)}% fulfillment rate`
              : '0%'}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active / In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {summary.pendingOrders}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.pendingDeliveries} awaiting dispatch
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹{totalRevenueNum.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {collectionRate}% collected to date
          </p>
        </div>
      </div>

      {/* Revenue Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Overview Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Revenue Collection Breakdown
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Collected Revenue</span>
                <span className="font-bold text-emerald-700">₹{paidRevenueNum.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Pending Receivables</span>
                <span className="font-bold text-amber-700">₹{pendingRevenueNum.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${100 - collectionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900">
              <span className="block text-[11px] font-semibold uppercase">Paid Amount</span>
              <span className="text-base font-bold">₹{paidRevenueNum.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-900">
              <span className="block text-[11px] font-semibold uppercase">Pending Due</span>
              <span className="text-base font-bold">₹{pendingRevenueNum.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Distribution Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Order Pipeline Status Breakdown
          </h2>

          <div className="space-y-3 pt-2">
            {['Received', 'In Process', 'Ready', 'Delivered', 'Cancelled'].map((st) => {
              const count = statusBreakdown[st] || 0;
              const pct = summary.totalOrders > 0 ? (count / summary.totalOrders) * 100 : 0;
              return (
                <div key={st}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{st}</span>
                    <span className="text-slate-500">
                      {count} orders ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        st === 'Delivered'
                          ? 'bg-emerald-600'
                          : st === 'Ready'
                          ? 'bg-purple-600'
                          : st === 'In Process'
                          ? 'bg-amber-500'
                          : st === 'Cancelled'
                          ? 'bg-rose-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Payment Method Volume &amp; Value
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Cash', 'UPI', 'Card'].map((method) => {
            const data = paymentMethodBreakdown[method] || { count: 0, amount: 0 };
            return (
              <div
                key={method}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  {method === 'Cash' ? (
                    <Banknote className="w-5 h-5" />
                  ) : method === 'UPI' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">{method} Payments</p>
                  <p className="text-base font-bold text-slate-900">
                    ₹{data.amount.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400">{data.count} transactions</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
