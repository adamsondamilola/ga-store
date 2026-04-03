"use client"
import React, { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import OrderList from './OrderList';
import PaginationAlt from '@/components/PaginationAlt';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const limit = 10;

  // Define available filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    //{ value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    //{ value: 'cancelled', label: 'Cancelled' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.order}/by-user?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${limit}&status=Completed`;
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      // Add date filter if not 'all'
      if (dateFilter !== 'all') {
        url += `&dateRange=${dateFilter}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setOrders(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setFormData(order);
    setFormModalOpen(true);
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
    setPage(1); // Reset to first page when changing filters
  };

  const handleDateFilterChange = (dateRange) => {
    setDateFilter(dateRange);
    setPage(1); // Reset to first page when changing filters
  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, page, statusFilter, dateFilter]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            className="border px-3 py-2 rounded w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="border px-3 py-2 rounded text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="border px-3 py-2 rounded text-sm"
          >
            {dateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/*<Link
            to={'/orders/new'}
            className={`${ClassStyle.button} whitespace-nowrap`}
          >
            + New Order
          </Link>*/}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <OrderList
          loading={loading}
          orders={orders}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="mt-4">
        <PaginationAlt
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default Orders;