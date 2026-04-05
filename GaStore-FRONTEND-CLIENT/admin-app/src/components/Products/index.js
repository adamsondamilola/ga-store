import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  Clock3,
  Filter,
  PackagePlus,
  Percent,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import ProductWorkspaceShell, { ProductSurface } from './ProductWorkspaceShell';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isApproved, setIsApproved] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateInputs, setShowDateInputs] = useState(false);

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
      const response = await requestHandler.get(
        `${endpointsPath.product}/admin?${buildQueryString()}`,
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

  const viewProductDetails = (product) => {
    window.location.href = `/products/${product.id}/details`;
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowDateInputs(value === 'custom');
    setPage(1);
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

  useEffect(() => {
    if (dateFilter === 'custom' && startDate && endDate) {
      const timer = setTimeout(() => {
        handleApplyCustomDate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate]);

  const productsWithStock = useMemo(
    () =>
      products.map((product) => {
        const totalStock =
          product.variantsDto?.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0) || 0;

        return {
          ...product,
          totalStock,
        };
      }),
    [products]
  );

  const summaryStats = useMemo(() => {
    const approvedCount = productsWithStock.filter((item) => item.isApproved).length;
    const availableCount = productsWithStock.filter((item) => item.isAvailable).length;
    const lowStockCount = productsWithStock.filter(
      (item) => item.totalStock > 0 && item.totalStock <= 10
    ).length;

    return [
      { label: 'Records', value: totalRecords || 0, helper: `${totalPages} pages` },
      { label: 'Approved', value: approvedCount, helper: 'Live ready' },
      { label: 'Available', value: availableCount, helper: 'Shop visible' },
      { label: 'Low stock', value: lowStockCount, helper: 'Needs attention' },
    ];
  }, [productsWithStock, totalPages, totalRecords]);

  const activeFilterCount = [isAvailable, isApproved, dateFilter !== 'all' ? dateFilter : null].filter(Boolean)
    .length;

  if (!searchTerm && loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          <span className="text-sm font-medium text-slate-600">Loading product workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <ProductWorkspaceShell
      eyebrow="Products"
      title="Catalog command center"
      description="Manage the full product catalog from one place, including stock visibility, approval status, featured placement, limited offers, and VAT settings."
      stats={summaryStats}
      actions={
        <>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-[#ea580c]"
          >
            <PackagePlus className="h-4 w-4" />
            New product
          </Link>
          <Link
            to="/products/featured"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            <Star className="h-4 w-4" />
            Featured
          </Link>
          <Link
            to="/products/limited-offers"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            <Sparkles className="h-4 w-4" />
            Limited offers
          </Link>
          <Link
            to="/products/vat"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            <Percent className="h-4 w-4" />
            VAT
          </Link>
        </>
      }
    >
      <ProductSurface>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              <Filter className="h-3.5 w-3.5" />
              Filter stack
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
              Narrow the catalog
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Search by keyword and combine availability, approval, and date windows to surface the exact products you want to review.
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search products</label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name, description, brand..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              {loading ? <Spinner size="sm" /> : null}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Availability</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300"
              value={isAvailable === null ? 'all' : isAvailable.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIsAvailable(value === 'all' ? null : value === 'true');
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="true">Available only</option>
              <option value="false">Unavailable only</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Approval</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300"
              value={isApproved === null ? 'all' : isApproved.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIsApproved(value === 'all' ? null : value === 'true');
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="true">Approved only</option>
              <option value="false">Pending only</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Date range</label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thismonth">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>

        {showDateInputs ? (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-[22px] border border-orange-100 bg-orange-50/60 p-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyCustomDate}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!startDate || !endDate}
              >
                Apply range
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
          </span>
          {isAvailable !== null ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          ) : null}
          {isApproved !== null ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {isApproved ? 'Approved' : 'Pending'}
            </span>
          ) : null}
          {dateFilter !== 'all' ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              {dateFilter === 'custom' ? `${startDate} to ${endDate}` : dateFilter}
            </span>
          ) : null}
        </div>
      </ProductSurface>

      <ProductSurface>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Product records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Click any card to inspect details, variants, pricing, and approval history.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            <Boxes className="h-3.5 w-3.5" />
            {productsWithStock.length} item{productsWithStock.length === 1 ? '' : 's'} on this page
          </div>
        </div>

        {productsWithStock.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-700">No products found</p>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting the current filters or create a new product.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={fetchProducts}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
              >
                Refresh
              </button>
              <Link
                to="/products/new"
                className="rounded-2xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
              >
                Create product
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {productsWithStock.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => viewProductDetails(product)}
                className="group rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                        {product.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.isApproved
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {product.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.isAvailable
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {product.description || 'No description provided for this product yet.'}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {product.totalStock.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Variants</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {product.variantsDto?.length || 0}
                        </p>
                      </div>
                    </div>

                    {product.variantsDto?.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {product.variantsDto.slice(0, 3).map((variant, index) => (
                          <span
                            key={variant.id || index}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {[variant.name, variant.color, variant.size]
                              .filter((value) => value && value !== 'null')
                              .join(' / ') || `Variant ${index + 1}`}
                          </span>
                        ))}
                        {product.variantsDto.length > 3 ? (
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                            +{product.variantsDto.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.images[0].altText || product.name}
                      className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Boxes className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(product.dateCreated).toLocaleDateString()}
                    </span>
                    {product.isApproved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Ready
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                    Open details
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            ))}
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
    </ProductWorkspaceShell>
  );
};

export default Products;
