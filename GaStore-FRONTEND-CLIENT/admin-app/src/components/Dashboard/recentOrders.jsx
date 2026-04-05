'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowRight, ClipboardList } from 'lucide-react';
import OrderList from '../Orders/OrderList';
import endpointsPath from '../../constants/EndpointsPath';
import requestHandler from '../../utils/requestHandler';

export default function RecentOrdersComponent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = 10;

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
    <section className="rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            Recent Activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">Latest orders</h2>
          <p className="mt-2 text-sm text-gray-600">
            Monitor the newest transactions and jump into fulfillment when needed.
          </p>
        </div>

        <Link
          to="/orders"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View all orders
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-6 rounded-[26px] border border-[#ece4db] bg-white p-4 shadow-sm">
        <OrderList loading={loading} orders={orders} fetchOrders={fetchOrders} />
      </div>

      {!loading && orders.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#e6d8cb] bg-[#fcfaf8] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ec] text-[#ea580c]">
            <ClipboardList size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No recent orders yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            New customer orders will show up here as activity starts coming in.
          </p>
        </div>
      ) : null}
    </section>
  );
}
