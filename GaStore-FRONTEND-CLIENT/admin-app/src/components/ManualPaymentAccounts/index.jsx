import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const emptyForm = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  currency: 'NGN',
  swiftCode: '',
  routingNumber: '',
  branchCode: '',
};

export default function ManualPaymentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const fetchPaymentMethods = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.paymentMethodConfiguration}/admin`,
        true
      );

      if (response.statusCode === 200) {
        setPaymentMethods(response.result?.data || []);
      } else {
        toast.error(response.result?.message || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load payment methods');
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.bankAccount}/admin?pageNumber=1&pageSize=100`,
        true
      );

      if (response.statusCode === 200) {
        setAccounts(response.result?.data || []);
      } else {
        toast.error(response.result?.message || 'Failed to load manual payment accounts');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load manual payment accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchPaymentMethods();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
      };

      const response = editingId
        ? await requestHandler.put(`${endpointsPath.bankAccount}/admin/${editingId}`, payload, true)
        : await requestHandler.post(`${endpointsPath.bankAccount}/admin`, payload, true);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(response.result?.message || 'Manual payment account saved');
        resetForm();
        await fetchAccounts();
      } else {
        toast.error(response.result?.message || 'Unable to save account');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setForm({
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      accountName: account.accountName || '',
      currency: account.currency || 'NGN',
      swiftCode: account.swiftCode || '',
      routingNumber: account.routingNumber || '',
      branchCode: account.branchCode || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this manual payment account?')) return;

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.bankAccount}/admin/${id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.result?.message || 'Account deleted');
        if (editingId === id) resetForm();
        await fetchAccounts();
      } else {
        toast.error(response.result?.message || 'Unable to delete account');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to delete account');
    }
  };


  const handlePaymentMethodToggle = (methodKey) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.methodKey === methodKey
          ? {
              ...method,
              isEnabled: !method.isEnabled,
              isDefaultGateway: method.isGateway && method.isEnabled ? false : method.isDefaultGateway,
            }
          : method
      )
    );
  };

  const handleDefaultGatewayChange = (methodKey) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefaultGateway: method.methodKey === methodKey,
        isEnabled: method.methodKey === methodKey ? true : method.isEnabled,
      }))
    );
  };

  const savePaymentMethods = async () => {
    setPaymentSaving(true);

    try {
      const payload = paymentMethods.map((method) => ({
        methodKey: method.methodKey,
        isEnabled: method.isEnabled,
        isDefaultGateway: method.isDefaultGateway,
      }));

      const response = await requestHandler.put(
        `${endpointsPath.paymentMethodConfiguration}/admin`,
        payload,
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.result?.message || 'Payment methods updated');
        setPaymentMethods(response.result?.data || []);
      } else {
        toast.error(response.result?.message || 'Unable to update payment methods');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to update payment methods');
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enable or disable checkout methods, and choose which gateway should be the default card option.
            </p>
          </div>
          <button
            type="button"
            onClick={savePaymentMethods}
            disabled={paymentSaving || paymentMethods.length === 0}
            className="px-4 py-2 rounded bg-black text-white disabled:bg-gray-300"
          >
            {paymentSaving ? 'Saving...' : 'Save Payment Methods'}
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-sm text-gray-500">Loading payment methods...</div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.methodKey}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">{method.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {method.isGateway ? 'Online payment gateway' : 'Offline or wallet payment method'}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                  {method.isGateway && (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="defaultGateway"
                        checked={method.isDefaultGateway}
                        disabled={!method.isEnabled}
                        onChange={() => handleDefaultGatewayChange(method.methodKey)}
                      />
                      <span>Default gateway</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={method.isEnabled}
                      onChange={() => handlePaymentMethodToggle(method.methodKey)}
                    />
                    <span>{method.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manual Payment Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              These are the bank accounts shown to customers when they choose manual payment at checkout.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Bank name"
            required
          />
          <input
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Account name"
            required
          />
          <input
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Account number"
            required
          />
          <input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Currency"
          />
          <input
            value={form.swiftCode}
            onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Swift code"
          />
          <input
            value={form.routingNumber}
            onChange={(e) => setForm({ ...form, routingNumber: e.target.value })}
            className="border px-3 py-2 rounded"
            placeholder="Routing number"
          />
          <input
            value={form.branchCode}
            onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
            className="border px-3 py-2 rounded md:col-span-2"
            placeholder="Branch code"
          />

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-black text-white disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : editingId ? 'Update Account' : 'Add Account'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configured Accounts</h2>

        {loading ? (
          <div className="text-sm text-gray-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-gray-500">No manual payment accounts configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-start">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">Bank</th>
                  <th className="py-3 pr-4">Account Name</th>
                  <th className="py-3 pr-4">Account Number</th>
                  <th className="py-3 pr-4">Currency</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b">
                    <td className="py-3 pr-4">{account.bankName}</td>
                    <td className="py-3 pr-4">{account.accountName}</td>
                    <td className="py-3 pr-4">{account.accountNumber}</td>
                    <td className="py-3 pr-4">{account.currency || 'NGN'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(account)}
                          className="px-3 py-1 rounded border border-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(account.id)}
                          className="px-3 py-1 rounded border border-red-300 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
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
