import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Pagination from '../Pagination';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import OrderList from './OrderList';
import requestHandler from '../../utils/requestHandler';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Download, Filter, X, DollarSign, MapPin, Truck, Calendar, Tag } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [hasDiscount, setHasDiscount] = useState(null);
  const [customDateRange, setCustomDateRange] = useState([null, null]);
  const [startDate, endDate] = customDateRange;
  const [sortBy, setSortBy] = useState('datecreated');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // 👇 Extract couponCode and userId from query string
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const couponCode = queryParams.get('couponCode');
  const userId = queryParams.get('userId');

  // Filter dropdown data
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableShippingProviders, setAvailableShippingProviders] = useState([]);

  // Dropdown options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    //{ value: 'completed', label: 'Completed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const shippingStatusOptions = [
    { value: '', label: 'All Shipping Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'in transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    const loggedInUser =  async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if(resp.statusCode === 200){
          const roles = resp.result.data
          //const hasAdmin = roles.some(role => role.name === "Admin" || role.name === "Super Admin");
          setIsSuperAdmin(roles.some(role => role.name === "Super Admin"));
      }
  }
  loggedInUser();
  },[]) 

  // Extract unique data for filter dropdowns
  const extractFilterData = (orders) => {
    const states = [...new Set(orders
      .filter(order => order.shipping?.state)
      .map(order => order.shipping.state)
      .sort()
    )];
    
    const cities = [...new Set(orders
      .filter(order => order.shipping?.city)
      .map(order => order.shipping.city)
      .sort()
    )];
    
    const providers = [...new Set(orders
      .filter(order => order.shipping?.shippingProvider)
      .map(order => order.shipping.shippingProvider)
      .sort()
    )];
    
    return { states, cities, providers };
  };

  const fetchProviders = async () => {
      try {
        const url = `${endpointsPath.shipping}/providers?pageNumber=1&pageSize=200`;
        const response = await requestHandler.get(url, true);
  
        if (response.statusCode === 200 && response.result?.data) {
          setAvailableShippingProviders(response.result.data);
        }
      } catch (error) {
        console.error("Failed to load shipping providers", error);
        toast.error("Failed to load shipping providers");
      }
    };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.order}?pageNumber=${page}&pageSize=${pageSize}`;

      // Add all filters to URL
      const params = [];
      
      if (searchTerm) params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (dateRangeFilter !== 'all') params.push(`dateRange=${dateRangeFilter}`);
      if (couponCode) params.push(`couponCode=${couponCode}`);
      if (userId) params.push(`userId=${userId}`);
      if (minAmount) params.push(`minAmount=${minAmount}`);
      if (maxAmount) params.push(`maxAmount=${maxAmount}`);
      if (shippingStatus) params.push(`shippingStatus=${shippingStatus}`);
      if (shippingState) params.push(`shippingState=${encodeURIComponent(shippingState)}`);
      if (shippingCity) params.push(`shippingCity=${encodeURIComponent(shippingCity)}`);
      if (shippingProvider) params.push(`shippingProvider=${encodeURIComponent(shippingProvider)}`);
      if (hasDiscount !== null) params.push(`hasDiscount=${hasDiscount}`);
      if (startDate) params.push(`startDate=${startDate.toISOString()}`);
      if (endDate) params.push(`endDate=${endDate.toISOString()}`);
      if (sortBy) params.push(`sortBy=${sortBy}`);
      if (sortDirection) params.push(`sortDirection=${sortDirection}`);

      if (params.length > 0) {
        url += `&${params.join('&')}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setOrders(response.result.data);
        setTotalPages(response.result.totalPages || Math.ceil(response.result.totalRecords / pageSize));
        setTotalRecords(response.result.totalRecords);
        setTotalSalesAmount(response.result.totalSalesAmount || 0);
        
        // Extract filter data
        const { states, cities, providers } = extractFilterData(response.result.data);
        setAvailableStates(states);
        setAvailableCities(cities);
        //setAvailableShippingProviders(providers);
      } else {
        toast.error(response.result?.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.order}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Order deleted successfully');
        fetchOrders();
      } else {
        toast.error(response.result?.message || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete order');
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleDateFilterChange = (dateRange) => {
    setDateRangeFilter(dateRange);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRangeFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setShippingStatus('');
    setShippingState('');
    setShippingCity('');
    setShippingProvider('');
    setHasDiscount(null);
    setCustomDateRange([null, null]);
    setSortBy('datecreated');
    setSortDirection('desc');
    setPage(1);
  };

  const handleExport = async (format = 'csv') => {
    setExportLoading(true);
    try {
      let exportUrl = `${endpointsPath.order}/export?`;
      
      const params = [];
      if (searchTerm) params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (dateRangeFilter !== 'all') params.push(`dateRange=${dateRangeFilter}`);
      if (couponCode) params.push(`couponCode=${couponCode}`);
      if (userId) params.push(`userId=${userId}`);
      if (minAmount) params.push(`minAmount=${minAmount}`);
      if (maxAmount) params.push(`maxAmount=${maxAmount}`);
      if (shippingStatus) params.push(`shippingStatus=${shippingStatus}`);
      if (shippingState) params.push(`shippingState=${encodeURIComponent(shippingState)}`);
      if (shippingCity) params.push(`shippingCity=${encodeURIComponent(shippingCity)}`);
      if (shippingProvider) params.push(`shippingProvider=${encodeURIComponent(shippingProvider)}`);
      if (hasDiscount !== null) params.push(`hasDiscount=${hasDiscount}`);
      if (startDate) params.push(`startDate=${startDate.toISOString()}`);
      if (endDate) params.push(`endDate=${endDate.toISOString()}`);
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
          link.download = `orders-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success(`Exported ${orders.length} orders`);
        } else if (format === 'json') {
          const dataStr = JSON.stringify(response.result, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = `orders-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export orders');
    } finally {
      setExportLoading(false);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (minAmount || maxAmount) count++;
    if (shippingStatus) count++;
    if (shippingState) count++;
    if (shippingCity) count++;
    if (shippingProvider) count++;
    if (hasDiscount !== null) count++;
    if (startDate || endDate) count++;
    if (couponCode) count++;
    if (userId) count++;
    return count;
  }, [searchTerm, statusFilter, dateRangeFilter, minAmount, maxAmount, shippingStatus, shippingState, shippingCity, shippingProvider, hasDiscount, startDate, endDate, couponCode, userId]);

  // Initialize
  useEffect(() => {
    fetchOrders();
  }, [searchTerm, page, statusFilter, dateRangeFilter, couponCode, userId, minAmount, maxAmount, shippingStatus, shippingState, shippingCity, shippingProvider, hasDiscount, startDate, endDate, sortBy, sortDirection]);

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <div className="p-4">
      {/* Header with coupon/user info */}
      {(couponCode || userId) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-800 text-sm">
            {couponCode && (
              <>
                Showing orders with coupon: <span className="font-bold">{couponCode}</span>
              </>
            )}
            {couponCode && userId && <span className="mx-1">•</span>}
            {userId && (
              <>
                For user ID: <span className="font-mono text-xs text-blue-700">{userId}</span>
              </>
            )}
          </h3>
        </div>
      )}

      {/* Summary Stats */} 
      {isSuperAdmin && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Total Orders</div>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-gray-500 text-sm">Total Sales</div>
          <div className="text-2xl font-bold text-green-600">
            ₦{totalSalesAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-gray-500 text-sm">Average Order Value</div>
          <div className="text-2xl font-bold">
            ₦{totalRecords > 0 ? Math.round(totalSalesAmount / totalRecords)?.toLocaleString() : 0}
          </div>
        </div>
      </div>)}

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by order #, customer, product..."
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
            className={`px-3 py-2 rounded flex items-center gap-2 ${
              showAdvancedFilters ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'
            }`}
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

          {/* <div className="relative">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Quick Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              >
                {dateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Custom Date Range</label>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setCustomDateRange(update);
                  setPage(1);
                }}
                isClearable={true}
                placeholderText="Select custom range"
                className="border px-3 py-2 rounded w-full"
                dateFormat="yyyy-MM-dd"
              />
            </div>

            {/* Amount Range */}
            {/* <div className="space-y-2">
              <label className="block text-sm font-medium">Amount Range (₦)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  className="border px-3 py-2 rounded w-1/2"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  className="border px-3 py-2 rounded w-1/2"
                  min="0"
                />
              </div>
            </div>*/}

            {/* Shipping Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Status</label>
              <select
                value={shippingStatus}
                onChange={(e) => {
                  setShippingStatus(e.target.value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                {shippingStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Shipping State */}
            <div>
              <label className="block text-sm font-medium mb-1">Shipping State</label>
              <select
                value={shippingState}
                onChange={(e) => {
                  setShippingState(e.target.value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All States</option>
                {availableStates.map((state, index) => (
                  <option key={index} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Shipping City */}
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Hub</label>
              <select
                value={shippingCity}
                onChange={(e) => {
                  setShippingCity(e.target.value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All Hubs</option>
                {availableCities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Shipping Provider */}
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Provider</label>
              <select
                value={shippingProvider}
                onChange={(e) => {
                  setShippingProvider(e.target.value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">All Providers</option>
                {availableShippingProviders.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount Filter */}
            {/*<div>
              <label className="block text-sm font-medium mb-1">Discount</label>
              <select
                value={hasDiscount === null ? '' : hasDiscount.toString()}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : e.target.value === 'true';
                  setHasDiscount(value);
                  setPage(1);
                }}
                className="border px-3 py-2 rounded w-full"
              >
                {discountOptions.map(option => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div> */}

            {/* Sorting Options */}
           {/* <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="border px-3 py-2 rounded w-full"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Direction</label>
                <select
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.target.value);
                    setPage(1);
                  }}
                  className="border px-3 py-2 rounded w-full"
                >
                  {sortDirectionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div> */}
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
                {dateRangeFilter !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Date: {dateOptions.find(o => o.value === dateRangeFilter)?.label}
                  </span>
                )}
                {(minAmount || maxAmount) && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Amount: ₦{minAmount || '0'} - ₦{maxAmount || '∞'}
                  </span>
                )}
                {shippingStatus && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Ship Status: {shippingStatusOptions.find(o => o.value === shippingStatus)?.label}
                  </span>
                )}
                {shippingState && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    State: {shippingState}
                  </span>
                )}
                {shippingCity && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    City: {shippingCity}
                  </span>
                )}
                {shippingProvider && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Provider: {shippingProvider}
                  </span>
                )}
                {hasDiscount !== null && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {hasDiscount ? 'With Discount' : 'Without Discount'}
                  </span>
                )}
                {startDate && endDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Custom: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                  </span>
                )}
                {couponCode && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Coupon: {couponCode}
                  </span>
                )}
                {userId && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    User: {userId}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Active Filters Display */}
      {!showAdvancedFilters && activeFiltersCount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-medium">Active Filters:</span>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => handleStatusFilterChange('all')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                Status: {statusOptions.find(o => o.value === statusFilter)?.label} ×
              </button>
            )}
            {shippingStatus && (
              <button 
                onClick={() => setShippingStatus('')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                Ship: {shippingStatus} ×
              </button>
            )}
            {shippingState && (
              <button 
                onClick={() => setShippingState('')}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <MapPin size={10} /> State: {shippingState} ×
              </button>
            )}
            {(minAmount || maxAmount) && (
              <button 
                onClick={() => { setMinAmount(''); setMaxAmount(''); }}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <DollarSign size={10} /> Amount: ₦{minAmount || '0'} - ₦{maxAmount || '∞'} ×
              </button>
            )}
            {hasDiscount !== null && (
              <button 
                onClick={() => setHasDiscount(null)}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
              >
                <Tag size={10} /> {hasDiscount ? 'With Discount' : 'Without Discount'} ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <OrderList
          loading={loading}
          orders={orders}
          fetchOrders={fetchOrders}
          onDelete={handleDelete}
          allowWaybillEdit={true}
        />
      </div>

      {/* Empty State */}
      {orders.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-lg mb-2">No orders found</p>
          {activeFiltersCount > 0 && (
            <button 
              onClick={clearFilters}
              className="text-blue-500 hover:underline"
            >
              Clear filters to see all orders
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default Orders;