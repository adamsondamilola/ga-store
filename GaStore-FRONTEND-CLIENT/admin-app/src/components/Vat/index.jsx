import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import { Button } from '@mui/material';
import ClassStyle from '../../class-styles';
import { Modal, ModalBody } from 'flowbite-react';
import Spinner from '../../utils/loader';
//import { Modal } from 'flowbite-react';

const VatComponent = () => {
  const [vats, setVats] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchVats = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.vat}?pageNumber=${page}&pageSize=${pageSize}`;
      
      if (statusFilter !== 'all') {
        url += `&isActive=${statusFilter === 'active'}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setVats(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load vat');
    } finally {
      setLoading(false);
    }
  };

    const initialFormState = {
    id: null,
    percentage: 7,
    isActive: true
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vat?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.vat}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Vat deleted successfully');
        fetchVats();
      } else {
        toast.error(response.result?.message || 'Failed to delete vat');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete vat');
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
      let response;
      if (formData.id) {
        // Update existing
        response = await requestHandler.put(
          `${endpointsPath.vat}/${formData.id}`,
          formData,
          true
        );
      } else {
        // Create new
        response = await requestHandler.post(
          endpointsPath.vat,
          formData,
          true
        );
      }

      if (response.statusCode < 202) {
        toast.success(`Vat ${formData.id ? 'updated' : 'created'} successfully`);
        setFormModalOpen(false);
        fetchVats();
      } else {
        toast.error(response.result?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Operation failed:', err);
      toast.error('Operation failed');
    }finally{
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
    fetchVats();
  }, [searchTerm, page, statusFilter]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        {/*<input
          type="text"
          placeholder="Search vats..."
          className="border px-3 py-2 rounded w-full md:w-64"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />*/}
        <div className="flex gap-2">
          <button onClick={handleCreate} className={ClassStyle.button}>
            Add New
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
                <th className="py-2 px-4 border-b">Precentage</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vats.map((vat) => (
                <tr key={vat.id}>
                  <td className="py-2 px-4 border-b">{vat.percentage}%</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(vat)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vat.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vats.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">No vat found</div>
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
      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} title={formData?.id ? 'Edit Vat' : 'Add New Vat'}>
        <ModalBody>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1">Vat*</label>
              <input
                type="number"
                name="percentage"
                value={formData?.percentage || '0.00'}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData?.isActive || false}
                onChange={handleInputChange}
                className="mr-2"
                id="isActiveCheckbox"
              />
              <label htmlFor="isActiveCheckbox">Active Vat</label>
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

export default VatComponent;