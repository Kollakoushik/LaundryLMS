import React, { useState, useEffect } from 'react';
import { InvoiceWithDetails } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  FileText,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';

interface InvoicesViewProps {
  onViewInvoiceModal: (orderId: number) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onViewInvoiceModal,
}) => {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<InvoiceWithDetails[]>('/api/invoices');
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.invoice.invoiceNumber.toLowerCase().includes(q) ||
      item.order.orderNumber.toLowerCase().includes(q) ||
      item.customer.name.toLowerCase().includes(q) ||
      item.customer.phone.includes(q)
    );
  });

  const totalInvoiced = invoices.reduce(
    (acc, it) => acc + (parseFloat(it.invoice.totalAmount) || 0),
    0
  );
  const totalPaid = invoices
    .filter((it) => it.invoice.paymentStatus === 'Paid')
    .reduce((acc, it) => acc + (parseFloat(it.invoice.totalAmount) || 0), 0);
  const totalPending = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Invoices &amp; Billing
          </h1>
          <p className="text-xs text-slate-500">
            Automated tax invoices, print receipts, and customer billing histories
          </p>
        </div>

        {/* Quick Billing Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-slate-500">Total Billed: </span>
            <span className="font-bold text-slate-900">₹{totalInvoiced.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
            <span className="text-emerald-600">Collected: </span>
            <span className="font-bold">₹{totalPaid.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice # (INV-...), order #, customer name, phone..."
            className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No invoices found</p>
            <p className="text-xs text-slate-500 mt-1">
              Invoices are automatically created whenever a new order is placed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(({ invoice, order, customer }) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onViewInvoiceModal(order.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-[11px] text-slate-500">{customer.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(invoice.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          invoice.paymentStatus === 'Paid'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {invoice.paymentStatus === 'Paid' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {invoice.paymentStatus} ({invoice.paymentMethod})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{parseFloat(invoice.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInvoiceModal(order.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition"
                      >
                        <Eye className="w-3 h-3" />
                        View / Print
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
