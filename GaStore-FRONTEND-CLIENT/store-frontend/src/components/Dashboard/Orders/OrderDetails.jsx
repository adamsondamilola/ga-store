"use client"
import React, { useEffect, useState } from 'react';
import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';
import formatNumberToCurrency from '@/utils/numberToMoney';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const shippingStatusList = [
    "Pending", "Processing", "Cancelled", "In Transit", "Delivered"
  ]

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
    if (!order?.items) return { subtotal: 0, vat: 0, shipping: 0, total: 0, grandTotal: 0};
    
    const total = order.amount;
    const subtotal = order.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const shippingCost = shipping?.shippingCost || 0;
    const grandTotal = shippingCost + subtotal;
    let vat = 0;
    const diff =  total - grandTotal;
    if(diff > 0){
      vat = diff;
    }
    return {
      subtotal,
      vat,
      shipping: shippingCost,
      total: subtotal + shippingCost,
      grandTotal: total
    };
  };

  const { subtotal, vat, shipping: shippingCost, total, grandTotal} = calculateTotals();

  const fetchManualPayment = async () => {
    if (!order?.id || order?.paymentGateway !== 'Manual') return;

    setManualPaymentLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.manualPayment}/order/${order.id}`,
        true
      );

      if (response.statusCode === 200 && response.result?.data) {
        setManualPayment(response.result.data);
        setSelectedBankAccountId(response.result.data.bankAccountId || '');
        setPaymentReference(response.result.data.paymentReference || '');
        setCustomerNote(response.result.data.customerNote || '');
      }
    } catch (error) {
      console.error('manual payment fetch failed:', error);
    } finally {
      setManualPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchManualPayment();
  }, [order?.id, order?.paymentGateway]);

  const submitProof = async () => {
    if (!proofFile) {
      toast.error('Please select proof of payment.');
      return;
    }

    const form = new FormData();
    form.append('orderId', order.id);
    if (selectedBankAccountId) form.append('bankAccountId', selectedBankAccountId);
    if (paymentReference) form.append('paymentReference', paymentReference);
    if (customerNote) form.append('customerNote', customerNote);
    form.append('proofFile', proofFile);

    setUploadingProof(true);
    try {
      const response = await requestHandler.postForm(
        `${endpointsPath.manualPayment}/proof`,
        form,
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.result?.message || 'Proof uploaded successfully');
        setProofFile(null);
        await fetchManualPayment();
      } else {
        toast.error(response.result?.message || 'Unable to upload proof');
      }
    } catch (error) {
      console.error('proof upload failed:', error);
      toast.error('Unable to upload proof');
    } finally {
      setUploadingProof(false);
    }
  };

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
    <div className="max-w-6xl">
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
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Shipping Address</h3>
              <div className="space-y-1 text-gray-600">
                <p>{shipping.fullName}</p>
                <p>{shipping.addressLine1}</p>
                {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
                <p>{shipping.country}</p>
                <p className="mt-2">Phone: {shipping.phoneNumber}</p>
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
               {/* <div className="flex justify-between pt-2 border-t border-gray-200">
                <select
            value={shippingStatus}
            onChange={(x) => setShippingStatus(x.target.value)}
            className={ClassStyle.input2}
          >
            <option value="">Select Status</option>
            {shippingStatusList.map(sh => (
              <option key={sh} value={sh}
              >{sh}</option>
            ))}
          </select>
          <button
          onClick={updateShippingStatus}
          className={ClassStyle.button}
          disabled={updatingStatus || newStatus === shipping.status}
        >
          {updatingStatus ? 'Updating...' : 'Update Status'}
        </button>
                  </div>*/}
              </div>
            </div>
          </div>
        </div>
      )}

      {order.paymentGateway === 'Manual' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Payment</h2>

          {manualPaymentLoading ? (
            <div className="text-sm text-gray-500">Loading payment instructions...</div>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Send your payment to any of the accounts below. Your order stays pending until proof is uploaded and reviewed by an admin.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(manualPayment?.availableAccounts || []).map((account) => (
                  <div key={account.id || `${account.bankName}-${account.accountNumber}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900">{account.bankName}</div>
                    <div className="text-sm text-gray-700">{account.accountName}</div>
                    <div className="text-lg font-bold text-gray-900">{account.accountNumber}</div>
                    <div className="text-xs text-gray-500">{account.currency || 'NGN'}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Transferred To</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select account</option>
                    {(manualPayment?.availableAccounts || []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Transfer Reference</label>
                  <input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter transfer reference"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Optional payment note"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Proof of Payment</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              {manualPayment?.proofImageUrl && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium text-gray-700">Uploaded Proof</div>
                  <img
                    src={manualPayment.proofImageUrl}
                    alt="Proof of payment"
                    className="max-h-72 rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-600">
                  Status: <span className="font-semibold text-gray-900">{formatManualPaymentStatus(manualPayment?.status)}</span>
                  {manualPayment?.reviewNote ? ` - ${manualPayment.reviewNote}` : ''}
                </div>
                <button
                  type="button"
                  onClick={submitProof}
                  disabled={uploadingProof || order.hasPaid}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {uploadingProof ? 'Uploading...' : 'Upload Proof'}
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
      {formatNumberToCurrency(!order?.couponCode? order.amount?.toFixed(2) : order.amountAfterDiscount?.toFixed(2))}
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
    <Link href={`#`} className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item?.product?.images[0]?.imageUrl ? (
            <img 
              src={item?.variant?.images[0]?.imageUrl ?? item.product.images[0].imageUrl}
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
