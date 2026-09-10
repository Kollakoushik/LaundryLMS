import React, { useState, useEffect } from 'react';
import { Service, ClothType, PricingRule } from '../types.ts';
import { apiRequest } from '../lib/api.ts';
import {
  DollarSign,
  Plus,
  Shirt,
  Sparkles,
  Check,
  Edit2,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const PricingView: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [clothTypes, setClothTypes] = useState<ClothType[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // New Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [savingService, setSavingService] = useState(false);

  // New Cloth Type Modal State
  const [clothModalOpen, setClothModalOpen] = useState(false);
  const [clothName, setClothName] = useState('');
  const [clothCategory, setClothCategory] = useState('Topwear');
  const [clothDefaultPrice, setClothDefaultPrice] = useState('50.00');
  const [savingCloth, setSavingCloth] = useState(false);

  // Matrix Editing State: clothId-serviceId -> current string price
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [srvRes, clothRes, pricingRes] = await Promise.all([
        apiRequest<Service[]>('/api/services'),
        apiRequest<ClothType[]>('/api/cloth-types'),
        apiRequest<{ rules: PricingRule[] }>('/api/pricing'),
      ]);
      setServices(srvRes || []);
      setClothTypes(clothRes || []);
      setPricingRules(pricingRes?.rules || []);

      // Populate priceInputs
      const initialMap: Record<string, string> = {};
      pricingRes?.rules?.forEach((r) => {
        initialMap[`${r.clothTypeId}-${r.serviceId}`] = r.price;
      });
      setPriceInputs(initialMap);
    } catch (err) {
      console.error('Failed to load pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handlePriceChange = (clothId: number, srvId: number, value: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [`${clothId}-${srvId}`]: value,
    }));
  };

  const handleSavePriceRule = async (clothId: number, srvId: number) => {
    const key = `${clothId}-${srvId}`;
    const priceValue = priceInputs[key] || '0';
    try {
      await apiRequest('/api/pricing', {
        method: 'POST',
        body: JSON.stringify({
          clothTypeId: clothId,
          serviceId: srvId,
          price: priceValue,
        }),
      });
      setSavedSuccessKey(key);
      setTimeout(() => setSavedSuccessKey(null), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;
    setSavingService(true);
    try {
      const newSrv = await apiRequest<Service>('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: serviceName.trim(),
          description: serviceDesc.trim(),
        }),
      });
      setServices([...services, newSrv]);
      setServiceModalOpen(false);
      setServiceName('');
      setServiceDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create service');
    } finally {
      setSavingService(false);
    }
  };

  const handleCreateClothType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clothName.trim()) return;
    setSavingCloth(true);
    try {
      const newCloth = await apiRequest<ClothType>('/api/cloth-types', {
        method: 'POST',
        body: JSON.stringify({
          name: clothName.trim(),
          category: clothCategory.trim(),
          defaultPrice: clothDefaultPrice,
        }),
      });
      setClothTypes([...clothTypes, newCloth]);
      setClothModalOpen(false);
      setClothName('');
      setClothDefaultPrice('50.00');
    } catch (err: any) {
      alert(err.message || 'Failed to create cloth type');
    } finally {
      setSavingCloth(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Services &amp; Pricing Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure laundry services, fabric categories, and itemized pricing rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setClothModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            + Cloth Type
          </button>
          <button
            onClick={() => setServiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Laundry Service
          </button>
        </div>
      </div>

      {/* Services Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Active
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{srv.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {srv.description || 'Standard fabric treatment and finishing.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              Service ID: #{srv.id}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Pricing Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Dynamic Pricing Matrix (Cloth Type × Service)
            </h2>
            <p className="text-xs text-slate-500">
              Specify rate per cloth item and service type. Changes reflect immediately in new orders.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading pricing rules...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Cloth Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Fallback</th>
                  {services.map((s) => (
                    <th key={s.id} className="py-3 px-4 text-center">
                      {s.name} (₹)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clothTypes.map((cloth) => (
                  <tr key={cloth.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cloth.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {cloth.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      ₹{parseFloat(cloth.defaultPrice).toFixed(2)}
                    </td>

                    {/* Matrix Cells per Service */}
                    {services.map((s) => {
                      const key = `${cloth.id}-${s.id}`;
                      const currentVal =
                        priceInputs[key] !== undefined
                          ? priceInputs[key]
                          : cloth.defaultPrice;
                      const isSaved = savedSuccessKey === key;

                      return (
                        <td key={s.id} className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={currentVal}
                              onChange={(e) =>
                                handlePriceChange(cloth.id, s.id, e.target.value)
                              }
                              onBlur={() => handleSavePriceRule(cloth.id, s.id)}
                              className="w-16 px-1.5 py-1 text-xs text-right bg-white border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900"
                            />
                            {isSaved ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Add New Laundry Service</h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Steam Press, Stain Removal"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Description
                </label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="e.g., High-temperature steam sterilization and wrinkle-free finish"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  {savingService ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Cloth Type Modal */}
      {clothModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Add New Cloth Type</h3>
              <button
                onClick={() => setClothModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClothType} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cloth Name *
                </label>
                <input
                  type="text"
                  required
                  value={clothName}
                  onChange={(e) => setClothName(e.target.value)}
                  placeholder="e.g., Blazer, Silk Kurta, Curtain"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={clothCategory}
                  onChange={(e) => setClothCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Topwear">Topwear</option>
                  <option value="Bottomwear">Bottomwear</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Formal">Formal</option>
                  <option value="Bedding / Household">Bedding / Household</option>
                  <option value="Delicates">Delicates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Fallback Base Price (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={clothDefaultPrice}
                  onChange={(e) => setClothDefaultPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClothModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCloth}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  {savingCloth ? 'Saving...' : 'Add Cloth Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
