import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import ClassStyle from '../../class-styles';
import { Link } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filter states
  const [isAvailable, setIsAvailable] = useState(null); // null = all, true = available, false = unavailable
  const [isApproved, setIsApproved] = useState(null); // null = all, true = approved, false = pending
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'last7days', 'last30days', 'thismonth', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateInputs, setShowDateInputs] = useState(false);

  // Calculate dates based on filter
  const getDateRange = () => {
    const now = new Date();
    let start = null;
    let end = null;

    switch (dateFilter) {
      case 'today':
        start = format(now, 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        break;
      case 'last7days':
        start = format(subDays(now, 6), 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        break;
      case 'last30days':
        start = format(subDays(now, 29), 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        break;
      case 'thismonth':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'custom':
        if (startDate && endDate) {
          start = startDate;
          end = endDate;
        }
        break;
      default:
        // 'all' - no date filter
        break;
    }

    return { start, end };
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.append('searchTerm', searchTerm);
    params.append('pageNumber', page);
    params.append('pageSize', pageSize);
    
    if (isAvailable !== null) params.append('isAvailable', isAvailable);
    if (isApproved !== null) params.append('isApproved', isApproved);
    
    const dateRange = getDateRange();
    if (dateRange.start) params.append('startDate', dateRange.start);
    if (dateRange.end) params.append('endDate', dateRange.end);
    
    return params.toString();
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryString = buildQueryString();
      const response = await requestHandler.get(
        `${endpointsPath.product}/admin?${queryString}`,
        true
      );
      
      if (response.statusCode === 200 && response.result?.data) {
        setProducts(response.result.data);
        setTotalPages(response.result.totalPages || 1);
        setTotalRecords(response.result.totalRecords || 0);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await requestHandler.deleteReq(`${endpointsPath.product}/${id}`, true);
      if (response.statusCode === 200) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(response.result?.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete product');
    }
  };

  const viewProductDetails = (product) => {
    window.location.href = `/products/${product.id}/details`;
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowDateInputs(value === 'custom');
    setPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSearchTerm('');
    setIsAvailable(null);
    setIsApproved(null);
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setShowDateInputs(false);
    setPage(1);
  };

  const handleApplyCustomDate = () => {
    if (dateFilter === 'custom' && startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        toast.error('Start date cannot be after end date');
        return;
      }
      fetchProducts();
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, page, pageSize, isAvailable, isApproved, dateFilter]);

  // Re-fetch when custom dates change
  useEffect(() => {
    if (dateFilter === 'custom' && startDate && endDate) {
      const timer = setTimeout(() => {
        handleApplyCustomDate();
      }, 500); // Debounce to prevent too many requests
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate]);

  // Calculate total stock quantity for each product
  const productsWithStock = useMemo(() => {
    return products.map(product => {
      const totalVariantStock = product.variantsDto?.reduce((sum, variant) => 
        sum + (variant.stockQuantity || 0), 0) || 0;
      
      const totalStock = totalVariantStock;
      
      const variantNames = product.variantsDto
        ?.map(variant => variant.name?.trim())
        .filter(name => name && name !== '')
        .join(', ') || 'No variants';

      return {
        ...product,
        totalStock,
        variantNames
      };
    });
  }, [products]);

  if (!searchTerm && loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Total: {totalRecords} products
          </div>
          <Link
            to={'/products/new'}
            className={ClassStyle.button}
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Name, description, brand..."
                className="border border-gray-300 px-3 py-2 rounded-lg w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              {loading && <Spinner className="ml-2" />}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              className="border border-gray-300 px-3 py-2 rounded-lg w-full"
              value={isAvailable === null ? 'all' : isAvailable.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIsAvailable(value === 'all' ? null : value === 'true');
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable Only</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approval Status
            </label>
            <select
              className="border border-gray-300 px-3 py-2 rounded-lg w-full"
              value={isApproved === null ? 'all' : isApproved.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIsApproved(value === 'all' ? null : value === 'true');
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="true">Approved Only</option>
              <option value="false">Pending Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              className="border border-gray-300 px-3 py-2 rounded-lg w-full"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {showDateInputs && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="border border-gray-300 px-3 py-2 rounded-lg w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="border border-gray-300 px-3 py-2 rounded-lg w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={handleApplyCustomDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!startDate || !endDate}
              >
                Apply Date Range
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      <div className="mb-4 flex flex-wrap gap-2">
        {isAvailable !== null && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            {isAvailable ? 'Available' : 'Unavailable'}
            <button
              onClick={() => setIsAvailable(null)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        {isApproved !== null && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            {isApproved ? 'Approved' : 'Pending'}
            <button
              onClick={() => setIsApproved(null)}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </span>
        )}
        {dateFilter !== 'all' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            {dateFilter === 'today' && 'Today'}
            {dateFilter === 'last7days' && 'Last 7 Days'}
            {dateFilter === 'last30days' && 'Last 30 Days'}
            {dateFilter === 'thismonth' && 'This Month'}
            {dateFilter === 'custom' && `Custom: ${startDate} to ${endDate}`}
            <button
              onClick={() => {
                setDateFilter('all');
                setStartDate('');
                setEndDate('');
                setShowDateInputs(false);
              }}
              className="ml-2 text-purple-600 hover:text-purple-800"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {productsWithStock.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No products found</div>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {productsWithStock.map((product) => (
                <div 
                  key={product.id} 
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewProductDetails(product)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold">{product.name}</h2>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.isAvailable 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{product.description?.substring(0, 100)}...</p>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Total Stock:</span>
                          <span className="ml-2 text-sm">
                            {product.totalStock.toLocaleString()} units
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Variants:</span>
                          <span className="ml-2 text-sm">
                            {product.variantsDto?.length || 0} variant(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {product.images?.length > 0 && (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.images[0].altText || product.name}
                        className="w-20 h-20 object-cover rounded ml-4"
                      />
                    )}
                  </div>

                  {/* Show individual variant details if needed */}
                  {product.variantsDto?.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <h4 className="font-medium text-sm mb-2">Variant Details:</h4>
                      <div className="space-y-2">
                        {product.variantsDto.map((variant, index) => (
                          <div key={variant.id || index} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>Variant {index + 1}:</span>
                              <span>{variant.stockQuantity} units</span>
                            </div>
                            {variant.name && variant.name != "null" && (
                              <div className="text-gray-600">Name: {variant.name}</div>
                            )}
                            {variant.color && variant.color != "null" && ( 
                              <div className="text-gray-600">Color: {variant.color}</div>
                            )}
                            {variant.size && variant.size != "null" && (
                              <div className="text-gray-600">Size: {variant.size}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Created: {new Date(product.dateCreated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default Products;