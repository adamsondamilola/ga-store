import React, { useEffect, useState } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import { Button } from '@mui/material';
import ClassStyle from '../../class-styles';
import { Modal, ModalBody } from 'flowbite-react';
import Spinner from '../../utils/loader';
import statesList from '../../constants/States';

const DeliveryLocations = () => {
  const [locations, setLocations] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState(true);
  const [states, setStates] = useState(statesList);
  const [subdivisions, setSubdivisions] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedSubdivision, setSelectedSubdivision] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [priceWeights, setPriceWeights] = useState([]);
  const [shippingProviders, setShippingProviders] = useState([]);
  
  // New filter states
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [availableCities, setAvailableCities] = useState([]);

  const initialFormState = {
    id: null,
    pickupAddress: '',
    pickupDeliveryAmount: 0,
    doorDeliveryAmount: 0,
    city: '',
    hubName: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    phoneNumber: '',
    email: '',
    isActive: true,
    isHomeDelivery: false,
    estimatedDeliveryDays: 3,
    shippingProvider: '',
    workingHours: '',
    priceByWeights: []
  };

  const initialPriceWeight = {
    minWeight: 0,
    maxWeight: 0,
    price: 0,
    deliveryLocationId: null
  };

  const fetchShippingProviders = async () => {
    try {
      const url = `${endpointsPath.shippingProviders}?pageNumber=1&pageSize=200`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setShippingProviders(response.result.data);
      } else {
        toast.error(response.result?.message || "Failed to load shipping providers");
      }
    } catch (error) {
      console.error("Failed to load shipping providers", error);
      toast.error("Failed to load shipping providers");
    }
  };

  // Extract unique cities from locations for filter dropdown
  const extractUniqueCities = (locations) => {
    const cities = [...new Set(locations
      .filter(location => location.city)
      .map(location => location.city)
      .sort()
    )];
    return cities;
  };

  const fetchLocations = async () => {
    //setLoading(true);
    try {
      let url = `${endpointsPath.deliveryLocation}?pageNumber=${page}&pageSize=${pageSize}`;
      
      // Add search term filter
      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      // Add status filter
      if (statusFilter !== 'all') {
        url += `&isActive=${statusFilter === true}`;
      }

      // Add state filter
      if (stateFilter) {
        url += `&state=${encodeURIComponent(stateFilter)}`;
      }

      // Add city filter
      if (cityFilter) {
        url += `&city=${encodeURIComponent(cityFilter)}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setLocations(response.result.data);
        setTotalPages(Math.ceil(response.result.totalRecords / pageSize));
        setTotalRecords(response.result.totalRecords);
        
        // Update available cities for filter dropdown
        const uniqueCities = extractUniqueCities(response.result.data);
        setAvailableCities(uniqueCities);
      } else {
        toast.error(response.result?.message || 'Failed to load delivery locations');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load delivery locations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.deliveryLocation}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Location deleted successfully');
        fetchLocations();
      } else {
        toast.error(response.result?.message || 'Failed to delete location');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete location');
    }
  };

  const handleEdit = (location) => {
    setFormData({
      ...initialFormState,
      ...location
    });
    
    fetchShippingProviders();

    // Set state and subdivision selections
    const state = statesList.find(s => s.name === location.state);
    if (state) {
      setSelectedState(state.code);
      setSubdivisions(state.subdivision || []);
      
      if (state.subdivision?.includes(location.city)) {
        setSelectedSubdivision(location.city);
      } else {
        setSelectedSubdivision('');
      }
    } else {
      setSelectedState('');
      setSelectedSubdivision('');
    }

    // Set price weights
    if (location.priceByWeights && location.priceByWeights.length > 0) {
      setPriceWeights(location.priceByWeights);
    } else {
      setPriceWeights([{ ...initialPriceWeight }]);
    }
    
    setFormModalOpen(true);
  };

  const handleCreate = () => {
    setFormData(initialFormState);
    setSelectedState('');
    setSelectedSubdivision('');
    setSubdivisions([]);
    setPriceWeights([{ ...initialPriceWeight }]);
    setFormModalOpen(true);
    fetchShippingProviders();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      
      // Prepare payload with correct structure
      const payload = {
        ...formData,
        pickupDeliveryAmount: parseFloat(formData.pickupDeliveryAmount) || 0,
        doorDeliveryAmount: parseFloat(formData.doorDeliveryAmount) || 0,
        estimatedDeliveryDays: parseInt(formData.estimatedDeliveryDays) || 3,
        priceByWeights: priceWeights.map(pw => ({
          ...pw,
          minWeight: parseFloat(pw.minWeight) || 0,
          maxWeight: parseFloat(pw.maxWeight) || 0,
          price: parseFloat(pw.price) || 0,
          deliveryLocationId: formData.id || null
        }))
      };

      if (formData.id) {
        response = await requestHandler.put(
          `${endpointsPath.deliveryLocation}`,
          payload,
          true
        );
      } else {
        // Create new - use POST
        response = await requestHandler.post(
          endpointsPath.deliveryLocation,
          payload,
          true
        );
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(`Location ${formData.id ? 'updated' : 'created'} successfully`);
        setFormModalOpen(false);
        fetchLocations();
      } else {
        toast.error(response.result?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Operation failed:', err);
      toast.error('Operation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const stateCode = e.target.value;
    setSelectedState(stateCode);
    
    const state = statesList.find(state => state.code === stateCode);
    const newSubdivisions = state?.subdivision || [];
    setSubdivisions(newSubdivisions);
    setSelectedSubdivision('');
    
    setFormData({
      ...formData,
      state: state?.name || '',
      city: ''
    });
  };

  const handleSubdivisionChange = (e) => {
    const subdivision = e.target.value;
    setSelectedSubdivision(subdivision);
    setFormData({
      ...formData,
      city: subdivision
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Price weight handlers
  const handlePriceWeightChange = (index, field, value) => {
    const updatedWeights = [...priceWeights];
    updatedWeights[index] = {
      ...updatedWeights[index],
      [field]: value
    };
    setPriceWeights(updatedWeights);
  };

  const addPriceWeight = () => {
    setPriceWeights([...priceWeights, { ...initialPriceWeight }]);
  };

  const removePriceWeight = (index) => {
    if (priceWeights.length > 1) {
      const updatedWeights = priceWeights.filter((_, i) => i !== index);
      setPriceWeights(updatedWeights);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  // New filter handlers
  const handleStateFilterChange = (e) => {
    setStateFilter(e.target.value);
    setPage(1);
  };

  const handleCityFilterChange = (e) => {
    setCityFilter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('');
    setCityFilter('');
    setStatusFilter(true);
    setPage(1);
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileType)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setUploadModalOpen(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      let baseUrl = process.env.REACT_APP_API_URL;
      if (process.env.REACT_APP_NODE_ENV !== "development") {
        baseUrl = process.env.REACT_APP_API_URL_LIVE;
      }
      
      xhr.open('POST', `${baseUrl}${endpointsPath.deliveryLocation}/bulk-upload-file`);
      xhr.setRequestHeader('Authorization', `Bearer ${requestHandler.getToken()}`);
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 207) {
          const result = JSON.parse(xhr.response);
          setUploadResult(result);
          if (result.successfulRecords > 0) {
            toast.success(`Successfully uploaded ${result.successfulRecords} locations`);
            fetchLocations();
          }
          if (result.failedRecords > 0) {
            toast.warning(`${result.failedRecords} records failed to upload`);
          }
        } else {
          let errorMessage = 'Upload failed';
          let result_fail = null;
          try {
            const result = JSON.parse(xhr.response);
            result_fail = result;
            errorMessage = result?.message || errorMessage;
          } catch (e) {}
          toast.error(errorMessage);
          setUploadResult({
            message: result_fail?.message || errorMessage,
            successfulRecords: result_fail?.successfulRecords || 0,
            failedRecords: result_fail?.failedRecords || 0,
            errors: result_fail?.errors || []
          });
        }
        setLoading(false);
      };
      
      xhr.onerror = () => {
        toast.error('Network error during upload');
        setLoading(false);
      };
      
      xhr.send(formData);
    } catch (error) {
      toast.error('Error uploading file: ' + error.message);
      setLoading(false);
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(timer);
  }, [page, statusFilter, searchTerm, stateFilter, cityFilter]); // Added new filter dependencies

  useEffect(() => {
    fetchShippingProviders();
  }, []);

  const downloadErrorReport = (errors) => {
  // Create CSV content
  const headers = ['Row', 'Provider', 'State', 'City', 'Error'];
  const rows = errors.map(error => [
    error.rowNumber || '',
    error.record?.shippingProvider || '',
    error.record?.state || '',
    error.record?.city || '',
    `"${(error.errorMessage || '').replace(/"/g, '""')}"` // Escape quotes for CSV
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `upload-errors-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search by state, city, provider..."
          className="border px-3 py-2 rounded w-full md:w-64"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* State Filter */}
          <select
            className="border px-3 py-2 rounded"
            value={stateFilter}
            onChange={handleStateFilterChange}
          >
            <option value="">All States</option>
            {statesList.map((state) => (
              <option key={state.code} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            className="border px-3 py-2 rounded"
            value={cityFilter}
            onChange={handleCityFilterChange}
          >
            <option value="">All Hubs</option>
            {availableCities.map((city, index) => (
              <option key={index} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            className="border px-3 py-2 rounded"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Providers</option>
            {shippingProviders.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          <button 
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
          >
            Clear Filters
          </button>

          <label htmlFor="bulk-upload" className={ClassStyle.button + " cursor-pointer"}>
            Bulk Upload
            <input
              id="bulk-upload"
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={handleBulkUpload}
            />
          </label>

          <button onClick={handleCreate} className={ClassStyle.button}>
            Add New
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || stateFilter || cityFilter || statusFilter !== 'all') && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Search: {searchTerm}
              </span>
            )}
            {stateFilter && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                State: {stateFilter}
              </span>
            )}
            {cityFilter && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                City: {cityFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Status: {statusFilter === 'true' ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 text-sm">
        <a 
          href="https://docs.google.com/spreadsheets/d/1ujEZeGLpACK6i-BQJ0GzufBYvCOP709G2moE2Z-e-A0/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Download Excel template
        </a>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b">State</th>
                <th className="py-2 px-4 border-b">Hub</th>
                <th className="py-2 px-4 border-b">Providers</th>
                <th className="py-2 px-4 border-b">Home Delivery</th>
                <th className="py-2 px-4 border-b">Delivery Days</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{location.state}</td>
                  <td className="py-2 px-4 border-b">{location.city}</td>
                  <td className="py-2 px-4 border-b">{location.shippingProvider}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      location.isHomeDelivery ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {location.isHomeDelivery ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{location.estimatedDeliveryDays} days</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(location)}
                      className="text-blue-500 hover:text-blue-700 mr-2 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
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

      {locations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No delivery locations found
          {(searchTerm || stateFilter || cityFilter || statusFilter !== 'all') && (
            <div className="mt-2">
              <button 
                onClick={clearFilters}
                className="text-blue-500 hover:underline"
              >
                Clear filters to see all locations
              </button>
            </div>
          )}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <Spinner loading={loading}/>

      {/* Form Modal */}
      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} size="4xl">
        <Modal.Header>
          {formData?.id ? 'Edit Location' : 'Add New Location'}
        </Modal.Header>
        <ModalBody>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* State field */}
              <div>
                <label className="block mb-1 text-sm font-medium">State *</label>
                <select
                  value={selectedState}
                  onChange={handleStateChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select a state</option>
                  {statesList.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City/Subdivision field */}
              <div>
                <label className="block mb-1 text-sm font-medium">Hub Name *</label>
                <div className="flex gap-2">
                  {/*<select
                    value={selectedSubdivision}
                    onChange={handleSubdivisionChange}
                    className="w-full border px-3 py-2 rounded flex-1"
                  >
                    <option value="">Select a city</option>
                    {subdivisions.map((subdivision, index) => (
                      <option key={index} value={subdivision}>
                        {subdivision}
                      </option>
                    ))}
                  </select>*/}
                  <input
                    type="text"
                    name="hubName"
                    value={formData?.hubName || ''}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded flex-1"
                    placeholder="Type hub name"
                    required
                  />
                </div>
              </div>

              {/*<div>
                <label className="block mb-1 text-sm font-medium">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData?.country || 'Nigeria'}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>*/}

             {/* <div>
                <label className="block mb-1 text-sm font-medium">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData?.postalCode || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>*/}

              <div>
                <label className="block mb-1 text-sm font-medium">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData?.phoneNumber || ''}
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
                <label className="block mb-1 text-sm font-medium">Pickup Address</label>
                <input
                  type="text"
                  name="pickupAddress"
                  value={formData?.pickupAddress || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
  <label className="block mb-1 text-sm font-medium">Shipping Provider *</label>
  <select
    name="shippingProvider"
    value={formData?.shippingProvider || ''}
    onChange={handleInputChange}
    className="w-full border px-3 py-2 rounded"
    required
  >
    <option value="">Select provider</option>

    {shippingProviders.map((p) => (
      <option key={p.id} value={p.name}>
        {p.name}
      </option>
    ))}
  </select>
</div>


              {/*<div>
                <label className="block mb-1 text-sm font-medium">Pickup Delivery Amount (₦)</label>
                <input
                  type="number"
                  name="pickupDeliveryAmount"
                  value={formData?.pickupDeliveryAmount || 0}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Door Delivery Amount (₦)</label>
                <input
                  type="number"
                  name="doorDeliveryAmount"
                  value={formData?.doorDeliveryAmount || 0}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  min="0"
                  step="0.01"
                />
              </div>*/}

              <div>
                <label className="block mb-1 text-sm font-medium">Estimated Delivery Days</label>
                <input
                  type="number"
                  name="estimatedDeliveryDays"
                  value={formData?.estimatedDeliveryDays || 3}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  min="1"
                />
              </div>

<div>
                <label className="block mb-1 text-sm font-medium">Working Hours</label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData?.workingHours || ''}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isHomeDelivery"
                  checked={formData?.isHomeDelivery || false}
                  onChange={handleInputChange}
                  className="mr-2"
                  id="isHomeDeliveryCheckbox"
                />
                <label htmlFor="isHomeDeliveryCheckbox" className="text-sm">Home Delivery Available</label>
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
                <label htmlFor="isActiveCheckbox" className="text-sm">Active Location</label>
              </div>
            </div>

            {/* Price by Weights Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Price by Weight Tiers</label>
                <button
                  type="button"
                  onClick={addPriceWeight}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Add Tier
                </button>
              </div>
              {priceWeights.map((weight, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                  <div>
                    <label className="block text-xs text-gray-600">Min Weight (kg)</label>
                    <input
                      type="number"
                      value={weight.minWeight || 0}
                      onChange={(e) => handlePriceWeightChange(index, 'minWeight', e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Max Weight (kg)</label>
                    <input
                      type="number"
                      value={weight.maxWeight || 0}
                      onChange={(e) => handlePriceWeightChange(index, 'maxWeight', e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Price (₦)</label>
                    <input
                      type="number"
                      value={weight.price || 0}
                      onChange={(e) => handlePriceWeightChange(index, 'price', e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    {priceWeights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePriceWeight(index)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm w-full"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Processing...' : (formData?.id ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {/* Upload Results Modal */}
      <Modal show={uploadModalOpen} onClose={() => {
  setUploadModalOpen(false);
  setUploadResult(null); // Clear results when closing
  setUploadProgress(0);
}}>
  <Modal.Header>
    {!uploadResult ? "Uploading File..." : "Bulk Upload Results"}
  </Modal.Header>
  
  <ModalBody>
    {!uploadResult ? (
      // Upload Progress View
      <div className="text-center p-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-gray-700 mb-2">Uploading your file...</p>
        <p className="text-sm text-gray-500 mb-4">{uploadProgress}% complete</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400">
          Please don't close this window until upload is complete
        </p>
      </div>
    ) : (
      // Results View
      <div>
        {/* Status Summary */}
        <div className={`p-4 rounded-lg mb-4 ${
          uploadResult.failedRecords === 0 
            ? 'bg-green-50 border border-green-200' 
            : uploadResult.successfulRecords === 0
            ? 'bg-red-50 border border-red-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center mb-2">
            {uploadResult.failedRecords === 0 ? (
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : uploadResult.successfulRecords === 0 ? (
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <h3 className={`text-lg font-semibold ${
              uploadResult.failedRecords === 0 
                ? 'text-green-700' 
                : uploadResult.successfulRecords === 0
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>
              {uploadResult.failedRecords === 0 
                ? 'Upload Successful!' 
                : uploadResult.successfulRecords === 0
                ? 'Upload Failed'
                : 'Partial Success'}
            </h3>
          </div>
          
          <p className="text-gray-700 mb-3">{uploadResult.message || 'Upload completed'}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-gray-800">{uploadResult.totalRecords || 0}</div>
            </div>
            <div className={`p-3 rounded border ${
              uploadResult.successfulRecords > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="font-medium text-gray-500">Successful</div>
              <div className={`text-2xl font-bold ${uploadResult.successfulRecords > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {uploadResult.successfulRecords || 0}
              </div>
            </div>
            <div className={`p-3 rounded border ${
              uploadResult.failedRecords > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="font-medium text-gray-500">Failed</div>
              <div className={`text-2xl font-bold ${uploadResult.failedRecords > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {uploadResult.failedRecords || 0}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-500">Status</div>
              <div className={`font-bold ${
                uploadResult.statusCode === 200 ? 'text-green-600' :
                uploadResult.statusCode === 207 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {uploadResult.statusCode === 200 ? 'Success' :
                 uploadResult.statusCode === 207 ? 'Partial Success' :
                 'Failed'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Details Section */}
        {uploadResult.errors?.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-700 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Error Details ({uploadResult.errors.length} error{uploadResult.errors.length !== 1 ? 's' : ''})
              </h4>
              
              {uploadResult.errorSummary && (
                <div className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">
                  {uploadResult.errorSummary.split('; ')[0]}
                </div>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Row
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadResult.errors.map((error, index) => (
                      <tr key={index} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {error.rowNumber || index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {error.record?.shippingProvider || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {error.record?.state || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          {error.errorMessage || 'Unknown error'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Download Error Report */}
              {uploadResult.errors.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <button
                    onClick={() => downloadErrorReport(uploadResult.errors)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Error Report (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Successful Items (Optional - can be collapsed) */}
        {uploadResult.successfulItems?.length > 0 && uploadResult.failedRecords > 0 && (
          <div className="mb-6">
            <details className="border rounded-lg overflow-hidden">
              <summary className="bg-gray-50 px-4 py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-center">
                  <span>Show {uploadResult.successfulItems.length} Successful Records</span>
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </summary>
              <div className="p-4 bg-white max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {uploadResult.successfulItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600 p-2 border-l-4 border-green-500 bg-green-50">
                      <span className="font-medium">{item.shippingProvider}</span> - {item.city}, {item.state}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setUploadModalOpen(false);
              setUploadResult(null);
              setUploadProgress(0);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          {uploadResult.errors?.length > 0 && (
            <div className="space-x-2">
              <button
                onClick={() => downloadErrorReport(uploadResult.errors)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Download Error Report
              </button>
             { /* <button
                onClick={() => {
                  // Function to retry failed uploads
                  handleRetryFailed(uploadResult.errors);
                  setUploadModalOpen(false);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Retry Failed Items
              </button>*/}
            </div>
          )}
        </div>
      </div>
    )}
  </ModalBody>
</Modal>

    </div>
  );
};

export default DeliveryLocations;