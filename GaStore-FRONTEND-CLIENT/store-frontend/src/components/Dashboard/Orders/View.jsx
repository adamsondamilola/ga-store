"use client"
import React, { useState, useEffect } from 'react';
//import { Link, useParams } from 'react-router-dom';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import OrderDetails from './OrderDetails';
import ClassStyle from '@/class-styles';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

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
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="flex justify-between items-center mb-6 text-gray-600">
        <Link 
          href="/customer/orders" 
          className="text-primary hover:text-primary-dark flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>
        
      </div>

      <OrderDetails 
        order={details} 
        shipping={shipping}
        loading={loading} 
      />
    </div>
  );
};

export default ViewOrder;