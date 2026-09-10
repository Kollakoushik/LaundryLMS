import React from 'react';
import { OrderDetail } from '../types.ts';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  CheckCircle,
  Clock,
  Shirt,
  Calendar,
  Phone,
  MapPin,
  FileCheck,
} from 'lucide-react';

interface InvoiceModalProps {
  orderDetail: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  orderDetail,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !orderDetail) return null;

  const { order, customer, items, invoice } = orderDetail;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Color Palette
    const primaryColor = [79, 70, 229]; // Indigo
    const darkGray = [30, 41, 59];
    const lightGray = [100, 116, 139];

    // Header Branding
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LAUNDRY MANAGEMENT PORTAL', 15, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('TAX INVOICE & RECEIPT', 155, 16);

    // Invoice Meta Information
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${invoice?.invoiceNumber || 'INV-' + order.orderNumber}`, 15, 38);
    doc.text(`Order No: ${order.orderNumber}`, 15, 45);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 130, 38);
    doc.text(`Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}`, 130, 45);
    doc.text(`Status: ${order.status.toUpperCase()}`, 130, 52);
    doc.text(`Payment: ${order.paymentStatus.toUpperCase()} (${order.paymentMethod})`, 130, 59);

    // Customer Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 50, 100, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Billed To:', 18, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${customer.name}`, 18, 62);
    doc.text(`Phone: ${customer.phone}`, 18, 68);
    doc.text(`Address: ${customer.address.slice(0, 45)}`, 18, 74);

    // Items Table Header
    const startY = 86;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, startY, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Item Tag ID', 18, startY + 5.5);
    doc.text('Cloth Type', 50, startY + 5.5);
    doc.text('Service', 90, startY + 5.5);
    doc.text('Qty', 135, startY + 5.5);
    doc.text('Price (INR)', 150, startY + 5.5);
    doc.text('Total (INR)', 175, startY + 5.5);

    // Items Rows
    let currentY = startY + 14;
    doc.setFont('helvetica', 'normal');
    items.forEach((item, idx) => {
      doc.text(item.clothTagId, 18, currentY);
      doc.text(item.clothTypeName, 50, currentY);
      doc.text(item.serviceName, 90, currentY);
      doc.text(String(item.quantity), 137, currentY);
      doc.text(parseFloat(item.unitPrice).toFixed(2), 152, currentY);
      doc.text(parseFloat(item.subtotal).toFixed(2), 177, currentY);

      if (item.specialInstructions) {
        currentY += 4.5;
        doc.setFontSize(7.5);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text(`* Note: ${item.specialInstructions}`, 50, currentY);
        doc.setFontSize(9);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      }

      currentY += 8;
    });

    // Total Line
    doc.setDrawColor(203, 213, 225);
    doc.line(15, currentY, 195, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Grand Total:', 140, currentY);
    doc.text(`INR ${parseFloat(order.totalAmount).toFixed(2)}`, 175, currentY);

    currentY += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Thank you for choosing our laundry care services!', 15, currentY);
    doc.text('Please verify all garments upon delivery with respective tag IDs.', 15, currentY + 5);

    // Save File
    doc.save(`Invoice_${invoice?.invoiceNumber || order.orderNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Tax Invoice &amp; Delivery Receipt
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (Rendered on screen & print) */}
        <div className="p-8 print:p-6" id="printable-invoice">
          {/* Top Brand Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Shirt className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  Laundry Management
                </span>
              </div>
              <p className="text-xs text-slate-500">Premium Fabric Care &amp; Dry Cleaning</p>
              <p className="text-xs text-slate-500">Express Turnaround &amp; Hygiene Assured</p>
            </div>

            <div className="text-right">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
                Official Invoice
              </span>
              <p className="text-sm font-bold text-slate-900">
                {invoice?.invoiceNumber || `INV-${order.orderNumber.replace('ORD-', '')}`}
              </p>
              <p className="text-xs text-slate-500">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          {/* Customer & Order Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Customer Details
              </p>
              <p className="font-bold text-slate-900">{customer.name}</p>
              <p className="text-slate-600 flex items-center gap-1.5 mt-1 text-xs">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.phone}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5 mt-1 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customer.address}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Order Specifications
              </p>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(order.orderDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Delivery:</span>
                <span className="font-semibold text-indigo-600">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Status:</span>
                <span className="font-semibold text-slate-800">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span
                  className={`font-semibold inline-flex items-center gap-1 ${
                    order.paymentStatus === 'Paid'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {order.paymentStatus === 'Paid' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {order.paymentStatus} ({order.paymentMethod})
                </span>
              </div>
            </div>
          </div>

          {/* Cloth Items Table */}
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Item Tag ID</th>
                  <th className="py-2.5 px-3">Cloth Item</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-indigo-700">
                      {item.clothTagId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {item.clothTypeName}
                      {item.specialInstructions && (
                        <span className="block text-[10px] text-slate-500 italic mt-0.5">
                          Instruction: {item.specialInstructions}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.serviceName}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ₹{parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      ₹{parseFloat(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Summary Footer */}
          <div className="mt-6 flex justify-between items-start border-t border-slate-200 pt-4">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">Terms &amp; Instructions:</p>
              <p>• Garments verified with tagged identification numbers.</p>
              <p>• Standard 3-day turnaround or custom agreed delivery slot.</p>
              {order.notes && (
                <p className="text-slate-800 font-medium mt-1">
                  Order Note: {order.notes}
                </p>
              )}
            </div>

            <div className="text-right space-y-1.5 w-52">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Items Count:</span>
                <span className="font-medium">
                  {items.reduce((acc, it) => acc + it.quantity, 0)} pcs
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-indigo-600 text-base">
                  ₹{parseFloat(order.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="pt-2">
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Payment: {order.paymentStatus.toUpperCase()} ({order.paymentMethod})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
