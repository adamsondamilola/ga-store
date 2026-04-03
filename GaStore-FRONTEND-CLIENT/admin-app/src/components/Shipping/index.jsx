import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import ShippingList from './ShippingList';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Download, Filter, X, MapPin, Building, Truck } from 'lucide-react';
import statesList from '../../constants/States'; // Import the states list

const Shippings = () => {
  const [shippings, setShippings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState({ min: '', max: '' });
  const [sortField, setSortField] = useState('dateCreated');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Available data for filters
  const [availableProviders, setAvailableProviders] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedStateSubdivisions, setSelectedStateSubdivisions] = useState([]);

  // Define available status options
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Failed', label: 'Failed' }
  ];

  // Fetch shipping providers
  const fetchProviders = async () => {
    try {
      const url = `${endpointsPath.shipping}/providers?pageNumber=1&pageSize=200`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setAvailableProviders(response.result.data);
      }
    } catch (error) {
      console.error("Failed to load shipping providers", error);
      toast.error("Failed to load shipping providers");
    }
  };

  // Extract unique cities from shipments
  const extractUniqueCities = (shippings) => {
    const cities = [...new Set(shippings
      .filter(shipping => shipping.city)
      .map(shipping => shipping.city)
      .sort()
    )];
    
    return cities;
  };

  // Build URL with all filters
  const buildUrlWithFilters = () => {
    let url = `${endpointsPath.shipping}?pageNumber=${page}&pageSize=${pageSize}`;
    
    // Add search term filter
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    // Add status filter if not 'all'
    if (statusFilter !== 'all') {
      url += `&status=${statusFilter}`;
    }

    // Add date range filter
    if (startDate) {
      url += `&startDate=${startDate.toISOString()}`;
    }
    if (endDate) {
      url += `&endDate=${endDate.toISOString()}`;
    }

    // Add state filter
    if (stateFilter) {
      url += `&state=${encodeURIComponent(stateFilter)}`;
    }

    // Add city filter
    if (cityFilter) {
      url += `&city=${encodeURIComponent(cityFilter)}`;
    }

    // Add provider filter
    if (providerFilter) {
      url += `&provider=${encodeURIComponent(providerFilter)}`;
    }

    // Add price range filter
    if (priceRangeFilter.min !== '') {
      url += `&minPrice=${priceRangeFilter.min}`;
    }
    if (priceRangeFilter.max !== '') {
      url += `&maxPrice=${priceRangeFilter.max}`;
    }

    // Add sorting
    url += `&sortField=${sortField}&sortDirection=${sortDirection}`;

    return url;
  };

  const fetchShippings = async () => {
    setLoading(true);
    try {
      const url = buildUrlWithFilters();
      const response = await requestHandler.get(url, true);
      
      if (response.statusCode === 200 && response.result?.data) {
        setShippings(response.result.data);
        setTotalPages(Math.ceil(response.result.totalRecords / pageSize));
        setTotalRecords(response.result.totalRecords);
        
        // Extract cities from shipment data for the city filter dropdown
        const uniqueCities = extractUniqueCities(response.result.data);
        setAvailableCities(uniqueCities);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipping?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.shipping}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Shipping deleted successfully');
        fetchShippings();
      } else {
        toast.error(response.result?.message || 'Failed to delete shipping');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete shipping');
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleStateFilterChange = (stateName) => {
    setStateFilter(stateName);
    setCityFilter(''); // Reset city when state changes
    setPage(1);
    
    // Update available subdivisions based on selected state
    const selectedState = statesList.find(state => state.name === stateName);
    if (selectedState) {
      setSelectedStateSubdivisions(selectedState.subdivision || []);
    } else {
      setSelectedStateSubdivisions([]);
    }
  };

  const handleCityFilterChange = (city) => {
    setCityFilter(city);
    setPage(1);
  };

  const handleProviderFilterChange = (provider) => {
    setProviderFilter(provider);
    setPage(1);
  };

  const handlePriceRangeChange = (field, value) => {
    setPriceRangeFilter(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange([null, null]);
    setStateFilter('');
    setCityFilter('');
    setProviderFilter('');
    setPriceRangeFilter({ min: '', max: '' });
    setSelectedStateSubdivisions([]);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const handleExport = async (format = 'csv') => {
    setExportLoading(true);
    try {
      let exportUrl = `${endpointsPath.shipping}/export?`;
      
      const params = [];
      if (searchTerm) params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (startDate) params.push(`startDate=${startDate.toISOString()}`);
      if (endDate) params.push(`endDate=${endDate.toISOString()}`);
      if (stateFilter) params.push(`state=${encodeURIComponent(stateFilter)}`);
      if (cityFilter) params.push(`city=${encodeURIComponent(cityFilter)}`);
      if (providerFilter) params.push(`provider=${encodeURIComponent(providerFilter)}`);
      if (priceRangeFilter.min !== '') params.push(`minPrice=${priceRangeFilter.min}`);
      if (priceRangeFilter.max !== '') params.push(`maxPrice=${priceRangeFilter.max}`);
      if (format !== 'json') params.push(`format=${format}`);
      
      exportUrl += params.join('&');

      const response = await requestHandler.get(exportUrl, true);
      
      if (response.statusCode === 200) {
        if (format === 'csv' || format === 'excel') {
          const blob = new Blob([response.result], { 
            type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' 
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `shippings-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success(`Exported ${shippings.length} shipments`);
        } else if (format === 'json') {
          const dataStr = JSON.stringify(response.result, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = `shippings-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export shipments');
    } finally {
      setExportLoading(false);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (startDate || endDate) count++;
    if (stateFilter) count++;
    if (cityFilter) count++;
    if (providerFilter) count++;
    if (priceRangeFilter.min !== '' || priceRangeFilter.max !== '') count++;
    return count;
  }, [searchTerm, statusFilter, startDate, endDate, stateFilter, cityFilter, providerFilter, priceRangeFilter]);

  // Initialize data on component mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Fetch shipments when filters change
  useEffect(() => {
    fetchShippings();
  }, [searchTerm, page, statusFilter, startDate, endDate, stateFilter, cityFilter, providerFilter, priceRangeFilter, sortField, sortDirection]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, order ID, tracking number..."
            className="border px-3 py-2 rounded w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded flex items-center gap-2 ${showAdvancedFilters ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            <Filter size={16} />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>

          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex items-center gap-2"
            disabled={activeFiltersCount === 0}
          >
            <X size={16} />
            Clear
          </button>

          {/*<div className="relative">
            <button
              onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
              disabled={exportLoading}
            >
              <Download size={16} />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
            
            <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>*/}
        </div>
      </div>

      {/* Quick Status Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === option.value
                  ? 'bg-brand text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                  setPage(1);
                }}
                isClearable={true}
                placeholderText="Select date range"
                className="border px-3 py-2 rounded w-full"
                dateFormat="yyyy-MM-dd"
              />
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <MapPin size={14} />
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => handleStateFilterChange(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All States</option>
                {statesList.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter - Shows subdivisions when state is selected, otherwise all cities */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Building size={14} />
                City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => handleCityFilterChange(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All Cities</option>
                {stateFilter ? (
                  // Show state subdivisions when a state is selected
                  selectedStateSubdivisions.map((subdivision, index) => (
                    <option key={index} value={subdivision}>
                      {subdivision}
                    </option>
                  ))
                ) : (
                  // Show all available cities from shipment data when no state is selected
                  availableCities.map((city, index) => (
                    <option key={index} value={city}>
                      {city}
                    </option>
                  ))
                )}
              </select>
              {stateFilter && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing cities in {stateFilter}
                </p>
              )}
            </div>

            {/* Provider Filter */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Truck size={14} />
                Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => handleProviderFilterChange(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All Providers</option>
                {availableProviders.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            {/* <div className="space-y-2">
              <label className="block text-sm font-medium">Price Range (₦)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRangeFilter.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="border px-3 py-2 rounded w-1/2"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRangeFilter.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="border px-3 py-2 rounded w-1/2"
                  min="0"
                />
              </div>
            </div>*/}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Active Filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Search: {searchTerm}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Status: {statusOptions.find(o => o.value === statusFilter)?.label}
                  </span>
                )}
                {startDate && endDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Date: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
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
                {providerFilter && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Provider: {providerFilter}
                  </span>
                )}
                {(priceRangeFilter.min !== '' || priceRangeFilter.max !== '') && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Price: ₦{priceRangeFilter.min || '0'} - ₦{priceRangeFilter.max || '∞'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Location & Provider Filters */}
      {!showAdvancedFilters && (stateFilter || cityFilter || providerFilter) && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-medium">Quick Filters:</span>
            {stateFilter && (
              <button 
                onClick={() => handleStateFilterChange('')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <MapPin size={10} />
                State: {stateFilter} ×
              </button>
            )}
            {cityFilter && (
              <button 
                onClick={() => handleCityFilterChange('')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <Building size={10} />
                City: {cityFilter} ×
              </button>
            )}
            {providerFilter && (
              <button 
                onClick={() => handleProviderFilterChange('')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <Truck size={10} />
                Provider: {providerFilter} ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sorting Options */}
      {/*<div className="mb-4 flex flex-wrap gap-4 items-center text-sm">
        <span className="font-medium">Sort by:</span>
        <button
          onClick={() => handleSort('dateCreated')}
          className={`px-3 py-1 rounded ${sortField === 'dateCreated' ? 'bg-gray-300' : 'bg-gray-100'}`}
        >
          Date {sortField === 'dateCreated' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('fullName')}
          className={`px-3 py-1 rounded ${sortField === 'fullName' ? 'bg-gray-300' : 'bg-gray-100'}`}
        >
          Name {sortField === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('shippingCost')}
          className={`px-3 py-1 rounded ${sortField === 'shippingCost' ? 'bg-gray-300' : 'bg-gray-100'}`}
        >
          Price {sortField === 'shippingCost' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>*/}

      <ShippingList
        loading={loading}
        shippings={shippings}
        onDelete={handleDelete}
        fetchShippings={fetchShippings}
      />

      {shippings.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No shipments found
          {activeFiltersCount > 0 && (
            <div className="mt-2">
              <button 
                onClick={clearFilters}
                className="text-blue-500 hover:underline"
              >
                Clear filters to see all shipments
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
    </div>
  );
};

export default Shippings;