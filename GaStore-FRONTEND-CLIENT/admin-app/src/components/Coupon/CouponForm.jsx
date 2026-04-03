import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const CouponForm = ({ open, onClose, fetchCoupons, formData }) => {
  const [form, setForm] = useState({
    code: '',
    description: '',
    globalUsageLimit: 0,
    usagePerUserLimit: 0,
    validFrom: '',
    validTo: '',
    isActive: true,
    tiers: []
  });

  const [newTier, setNewTier] = useState({ usageNumber: '', discountPercentage: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formData) setForm(formData);
  }, [formData]);

  const addTier = () => {
  const usageNum = Number(newTier.usageNumber);
  const discount = Number(newTier.discountPercentage);

  if (!usageNum || !discount) {
    toast.warning('Enter both usage number and discount %');
    return;
  }

  const exists = form.tiers.some(
    (t) => t.usageNumber === usageNum || t.discountPercentage === discount
  );

  if (exists) {
    toast.warning('Tier with same usage number or discount already exists');
    return;
  }

  setForm((prev) => ({
    ...prev,
    tiers: [...prev.tiers, { usageNumber: usageNum, discountPercentage: discount }]
  }));

  setNewTier({ usageNumber: '', discountPercentage: '' });
};


  const removeTier = (usageNumber) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.usageNumber !== usageNumber)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = formData ? 'put' : 'post';
      const url = formData
        ? `${endpointsPath.coupon}/${formData.id}`
        : endpointsPath.coupon;

      const response =
        method === 'post'
          ? await requestHandler.post(url, form, true)
          : await requestHandler.put(url, form, true);

      if (response.statusCode === 201 || response.statusCode === 200) {
        toast.success('Coupon saved successfully');
        fetchCoupons();
        onClose();
      } else {
        toast.error(response.result?.message || 'Failed to save coupon');
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">

        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {formData ? 'Edit Coupon' : 'Create Coupon'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border px-3 py-2 rounded w-full"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Global Usage Limit</label>
              <input
                type="number"
                value={form.globalUsageLimit}
                onChange={(e) => setForm({ ...form, globalUsageLimit: +e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Usage Per User</label>
              <input
                type="number"
                value={form.usagePerUserLimit}
                onChange={(e) => setForm({ ...form, usagePerUserLimit: +e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Valid From</label>
              <input
                type="date"
                value={form.validFrom?.substring(0, 10) || ''}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Valid To</label>
              <input
                type="date"
                value={form.validTo?.substring(0, 10) || ''}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
          </div>

          {/* Tiers Section */}
          <div>
            <label className="text-sm text-gray-600">Discount Tiers</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                placeholder="Usage #"
                value={newTier.usageNumber}
                onChange={(e) => setNewTier({ ...newTier, usageNumber: e.target.value })}
                className="border px-3 py-2 rounded w-24"
              />
              <input
                type="number"
                placeholder="% Off"
                value={newTier.discountPercentage}
                onChange={(e) => setNewTier({ ...newTier, discountPercentage: e.target.value })}
                className="border px-3 py-2 rounded w-24"
              />
              <button
                type="button"
                onClick={addTier}
                className="bg-brand text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>

            <ul className="mt-2 space-y-1">
              {form.tiers.map((tier) => (
                <li
                  key={tier.usageNumber}
                  className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded"
                >
                  <span>{tier.usageNumber}x — {tier.discountPercentage}% off</span>
                  <button
                    type="button"
                    onClick={() => removeTier(tier.usageNumber)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-white px-5 py-2 rounded hover:bg-primary-dark"
            >
              {saving ? 'Saving...' : 'Save Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponForm;
