import React, { useState } from 'react';
import { useEffect } from 'react';
import ClassStyle from '../../class-styles';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import formatNumberToCurrency from '../../utils/numberToMoney';
import { Link } from 'react-router-dom';

const OrderDetails = ({ order, shipping, loading, error }) => {
  const formatManualPaymentStatus = (status) => {
    if (status === 'AwaitingProof') return 'Awaiting Proof';
    return status || 'Awaiting Proof';
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

  const [shippingStatus, setShippingStatus] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(order.hasPaid || false);
  const [manualPayment, setManualPayment] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNote, setReviewNote] = useState('');
  const shippingStatusList = [
    "Pending", "Processing", "Cancelled", "In Transit", "Delivered"
  ]

  const fetchManualPayment = async () => {
    if (!order?.id || order?.paymentGateway !== 'Manual') return;

    setManualLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.manualPayment}/admin/order/${order.id}`,
        true
      );

      if (response.statusCode === 200 && response.result?.data) {
        setManualPayment(response.result.data);
        setReviewNote(response.result.data.reviewNote || '');
      }
    } catch (error) {
      console.error('manual payment fetch failed:', error);
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    fetchManualPayment();
  }, [order?.id, order?.paymentGateway]);

  const updatePaymentStatus = async () => {
    
    setUpdatingStatus(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.order}/${order.id}/paid`,
        true
      );
      
      if (response.statusCode === 200) {
        toast.success(response.result.message || 'Payment status updated successfully');
        window.location.href=`/orders/${order.id}`
        //await fetchShippingDetails();
      } else {
        throw new Error(response.result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const reviewManualPayment = async () => {
    setUpdatingStatus(true);
    try {
      const response = await requestHandler.post(
        `${endpointsPath.manualPayment}/admin/order/${order.id}/review`,
        {
          status: reviewStatus,
          reviewNote
        },
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.result?.message || 'Manual payment updated successfully');
        setManualPayment(response.result?.data || null);
        window.location.href=`/orders/${order.id}`;
      } else {
        throw new Error(response.result?.message || 'Failed to review manual payment');
      }
    } catch (error) {
      console.error('Review failed:', error);
      toast.error(error.message || 'Failed to review manual payment');
    } finally {
      setUpdatingStatus(false);
    }
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
    if (!order?.items) return { subtotal: 0, shipping: 0, total: 0, grandTotal: 0};
    const grandTotal = order.amount;
    const subtotal = order.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    const shippingCost = shipping?.shippingCost || 0;
    return {
      subtotal,
      shipping: shippingCost,
      total: subtotal + shippingCost,
      grandTotal: grandTotal
    };
  };

  const { subtotal, shipping: shippingCost, total, grandTotal} = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-center">
        <p>Error loading order details: {error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center text-gray-500">
        No order information available
      </div>
    );
  }

  return (
    <div className="container mx-auto md:px-4 px-4 py-8 max-w-6xl">
      {/* Order Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          {/*<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order #{order.id}</h1>*/}
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
          {order.paymentGateway !== 'Manual' && (
            <button
              className='btn button ml-2'
              onClick={updatePaymentStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : order.hasPaid? 'Marks as unpaid' : 'Mark as paid'}
            </button>
          )}
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
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
              <h3 className={`text-sm font-medium ${
                step.active ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.status}
              </h3>
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='text-start'>
              <h3 className="text-md font-medium text-gray-700 mb-2">Shipping Address</h3>
              <div className="space-y-1 text-gray-600">
                <p className="mt-2"><span className="font-medium">{shipping.shippingProvider} * {shipping.city}</span></p>
                <p>{shipping.fullName}</p>
                <p>{shipping.addressLine1}</p>
                {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
                <p>{shipping.country}</p>
                <p className="mt-2">{shipping.phoneNumber}</p>
                {/*<p>Email: {shipping.email}</p>*/}
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Shipping Details</h3>
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
                  <span className="font-medium">{formatNumberToCurrency(shippingCost.toFixed(2))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {order.paymentGateway === 'Manual' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Payment Review</h2>

          {manualLoading ? (
            <div className="text-sm text-gray-500">Loading manual payment...</div>
          ) : (
            <>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-base font-semibold text-gray-900">{formatManualPaymentStatus(manualPayment?.status)}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Amount Expected</div>
                  <div className="text-base font-semibold text-gray-900">{formatNumberToCurrency((manualPayment?.amountExpected || 0).toFixed(2))}</div>
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Bank Account</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {manualPayment?.bankAccount
                      ? `${manualPayment.bankAccount.bankName} - ${manualPayment.bankAccount.accountNumber}`
                      : 'Not selected'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">Transfer Reference</div>
                  <div className="text-sm font-semibold text-gray-900">{manualPayment?.paymentReference || 'N/A'}</div>
                </div>
              </div>

              <div className="mb-4 rounded-lg border p-4">
                <div className="text-sm text-gray-500">Customer Note</div>
                <div className="text-sm text-gray-900">{manualPayment?.customerNote || 'No note provided'}</div>
              </div>

              {manualPayment?.proofImageUrl ? (
                <div className="mb-4">
                  <div className="mb-2 text-sm font-medium text-gray-700">Proof of Payment</div>
                  <img
                    src={manualPayment.proofImageUrl}
                    alt="Proof of payment"
                    className="max-h-96 rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Proof of payment has not been uploaded yet.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Decision</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="Approved">Approve</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Admin Note</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    rows={3}
                    placeholder="Optional note for the customer"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={reviewManualPayment}
                  disabled={updatingStatus || !manualPayment?.proofImageUrl}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {updatingStatus ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
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
    <span className="font-medium">{formatNumberToCurrency(subtotal.toFixed(2))}</span>
  </div>

  {order.discountPercentage > 0 && (
    <div className="flex justify-between text-red-600">
      <span>Discount ({order.discountPercentage}%)</span>
      <span>-{formatNumberToCurrency((order.subTotal - order.subTotalAfterDiscount).toFixed(2))}</span>
    </div>
  )} 

  <div className="flex justify-between">
    <span className="text-gray-600">Shipping</span>
    <span className="font-medium">{formatNumberToCurrency(shippingCost.toFixed(2))}</span>
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
      {formatNumberToCurrency(!order.couponCode? order.amount?.toFixed(2) : order.amountAfterDiscount?.toFixed(2))}
    </span>
  </div>
</div>


      </div>
    </div>
  );
};

// Order Item Component
const OrderItemCard = ({ item }) => {
  return (
    <div className='py-2'>
    <Link to={`/products/${item?.productId}/details`} className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item?.product?.images[0]?.imageUrl ? ( 
            <img 
              src={item?.variant?.images[0]?.imageUrl ?? item?.product?.images[0]?.imageUrl} 
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
              <h3 className="text-base font-medium text-gray-900">
                {item.product.name}
              </h3>
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
    </Link>
    </div>
  );
};

export default OrderDetails;
