import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@mui/material';
import { Modal, ModalBody } from 'flowbite-react';
import { Percent, Plus } from 'lucide-react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import Spinner from '../../utils/loader';
import ProductWorkspaceShell, { ProductSurface } from '../Products/ProductWorkspaceShell';

const VatComponent = () => {
  const [vats, setVats] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const initialFormState = {
    id: null,
    percentage: 7,
    isActive: true,
  };

  const fetchVats = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.vat}?pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setVats(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load VAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVats();
  }, [page, pageSize]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this VAT?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.vat}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('VAT deleted successfully');
        fetchVats();
      } else {
        toast.error(response.result?.message || 'Failed to delete VAT');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete VAT');
    }
  };

  const handleEdit = (vat) => {
    setFormData(vat);
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setFormData(initialFormState);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = formData.id
        ? await requestHandler.put(`${endpointsPath.vat}/${formData.id}`, formData, true)
        : await requestHandler.post(endpointsPath.vat, formData, true);

      if (response.statusCode < 202) {
        toast.success(`VAT ${formData.id ? 'updated' : 'created'} successfully`);
        setFormModalOpen(false);
        fetchVats();
      } else {
        toast.error(response.result?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Operation failed:', err);
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const stats = useMemo(() => {
    const activeVat = vats.find((vat) => vat.isActive);
    return [
      { label: 'VAT records', value: vats.length, helper: `${totalPages} pages` },
      { label: 'Active rate', value: activeVat ? `${activeVat.percentage}%` : 'None', helper: 'Current' },
      {
        label: 'Inactive rates',
        value: vats.filter((vat) => !vat.isActive).length,
        helper: 'Archived',
      },
    ];
  }, [vats, totalPages]);

  return (
    <ProductWorkspaceShell
      eyebrow="Products"
      title="VAT settings"
      description="Control product tax rates and switch the active percentage used across the catalog and checkout flows."
      stats={stats}
      actions={
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-[#ea580c]"
        >
          <Plus className="h-4 w-4" />
          Add VAT
        </button>
      }
    >
      <ProductSurface>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading VAT records...</div>
        ) : (
          <div className="grid gap-4">
            {vats.map((vat) => (
              <div
                key={vat.id}
                className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{vat.percentage}%</p>
                    <p className="text-sm text-slate-500">Product VAT rate</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      vat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {vat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vat)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vat.id)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {vats.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                No VAT records found.
              </div>
            ) : null}
          </div>
        )}
      </ProductSurface>

      <ProductSurface className="pt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </ProductSurface>

      <Spinner loading={loading} />

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} title={formData?.id ? 'Edit VAT' : 'Add VAT'}>
        <ModalBody>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">VAT percentage</label>
                <input
                  type="number"
                  name="percentage"
                  value={formData?.percentage || '0.00'}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                  required
                />
              </div>
              <label className="mt-8 flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData?.isActive || false}
                  onChange={handleInputChange}
                />
                Active VAT
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" onClick={() => setFormModalOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}>
                {formData?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </ProductWorkspaceShell>
  );
};

export default VatComponent;
