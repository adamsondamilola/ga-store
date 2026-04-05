import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Calendar,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Tag,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Pagination from '../Pagination';
import OrderList from './OrderList';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const panelClassName =
  'rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6';
const inputClassName =
  'w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableShippingProviders, setAvailableShippingProviders] = useState([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const couponCode = queryParams.get('couponCode');
  const userId = queryParams.get('userId');

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  const shippingStatusOptions = [
    { value: '', label: 'All Shipping Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'in transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    const loggedInUser = async () => {
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if (resp.statusCode === 200) {
        const roles = resp.result.data;
        setIsSuperAdmin(roles.some((role) => role.name === 'Super Admin'));
      }
    };

    loggedInUser();
  }, []);

  const extractFilterData = (items) => {
    const states = [
      ...new Set(
        items
          .filter((order) => order.shipping?.state)
          .map((order) => order.shipping.state)
          .sort()
      ),
    ];

    const cities = [
      ...new Set(
        items
          .filter((order) => order.shipping?.city)
          .map((order) => order.shipping.city)
          .sort()
      ),
    ];

    return { states, cities };
  };

  const fetchProviders = async () => {
    try {
      const url = `${endpointsPath.shipping}/providers?pageNumber=1&pageSize=200`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setAvailableShippingProviders(response.result.data);
      }
    } catch (error) {
      console.error('Failed to load shipping providers', error);
      toast.error('Failed to load shipping providers');
    }
  };

  const fetchOrders = async (showToast = false) => {
    setLoading(true);
    setRefreshing(true);
    try {
      let url = `${endpointsPath.order}?pageNumber=${page}&pageSize=${pageSize}`;
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
        setTotalRecords(response.result.totalRecords || 0);
        setTotalSalesAmount(response.result.totalSalesAmount || 0);

        const { states, cities } = extractFilterData(response.result.data);
        setAvailableStates(states);
        setAvailableCities(cities);

        if (showToast) {
          toast.success('Orders refreshed');
        }
      } else {
        toast.error(response.result?.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  }, [
    searchTerm,
    statusFilter,
    dateRangeFilter,
    minAmount,
    maxAmount,
    shippingStatus,
    shippingState,
    shippingCity,
    shippingProvider,
    hasDiscount,
    startDate,
    endDate,
    couponCode,
    userId,
  ]);

  const averageOrderValue =
    totalRecords > 0 ? Math.round(totalSalesAmount / totalRecords).toLocaleString() : '0';

  const quickStats = [
    {
      label: 'Total Orders',
      value: totalRecords,
      note: 'Matching this current view',
      tone: 'bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950',
    },
    {
      label: 'Total Sales',
      value: `N${totalSalesAmount?.toLocaleString() || 0}`,
      note: 'Gross sales in filtered results',
      tone: 'bg-white text-gray-950',
    },
    {
      label: 'Average Order Value',
      value: `N${averageOrderValue}`,
      note: 'Mean revenue per order',
      tone: 'bg-[#1f2937] text-white',
    },
  ];

  const activeFilterChips = [
    searchTerm ? `Search: ${searchTerm}` : null,
    statusFilter !== 'all' ? `Status: ${statusOptions.find((o) => o.value === statusFilter)?.label}` : null,
    dateRangeFilter !== 'all' ? `Date: ${dateOptions.find((o) => o.value === dateRangeFilter)?.label}` : null,
    shippingStatus
      ? `Shipping: ${shippingStatusOptions.find((o) => o.value === shippingStatus)?.label}`
      : null,
    shippingState ? `State: ${shippingState}` : null,
    shippingCity ? `Hub: ${shippingCity}` : null,
    shippingProvider ? `Provider: ${shippingProvider}` : null,
    startDate && endDate
      ? `Custom: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      : null,
    couponCode ? `Coupon: ${couponCode}` : null,
    userId ? `User: ${userId}` : null,
  ].filter(Boolean);

  useEffect(() => {
    fetchOrders();
  }, [
    searchTerm,
    page,
    pageSize,
    statusFilter,
    dateRangeFilter,
    couponCode,
    userId,
    minAmount,
    maxAmount,
    shippingStatus,
    shippingState,
    shippingCity,
    shippingProvider,
    hasDiscount,
    startDate,
    endDate,
    sortBy,
    sortDirection,
  ]);

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#f0dacc] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,236,0.95)_42%,_rgba(255,232,214,0.92)_100%)] p-6 shadow-[0_20px_70px_rgba(240,108,35,0.10)] md:p-7">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#fb923c]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#fdba74]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c2410c]">
              Order Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-[2.4rem]">
              Monitor and fulfill customer orders
            </h1>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Search orders, narrow fulfillment queues, and manage shipping status from one clean
              workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        {(couponCode || userId) && (
          <div className="relative z-10 mt-5 inline-flex flex-wrap items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-[#9a4f19]">
            {couponCode ? <span>Coupon: {couponCode}</span> : null}
            {couponCode && userId ? <span className="text-[#d6aa86]">•</span> : null}
            {userId ? <span>User ID: {userId}</span> : null}
          </div>
        )}

        {isSuperAdmin ? (
          <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className={`rounded-[26px] border border-white/60 p-5 shadow-sm ${item.tone}`}
              >
                <div className="text-sm font-medium opacity-80">{item.label}</div>
                <div className="mt-4 text-[1.9rem] font-semibold tracking-tight">{item.value}</div>
                <div className="mt-1 text-sm opacity-75">{item.note}</div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className={panelClassName}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Filters
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Find the right order fast</h2>
            <p className="mt-2 text-sm text-gray-600">
              Filter by customer, date, shipping route, or fulfillment stage to focus on the work
              in front of you.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                showAdvancedFilters
                  ? 'bg-[#1f2937] text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </button>

            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[#e8ded6] bg-[#fcfaf8] px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by order #, customer, product..."
              className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={inputClassName}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setPage(1);
            }}
            className={inputClassName}
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatusFilter(option.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === option.value
                  ? 'bg-[#f97316] text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)]'
                  : 'bg-[#f4efe9] text-[#6b6b6b] hover:bg-[#fff3e8] hover:text-[#272727]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {showAdvancedFilters ? (
          <div className="mt-6 rounded-[24px] border border-[#ece4db] bg-[#fcfaf8] p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Custom Date Range</label>
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
                  className={inputClassName}
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Shipping Status</label>
                <select
                  value={shippingStatus}
                  onChange={(e) => {
                    setShippingStatus(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {shippingStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Shipping State</label>
                <select
                  value={shippingState}
                  onChange={(e) => {
                    setShippingState(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">All States</option>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Shipping Hub</label>
                <select
                  value={shippingCity}
                  onChange={(e) => {
                    setShippingCity(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">All Hubs</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Shipping Provider</label>
                <select
                  value={shippingProvider}
                  onChange={(e) => {
                    setShippingProvider(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">All Providers</option>
                  {availableShippingProviders.map((provider) => (
                    <option key={provider.id} value={provider.name}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  min="0"
                  placeholder="100000"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Discount</label>
                <select
                  value={hasDiscount === null ? '' : hasDiscount ? 'true' : 'false'}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : e.target.value === 'true';
                    setHasDiscount(value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">All Orders</option>
                  <option value="true">With Discount</option>
                  <option value="false">Without Discount</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {activeFilterChips.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-3 py-1.5 text-xs font-medium text-[#c2410c]"
              >
                {chip.includes('State') ? <MapPin size={12} /> : null}
                {chip.includes('Shipping') ? <Truck size={12} /> : null}
                {chip.includes('Date') || chip.includes('Custom') ? <Calendar size={12} /> : null}
                {chip.includes('Coupon') ? <Tag size={12} /> : null}
                {chip.includes('Search') ? <Search size={12} /> : null}
                {chip.includes('Amount') ? <Wallet size={12} /> : null}
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className={panelClassName}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Orders Table
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Recent and filtered orders</h2>
            <p className="mt-2 text-sm text-gray-600">
              Open order details, bulk-update fulfillment status, and print receipts from here.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-4 py-2 text-sm font-medium text-[#c2410c]">
            {totalRecords} record{totalRecords === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-[#ece4db] bg-white p-4 shadow-sm">
          <OrderList
            loading={loading}
            orders={orders}
            fetchOrders={fetchOrders}
            onDelete={handleDelete}
            allowWaybillEdit={true}
          />
        </div>

        {orders.length === 0 && !loading ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-[#e6d8cb] bg-[#fcfaf8] p-8 text-center text-gray-500">
            <div className="text-4xl">No orders found</div>
            {activeFiltersCount > 0 ? (
              <button onClick={clearFilters} className="mt-3 text-sm font-medium text-[#c2410c] hover:underline">
                Clear filters to see all orders
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={panelClassName}>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </section>
    </div>
  );
};

export default Orders;
