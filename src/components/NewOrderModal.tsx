import React, { useState, useEffect } from 'react';
import { Customer, ClothType, Service, PricingRule, OrderDetail } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  UserPlus,
  ShoppingBag,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderDetail: OrderDetail) => void;
  preselectedCustomerId?: number;
}

interface ItemDraft {
  clothTypeId: number;
  clothTypeName: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: string;
  specialInstructions: string;
  deliveryDate: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  preselectedCustomerId,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clothTypes, setClothTypes] = useState<ClothType[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(
    preselectedCustomerId || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([]);

  // Quick Customer Creation inline state
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate default delivery date: 3 days from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    const formatted = defaultDate.toISOString().split('T')[0];
    setDeliveryDate(formatted);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      setLoadingConfig(true);
      try {
        const [custRes, srvRes, clothRes, priceRes] = await Promise.all([
          apiRequest<Customer[]>('/api/customers'),
          apiRequest<Service[]>('/api/services'),
          apiRequest<ClothType[]>('/api/cloth-types'),
          apiRequest<{ rules: PricingRule[] }>('/api/pricing'),
        ]);
        setCustomers(custRes || []);
        setServices(srvRes || []);
        setClothTypes(clothRes || []);
        setPricingRules(priceRes?.rules || []);

        // If preselected, select it
        if (preselectedCustomerId) {
          setSelectedCustomerId(preselectedCustomerId);
        } else if (custRes && custRes.length > 0 && selectedCustomerId === '') {
          setSelectedCustomerId(custRes[0].id);
        }

        // Initialize with 1 default item if empty
        if (items.length === 0 && clothRes && clothRes.length > 0 && srvRes && srvRes.length > 0) {
          const defaultCloth = clothRes[0];
          const defaultService = srvRes[0];
          const matchedRule = priceRes?.rules?.find(
            (r) => r.clothTypeId === defaultCloth.id && r.serviceId === defaultService.id
          );
          const price = matchedRule ? matchedRule.price : defaultCloth.defaultPrice;

          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 3);

          setItems([
            {
              clothTypeId: defaultCloth.id,
              clothTypeName: defaultCloth.name,
              serviceId: defaultService.id,
              serviceName: defaultService.name,
              quantity: 1,
              unitPrice: price,
              specialInstructions: '',
              deliveryDate: defaultDate.toISOString().split('T')[0],
            },
          ]);
        }
      } catch (err: any) {
        console.error('Failed to load order configuration:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadData();
  }, [isOpen]);

  // Helper to find price for a cloth + service pair
  const getCalculatedPrice = (clothId: number, srvId: number): string => {
    const rule = pricingRules.find(
      (r) => r.clothTypeId === clothId && r.serviceId === srvId
    );
    if (rule) return rule.price;
    const cloth = clothTypes.find((c) => c.id === clothId);
    return cloth ? cloth.defaultPrice : '50.00';
  };

  const handleAddItem = () => {
    if (clothTypes.length === 0 || services.length === 0) return;
    const cloth = clothTypes[0];
    const srv = services[0];
    const price = getCalculatedPrice(cloth.id, srv.id);

    setItems([
      ...items,
      {
        clothTypeId: cloth.id,
        clothTypeName: cloth.name,
        serviceId: srv.id,
        serviceName: srv.name,
        quantity: 1,
        unitPrice: price,
        specialInstructions: '',
        deliveryDate: deliveryDate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Keep at least one item
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemDraft, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'clothTypeId') {
      const selected = clothTypes.find((c) => c.id === Number(value));
      if (selected) {
        current.clothTypeName = selected.name;
        current.unitPrice = getCalculatedPrice(selected.id, current.serviceId);
      }
    } else if (field === 'serviceId') {
      const selected = services.find((s) => s.id === Number(value));
      if (selected) {
        current.serviceName = selected.name;
        current.unitPrice = getCalculatedPrice(current.clothTypeId, selected.id);
      }
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newCustAddress) {
      setErrorMessage('Name, phone, and address are required for new customer.');
      return;
    }
    try {
      const created = await apiRequest<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone,
          address: newCustAddress,
        }),
      });
      setCustomers([created, ...customers]);
      setSelectedCustomerId(created.id);
      setShowQuickAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create customer');
    }
  };

  const grandTotal = items.reduce((sum, it) => {
    const qty = Math.max(1, it.quantity || 1);
    const pr = parseFloat(it.unitPrice) || 0;
    return sum + qty * pr;
  }, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one cloth item.');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customerId: Number(selectedCustomerId),
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        paymentStatus,
        paymentMethod,
        notes,
        items: items.map((it) => ({
          clothTypeId: it.clothTypeId,
          clothTypeName: it.clothTypeName,
          serviceId: it.serviceId,
          serviceName: it.serviceName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          specialInstructions: it.specialInstructions,
          deliveryDate: it.deliveryDate ? new Date(it.deliveryDate).toISOString() : undefined,
        })),
      };

      const result = await apiRequest<{
        order: any;
        items: any[];
        invoice: any;
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      // Fetch full order detail for invoice modal
      const fullDetail = await apiRequest<OrderDetail>(`/api/orders/${result.order.id}`);
      onOrderCreated(fullDetail);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Laundry Order</h2>
              <p className="text-xs text-slate-500">
                Customer selection, multi-cloth items entry, and auto-invoicing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Customer Selection Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Customer
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showQuickAddCustomer ? 'Choose Existing' : '+ Quick Add Customer'}
              </button>
            </div>

            {showQuickAddCustomer ? (
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-indigo-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number *"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Full Delivery Address *"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCustomer(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateCustomer}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
                  >
                    Save &amp; Select
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              >
                <option value="" disabled>
                  -- Select a registered customer --
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.address.slice(0, 30)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cloth Items Entry Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Cloth Items Entry
                </label>
                <p className="text-xs text-slate-500">
                  Each garment will be assigned a unique tag ID upon order creation
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Garment #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {/* Cloth Type */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Cloth Type
                      </label>
                      <select
                        value={item.clothTypeId}
                        onChange={(e) =>
                          handleItemChange(index, 'clothTypeId', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      >
                        {clothTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.name} ({ct.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service Type */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Service Type
                      </label>
                      <select
                        value={item.serviceId}
                        onChange={(e) =>
                          handleItemChange(index, 'serviceId', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                    </div>

                    {/* Unit Price & Subtotal */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Unit Price (₹)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <input
                        type="text"
                        placeholder="Special instructions (e.g., Starch collar, remove ink stain)..."
                        value={item.specialInstructions}
                        onChange={(e) =>
                          handleItemChange(index, 'specialInstructions', e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="text-right text-xs text-slate-600 self-center">
                      Subtotal: <span className="font-bold text-slate-900">₹{(item.quantity * (parseFloat(item.unitPrice) || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            {/* Delivery Date (automatically 3 days, editable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Delivery Date (3-Day Default)
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'Pending' | 'Paid')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'UPI' | 'Card')}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {/* Order Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Notes / Internal Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deliver before 11 AM; gate pass required..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Summary & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Order Grand Total</p>
              <p className="text-xl font-bold text-indigo-700">₹{grandTotal.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-60 transition cursor-pointer"
              >
                {submitting ? 'Creating Order...' : 'Create Order & Generate Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
