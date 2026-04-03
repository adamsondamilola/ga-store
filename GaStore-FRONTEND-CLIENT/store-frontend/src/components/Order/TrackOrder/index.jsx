"use client"
import React, { useState, useEffect } from 'react';
import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';
import formatNumberToCurrency from '@/utils/numberToMoney';
import toast from 'react-hot-toast';

const OrderTrackingView = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (orderId.trim().length < 6) {
      toast.error('Order ID must be at least 6 characters');
      return;
    }

    const trimmedOrderId = orderId.trim().substring(0, 8);
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Fetch order details
      const orderResponse = await requestHandler.get(
        `${endpointsPath.order}/${trimmedOrderId}`,
        true
      );

      if (orderResponse.statusCode == 200) {
        setOrder(orderResponse.result.data);
        
        // Fetch shipping details if order exists
        try {
          const shippingResponse = await requestHandler.get(
            `${endpointsPath.shipping}/${orderResponse.result.data.id}`,
            true
          );
          
          if (shippingResponse.statusCode == 200) {
            setShipping(shippingResponse.result.data);
          }
        } catch (shippingError) {
          console.warn('Shipping details not found:', shippingError);
          setShipping(null);
        }
      } else {
        setError('Order not found');
        setOrder(null);
        setShipping(null);
      }
    } catch (err) {
      setError('Failed to fetch order details');
      setOrder(null);
      setShipping(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Limit to 8 characters
    if (value.length <= 8) {
      setOrderId(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && orderId.trim().length >= 6) {
      handleSearch();
    }
  };

  // Format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format delivery date
  const formatDeliveryDate = (dateString) => {
    if (!dateString) return 'Calculating...';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate order totals
  const calculateTotals = () => {
    if (!order?.items) return { subtotal: 0, shipping: 0, total: 0, grandTotal: 0 };
    const grandTotal = order.amount;
    /*const subtotal = order.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );*/
    return {
      subtotal: order?.subTotal,
      shipping,
      total: order?.amount,
      grandTotal: grandTotal
    };
  };

  const totals = order ? calculateTotals() : null;

  return (
    <div className="container mx-auto md:px-4 px-4 py-8 max-w-4xl">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Track Your Order</h1>
        <p className="text-gray-600 mb-6">
          Enter your order ID to track your package and view order details
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={orderId}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              maxLength={8}
            />
            
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || orderId.trim().length < 6}
            className="px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
          
        </div>
        {orderId.length > 0 && orderId.length < 6 && (
              <p className="text-sm text-red-500 mt-2">
                Order ID must be at least 6 characters
              </p>
            )}
      </div>

      {/* Results Section */}
      {loading && (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && searched && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Order Not Found</div>
          <p className="text-red-500">{error}</p>
          <p className="text-gray-600 mt-2">
            Please check your order ID and try again. If you continue to have issues, 
            please contact our support team.
          </p>
        </div>
      )}

      {order && !loading && (
        <div className="space-y-8">
          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order #{order.id.substring(0, 8).toUpperCase()}</h2>
                <p className="text-gray-500 mt-1">
                  Placed on {formatDate(order.orderDate)}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.hasPaid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.hasPaid ? 'Paid' : 'Pending Payment'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
              {[
                { status: 'Order Placed', date: order.dateCreated, active: true },
                { status: 'Processing', date: order.dateCreated, active: order.hasPaid },
                { status: 'Shipped', date: shipping?.status === 'Delivered'? shipping?.dateUpdated : null, active: shipping?.status === 'Shipped' || shipping?.status === 'Delivered'? true : false },
                { status: 'Delivered', date: null, active: shipping?.status === 'Delivered' }
              ].map((step, index) => (
                <div key={index} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.active ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <h4 className={`text-sm font-medium ${
                    step.active ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.status}
                  </h4>
                  {step.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(step.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          {shipping && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Shipping Address</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>{shipping.fullName}</p>
                    <p>{shipping.addressLine1}</p>
                    {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                    <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
                    <p>{shipping.country}</p>
                    <p className="mt-2">Phone: {shipping.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Shipping Details</h4>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium">{shipping.shippingMethod || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium capitalize">{shipping?.status?.toLowerCase() || 'Processing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Delivery:</span>
                      <span className="font-medium">
                        {formatDeliveryDate(shipping.estimatedDeliveryDate)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span>Shipping Cost:</span>
                      <span className="font-medium">{formatNumberToCurrency(order?.deliveryFee.toFixed(2))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>

                {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
  <span>Order Summary</span>
  {order.couponCode && (
    <span className="text-sm text-blue-600 font-medium">
      Coupon: <span className="font-semibold">{order.couponCode}</span> ({order.discountPercentage || 0}% off)
    </span>
  )}
</h2>

      <div className="space-y-3">
  <div className="flex justify-between">
    <span className="text-gray-600">Subtotal</span>
    <span className="font-medium">{formatNumberToCurrency(order?.subTotal?.toFixed(2))}</span>
  </div>

  {order.discountPercentage > 0 && (
    <div className="flex justify-between text-red-600">
      <span>Discount ({order.discountPercentage}%)</span>
      <span>-{formatNumberToCurrency((order.subTotal - order.subTotalAfterDiscount).toFixed(2))}</span>
    </div>
  )} 

  <div className="flex justify-between">
    <span className="text-gray-600">Shipping</span>
    <span className="font-medium">{formatNumberToCurrency(order?.deliveryFee.toFixed(2) || 0)}</span>
  </div>

  {order.tax > 0 && (
    <div className="flex justify-between">
      <span className="text-gray-600">VAT</span>
      <span className="font-medium">{formatNumberToCurrency(order.tax.toFixed(2))}</span>
    </div>
  )}

  <div className="flex justify-between pt-3 border-t border-gray-200">
    <span className="text-gray-900 font-semibold">Total</span>
    <span className="text-gray-900 font-semibold"> 
      {formatNumberToCurrency(!order?.couponCode? order.amount?.toFixed(2) : order.amountAfterDiscount?.toFixed(2))}
    </span>
  </div>
</div>
</div>

        </div>
      )}

      {!loading && !order && searched && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-lg font-medium mb-2">Ready to Track</div>
          <p className="text-gray-600">
            Enter your order ID above to view your order details and tracking information.
          </p>
        </div>
      )}
    </div>
  );
};

// Order Item Component
const OrderItemCard = ({ item }) => {
  return (
    <div className='py-4 first:pt-0 last:pb-0'>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item?.product?.images?.[0]?.imageUrl ? (
            <img 
              src={item.variant?.images[0]?.imageUrl ?? item.product.images[0].imageUrl} 
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span>No Image</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div>
              <h4 className="text-base font-medium text-gray-900">
                {item.product?.name || 'Unknown Product'}
              </h4>
              {item.variant && (
                <p className="text-sm text-gray-500 mt-1">
                  Variant: {item.variant.name}
                </p>
              )}
            </div>
            <p className="text-base font-medium text-gray-900 mt-2 md:mt-0">
              {formatNumberToCurrency(item.price.toFixed(2))}
            </p>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Qty: {item.quantity}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatNumberToCurrency((item.price * item.quantity).toFixed(2))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingView;