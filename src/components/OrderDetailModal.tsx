import React, { useState } from 'react';
import { OrderDetail } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  X,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Shirt,
  MapPin,
  Phone,
  Tag,
  AlertCircle,
  Check,
} from 'lucide-react';

interface OrderDetailModalProps {
  orderDetail: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderDetail,
  isOpen,
  onClose,
  onViewInvoice,
  onOrderUpdated,
}) => {
  if (!isOpen || !orderDetail) return null;

  const { order, customer, items, invoice } = orderDetail;

  const [status, setStatus] = useState(order.status);
  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate.split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdateStatus = async (newStatus: string) => {
    setSavingStatus(true);
    setMessage(null);
    try {
      await apiRequest(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus as any);
      setMessage(`Order status updated to "${newStatus}"`);
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleUpdateDeliveryDate = async () => {
    setSavingDelivery(true);
    setMessage(null);
    try {
      await apiRequest(`/api/orders/${order.id}/delivery-date`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryDate: new Date(deliveryDate).toISOString() }),
      });
      setMessage('Delivery date successfully updated');
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery date');
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleUpdatePayment = async () => {
    setSavingPayment(true);
    setMessage(null);
    try {
      await apiRequest(`/api/orders/${order.id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, paymentMethod }),
      });
      setMessage('Payment status successfully updated');
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setSavingPayment(false);
    }
  };

  const statusOptions = [
    'Received',
    'In Process',
    'Ready',
    'Delivered',
    'Cancelled',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Order Details: {order.orderNumber}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Booked on {new Date(order.orderDate).toLocaleDateString()} • {items.length} cloth items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {message && (
          <div className="mx-6 mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Customer & Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Customer Information
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1">{customer.name}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.phone}
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  {customer.address}
                </p>
                {customer.notes && (
                  <p className="italic text-slate-500 pt-1">
                    Note: {customer.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Status Updater */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                10. Order Status Management
              </span>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((st) => (
                  <button
                    key={st}
                    disabled={savingStatus}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      status === st
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Delivery Date Updater */}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  11. Delivery Date Management
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleUpdateDeliveryDate}
                    disabled={savingDelivery}
                    className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 disabled:opacity-60 transition"
                  >
                    {savingDelivery ? 'Saving...' : 'Update Date'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Manager */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                12. Payment Status Management
              </span>
              <p className="text-xs text-indigo-700">
                Current: <strong className="font-semibold">{paymentStatus}</strong> via{' '}
                <strong className="font-semibold">{paymentMethod}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>

              <button
                onClick={handleUpdatePayment}
                disabled={savingPayment}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                {savingPayment ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>

          {/* Cloth Items Table with Unique IDs */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Cloth / Item Entry with Unique Tag IDs
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {items.reduce((s, it) => s + it.quantity, 0)} total pcs
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Unique Cloth Tag ID</th>
                    <th className="py-2.5 px-3">Cloth Type</th>
                    <th className="py-2.5 px-3">Service Type</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700 text-[11px]">
                        {item.clothTagId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.clothTypeName}
                        {item.specialInstructions && (
                          <span className="block text-[11px] text-slate-500 italic mt-0.5">
                            Note: {item.specialInstructions}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.serviceName}</td>
                      <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{parseFloat(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              {order.notes && <p>Order Note: {order.notes}</p>}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Grand Total: </span>
              <span className="text-lg font-bold text-indigo-700">
                ₹{parseFloat(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
