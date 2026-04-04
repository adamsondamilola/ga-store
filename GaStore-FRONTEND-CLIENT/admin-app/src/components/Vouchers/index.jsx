import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageTitleComponent from '../PageTitle';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const emptyVoucherForm = {
  code: '',
  purchaserType: 'Individual',
  purchaserName: '',
  contactEmail: '',
  initialValue: '',
  remainingValue: '',
  currency: 'NGN',
  isActive: true,
  expiresAt: '',
  note: '',
};

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [voucherEditingId, setVoucherEditingId] = useState('');
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm);

  const fetchVouchers = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.voucher}/admin`,
        true
      );

      if (response.statusCode === 200) {
        setVouchers(response.result?.data || []);
      } else {
        toast.error(response.result?.message || 'Failed to load vouchers');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load vouchers');
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const resetVoucherForm = () => {
    setVoucherForm(emptyVoucherForm);
    setVoucherEditingId('');
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    setVoucherSaving(true);

    try {
      const payload = {
        ...voucherForm,
        initialValue: Number(voucherForm.initialValue || 0),
        remainingValue: Number(voucherForm.remainingValue || voucherForm.initialValue || 0),
        expiresAt: voucherForm.expiresAt || null,
      };

      const response = voucherEditingId
        ? await requestHandler.put(`${endpointsPath.voucher}/admin/${voucherEditingId}`, payload, true)
        : await requestHandler.post(`${endpointsPath.voucher}/admin`, payload, true);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(response.result?.message || 'Voucher saved');
        resetVoucherForm();
        await fetchVouchers();
      } else {
        toast.error(response.result?.message || 'Unable to save voucher');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to save voucher');
    } finally {
      setVoucherSaving(false);
    }
  };

  const handleVoucherEdit = (voucher) => {
    setVoucherEditingId(voucher.id);
    setVoucherForm({
      code: voucher.code || '',
      purchaserType: voucher.purchaserType || 'Individual',
      purchaserName: voucher.purchaserName || '',
      contactEmail: voucher.contactEmail || '',
      initialValue: voucher.initialValue ?? '',
      remainingValue: voucher.remainingValue ?? '',
      currency: voucher.currency || 'NGN',
      isActive: voucher.isActive ?? true,
      expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toISOString().slice(0, 16) : '',
      note: voucher.note || '',
    });
  };

  return (
    <div className="space-y-6">
      <PageTitleComponent title="Vouchers" />

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Voucher Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create vouchers for individual or company purchases and control whether they remain active.
            </p>
          </div>
        </div>

        <form onSubmit={handleVoucherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={voucherForm.code}
            onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
            className="border px-3 py-2 rounded"
            placeholder="Voucher code"
            required
          />
          <select
            value={voucherForm.purchaserType}
            onChange={(e) => setVoucherForm({ ...voucherForm, purchaserType: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            <option value="Individual">Individual</option>
            <option value="Company">Company</option>
          </select>
          <input
            value={voucherForm.purchaserName}
            onChange={(e) => setVoucherForm({ ...voucherForm, purchaserName: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Purchaser name"
          />
          <input
            value={voucherForm.contactEmail}
            onChange={(e) => setVoucherForm({ ...voucherForm, contactEmail: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Contact email"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={voucherForm.initialValue}
            onChange={(e) => setVoucherForm({ ...voucherForm, initialValue: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Initial value"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={voucherForm.remainingValue}
            onChange={(e) => setVoucherForm({ ...voucherForm, remainingValue: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Remaining value"
          />
          <input
            value={voucherForm.currency}
            onChange={(e) => setVoucherForm({ ...voucherForm, currency: e.target.value.toUpperCase() })}
            className="border px-3 py-2 rounded"
            placeholder="Currency"
          />
          <input
            type="datetime-local"
            value={voucherForm.expiresAt}
            onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <textarea
            value={voucherForm.note}
            onChange={(e) => setVoucherForm({ ...voucherForm, note: e.target.value })}
            className="border px-3 py-2 rounded md:col-span-2"
            placeholder="Internal note"
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 md:col-span-2">
            <input
              type="checkbox"
              checked={voucherForm.isActive}
              onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
            />
            <span>Voucher is active</span>
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={voucherSaving}
              className="px-4 py-2 rounded bg-black text-white disabled:bg-gray-300"
            >
              {voucherSaving ? 'Saving...' : voucherEditingId ? 'Update Voucher' : 'Create Voucher'}
            </button>
            {voucherEditingId && (
              <button
                type="button"
                onClick={resetVoucherForm}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Vouchers</h2>

        {vouchers.length === 0 ? (
          <div className="text-sm text-gray-500">No vouchers created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-start">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Owner</th>
                  <th className="py-3 pr-4">Balance</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b">
                    <td className="py-3 pr-4 font-medium text-gray-900">{voucher.code}</td>
                    <td className="py-3 pr-4">{voucher.purchaserType}</td>
                    <td className="py-3 pr-4">{voucher.purchaserName || '-'}</td>
                    <td className="py-3 pr-4">{voucher.currency} {Number(voucher.remainingValue || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4">{voucher.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleVoucherEdit(voucher)}
                        className="px-3 py-1 rounded border border-gray-300"
                      >
                        Edit
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
}
