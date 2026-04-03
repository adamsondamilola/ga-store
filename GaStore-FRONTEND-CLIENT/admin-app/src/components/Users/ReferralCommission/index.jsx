import React, { useEffect, useState } from 'react';
import Pagination from '../../Pagination';
import requestHandler from '../../../utils/requestHandler';
import endpointsPath from '../../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import { Button } from '@mui/material';
import ClassStyle from '../../../class-styles';
import { Modal, ModalBody } from 'flowbite-react';
import Spinner from '../../../utils/loader';

const ReferralCommissionComponent = () => {
  const [commissions, setCommissions] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.referralCommission}?pageNumber=${page}&pageSize=${pageSize}`;
      
      if (statusFilter !== 'all') {
        url += `&isActive=${statusFilter === 'active'}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setCommissions(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load referral commissions');
    } finally {
      setLoading(false);
    }
  };

  const initialFormState = {
    id: null,
    percentage: 0,
    minAmount: 0,
    maxAmount: 0,
    isDefault: true,
    //isActive: true
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.referralCommission}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Commission deleted successfully');
        fetchCommissions();
      } else {
        toast.error(response.result?.message || 'Failed to delete commission');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete commission');
    }
  };

  const handleEdit = (commission) => {
    setFormData(commission);
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setFormData(initialFormState);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (formData.percentage < 0 || formData.percentage > 100) {
      toast.error('Percentage must be between 0 and 100');
      return;
    }

    if (formData.minAmount < 0 || formData.maxAmount < 0) {
      toast.error('Amounts cannot be negative');
      return;
    }

    if (formData.maxAmount < formData.minAmount) {
      toast.error('Max amount must be greater than min amount');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (formData.id) {
        // Update existing
        response = await requestHandler.put(
          `${endpointsPath.referralCommission}/${formData.id}`,
          formData,
          true
        );
      } else {
        // Create new
        response = await requestHandler.post(
          endpointsPath.referralCommission,
          formData,
          true
        );
      }

      if (response.statusCode < 202) {
        toast.success(`Commission ${formData.id ? 'updated' : 'created'} successfully`);
        setFormModalOpen(false);
        fetchCommissions();
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
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  useEffect(() => {
    fetchCommissions();
  }, [page, statusFilter]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleCreate} className={ClassStyle.button}>
            Add New Commission
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Percentage</th>
                <th className="py-2 px-4 border-b">Min Amount</th>
                <th className="py-2 px-4 border-b">Max Amount</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <td className="py-2 px-4 border-b">{commission.percentage}%</td>
                  <td className="py-2 px-4 border-b">{commission.minAmount.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">{commission.maxAmount.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      commission.isDefault ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {commission.isDefault ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(commission)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    {!commission.isDefault && (
                      <button
                        onClick={() => handleDelete(commission.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {commissions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">No commissions found</div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <Spinner loading={loading}/>

      {/* Form Modal */}
      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} 
             title={formData?.id ? 'Edit Commission' : 'Add New Commission'}>
        <ModalBody>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Percentage*</label>
                <input
                  type="number"
                  name="percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData?.percentage || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Min Amount</label>
                <input
                  type="number"
                  name="minAmount"
                  min="0"
                  step="0.01"
                  value={formData?.minAmount || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Max Amount</label>
                <input
                  type="number"
                  name="maxAmount"
                  min="0"
                  step="0.01"
                  value={formData?.maxAmount || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData?.isDefault || false}
                    onChange={handleInputChange}
                    className="mr-2"
                    id="isDefaultCheckbox"
                  />
                  <label htmlFor="isDefaultCheckbox">Active</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="bg-gray-300 text-gray-800"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-500 text-white">
                {formData?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ReferralCommissionComponent;