'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import OrderList from '../Orders/OrderList';
import endpointsPath from '../../constants/EndpointsPath';
import requestHandler from '../../utils/requestHandler';

export default function RecentOrdersComponent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = 10; // Only show top 5 recent orders

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `${endpointsPath.order}?pageNumber=1&pageSize=${limit}`;
      const response = await requestHandler.get(url, true);

      if (response.statusCode === 200 && response.result?.data) {
        setOrders(response.result.data);
      } else {
        toast.error(response.result?.message || 'Failed to fetch recent orders');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Error fetching recent orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="bg-white text-black p-6 rounded-2xl flex-1 mt-5">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Link to="/orders" className="text-sm text-blue-600 hover:underline">
          See More
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <OrderList loading={loading} orders={orders} />
      </div>

      {!loading && orders.length === 0 && (
        <div className="py-8 text-center text-gray-500">No recent orders found</div>
      )}
    </div>
  );
}
