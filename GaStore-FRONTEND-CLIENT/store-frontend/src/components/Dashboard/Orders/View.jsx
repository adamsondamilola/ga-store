"use client"
import React, { useState, useEffect } from 'react';
//import { Link, useParams } from 'react-router-dom';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import OrderDetails from './OrderDetails';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DashboardPageShell } from '../PageShell';

const ViewOrder = () => {
  const { id } = useParams();
  const [details, setDetails] = useState({});
  const [shipping, setShipping] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.order}/${id}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setDetails(response.result.data);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingDetails = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.shipping}/${id}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setShipping(response.result.data);
        setNewStatus(response.result.data.status || '');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load shipping details');
    }
  };

  const updateShippingStatus = async () => {
    if (!newStatus || newStatus === shipping.status) return;
    
    setUpdatingStatus(true);
    try {
      const response = await requestHandler.put(
        `${endpointsPath.shipping}/${shipping.id}`,
        { 
          status: newStatus,
          orderId: details.id,
          city: shipping.city,
          state: shipping.state,
          country: shipping.country,
          fullName: shipping.fullName,
          phoneNumber: shipping.phoneNumber,
          email: shipping.email,
          shippingMethod: shipping.shippingMethod,
          addressLine1: shipping.addressLine1,
          dateUpdated: new Date(),
          shippingCost: shipping.shippingCost
         },
        true
      );
      
      if (response.statusCode === 200) {
        toast.success(response.result.message || 'Shipping status updated successfully');
        await fetchShippingDetails();
      } else {
        throw new Error(response.result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      //toast.error(error.message || 'Failed to update shipping status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchShippingDetails();
  }, [id]);

  return (
    <DashboardPageShell
      eyebrow="Orders"
      title="Order Details"
      description="Full payment, shipping, and item information for this order."
      actions={
        <Link 
          href="/customer/orders" 
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>
      }
    >

      <OrderDetails 
        order={details} 
        shipping={shipping}
        loading={loading} 
      />
    </DashboardPageShell>
  );
};

export default ViewOrder;
