import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import { Modal, ModalBody } from 'flowbite-react';
import Spinner from '../../utils/loader';
import ClassStyle from '../../class-styles';

const ShippingProviders = () => {
  const [providers, setProviders] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  const initialFormState = {
    id: null,
    name: '',
    code: '',
    email: '',
    phoneNumber: '',
    description: '',
    isActive: true
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.shippingProviders}?pageNumber=${page}&pageSize=${pageSize}`;

      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setProviders(response.result.data);
        setTotalPages(Math.ceil(response.result.totalRecords / pageSize));
        setTotalRecords(response.result.totalRecords);
      } else {
        //toast.error(response.result?.message || 'Failed to load providers');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.shippingProviders}/${id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success('Provider deleted successfully');
        fetchProviders();
      } else {
        toast.error(response.result?.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const handleEdit = (provider) => {
    setFormData({
      ...initialFormState,
      ...provider
    });
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
        // Update
        response = await requestHandler.put(
          `${endpointsPath.shippingProviders}/${formData.id}`,
          formData,
          true
        );
      } else {
        // Create
        response = await requestHandler.post(
          endpointsPath.shippingProviders,
          formData,
          true
        );
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(`Provider ${formData.id ? 'updated' : 'created'} successfully`);
        setFormModalOpen(false);
        fetchProviders();
      } else {
        toast.error(response.result?.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 400);
    return () => clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toggle active/inactive state
    const handleToggleActive = async (provider) => {
      setIsToggling(true);
      try {
        const payload = { ...provider, isActive: !provider.isActive };
        const response = await requestHandler.put(`${endpointsPath.shippingProviders}/${provider.id}`, payload, true);
        if (response.statusCode === 200) {
          toast.success(`Provider ${provider.isActive ? 'deactivated' : 'activated'} successfully`);
          fetchProviders();
        } else {
          toast.error(response.result?.message || 'Failed to update provider');
        }
      } catch (error) {
        console.error('Toggle failed:', error);
        toast.error('Failed to update provider');
      } finally {
        setIsToggling(false);
      }
    };
  

  return (
    <div className="p-4">
      
      {/* Search + Add */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search provider..."
          className="border px-3 py-2 rounded w-full md:w-64"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />

        <div className="flex gap-2">
          <button onClick={handleCreate} className={ClassStyle.button}>
            Add Provider
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Code</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Phone</th>
                <th className="py-2 px-4 border-b">Active</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{provider.name}</td>
                  <td className="py-2 px-4 border-b">{provider.code}</td>
                  <td className="py-2 px-4 border-b">{provider.email}</td>
                  <td className="py-2 px-4 border-b">{provider.phoneNumber}</td>

<td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleToggleActive(provider)}
                  disabled={isToggling}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    provider.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {provider.isActive ? 'Active' : 'Inactive'}
                </button>
                <div onClick={() => handleToggleActive(provider)} className='text-xs cursor-pointer'>{provider.isActive ? 'Deactivate' : 'Activate'}</div>
              </td>

                  
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(provider)}
                      className="text-blue-500 hover:text-blue-700 mr-2 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {providers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No shipping providers found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <Spinner loading={loading} />

      {/* Form Modal */}
      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)}>
        <Modal.Header>
          {formData?.id ? 'Edit Provider' : 'Add Provider'}
        </Modal.Header>

        <ModalBody>
          <form onSubmit={handleFormSubmit}>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              <div>
                <label className="block mb-1 text-sm font-medium">Provider Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData?.code || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData?.email || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Phone Number </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData?.phoneNumber || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Status</label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData?.isActive || false}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm">Active Provider</span>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData?.description || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded h-24"
                ></textarea>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {formData?.id ? 'Update' : 'Create'}
              </button>
            </div>

          </form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ShippingProviders;
