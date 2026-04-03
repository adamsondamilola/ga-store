import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import StatusComponent from '../Status';
import { Eye, Printer } from 'lucide-react';
import dateTimeToWord from '../../utils/dateTimeToWord';
import formatNumberToCurrency from '../../utils/numberToMoney';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const OrderList = ({ loading, orders, onEdit, onDelete, fetchOrders, allowWaybillEdit = false }) => {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingIdMap, setTrackingIdMap] = useState({}); // Store tracking IDs per order
  const [updatingTrackingId, setUpdatingTrackingId] = useState(null); // Track which order is being updated
  const printRef = useRef();

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  // Fix: Handle shipping tracking ID update for specific order
  const handleShippingTrackingIdUpdate = async (shippingId, orderId) => {
    const trackingId = trackingIdMap[orderId]?.trim();
    
    if (!trackingId) {
      toast.error('Please enter a waybill ID');
      return;
    }

    setUpdatingTrackingId(orderId);
    
    try {
      const response = await requestHandler.patch(
        `${endpointsPath.shipping}/update-waybill-id`,
        { 
          shippingId, 
          ShippingProviderTrackingId: trackingId 
        }, 
        true
      );
      
      if (response.statusCode === 200) {
        toast.success('Waybill ID updated successfully');
        // Clear the input for this order
        setTrackingIdMap(prev => ({ ...prev, [orderId]: '' }));
        fetchOrders();
      } else {
        toast.error(response.result?.message || 'Failed to update Waybill ID');
      }
    } catch (error) {
      console.error('Update failed:', error);
      //toast.error('Failed to update Waybill ID');
    } finally {
      setUpdatingTrackingId(null);
    }
  };

  // Handle tracking ID input change
  const handleTrackingIdChange = (orderId, value) => {
    setTrackingIdMap(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(or => or?.shipping?.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (e, id) => {
    e.stopPropagation(); // Prevent event bubbling
    
    setSelectedOrders(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(orderId => orderId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  // Fix: Handle row click properly
  const handleRowClick = (id) => {
    setSelectedOrders(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(orderId => orderId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const updateOrderStatus = async () => {
    if (!newStatus || selectedOrders.length === 0) return;
    
    setIsUpdating(true);
    try {
      const payload = selectedOrders.map(id => ({
        status: newStatus,
        id: id
      }));

      const response = await requestHandler.put(
        `${endpointsPath.shipping}/update-bulk-status`,
        payload,
        true
      );
      
      if (response.statusCode === 200) {
        toast.success(response.result.message || 'Order status updated successfully');
        setSelectedOrders([]);
        setNewStatus('');
        fetchOrders();
      } else {
        throw new Error(response.result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to generate barcode using lines (fallback)
  const generateLineBarcode = (orderId) => {
    const shortId = orderId?.substring(0, 8) || '00000000';
    let barcodeHTML = '<div style="text-align: center; margin: 15px 0;">';
    barcodeHTML += '<div style="display: flex; justify-content: center; align-items: center; height: 40px; margin-bottom: 5px;">';
    
    // Generate lines based on order ID characters
    for (let i = 0; i < shortId.length; i++) {
      const charCode = shortId.charCodeAt(i);
      const height = 10 + (charCode % 30); // Vary line height
      const width = 2 + (charCode % 3); // Vary line width
      barcodeHTML += `<div style="height: ${height}px; width: ${width}px; background-color: black; margin: 0 1px;"></div>`;
    }
    
    barcodeHTML += '</div>';
    barcodeHTML += `<div style="font-family: monospace; font-size: 10px;">ORDER #${shortId}</div>`;
    barcodeHTML += '</div>';
    
    return barcodeHTML;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent || selectedOrders.length === 0) {
      toast.error('No orders selected for printing');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            @media print {
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px; 
                width: 80mm; 
              }
              * { 
                box-sizing: border-box; 
                -webkit-print-color-adjust: exact; 
                color-adjust: exact;
              }
              .receipt { 
                width: 100%; 
                max-width: 80mm; 
                margin: 0 auto; 
                padding: 10px; 
                border: 1px dashed #ccc; 
                page-break-after: always;
              }
              .receipt:last-child {
                page-break-after: auto;
              }
              .header, .footer { 
                text-align: center; 
                margin-bottom: 10px; 
              }
              .company-name { 
                font-weight: bold; 
                font-size: 14px; 
                margin-bottom: 5px; 
              }
              .barcode { 
                margin: 10px 0; 
                text-align: center; 
              }
              .line-items { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 10px 0; 
              }
              .line-items th, 
              .line-items td { 
                padding: 4px 2px; 
                border-bottom: 1px dashed #ddd; 
              }
              .line-items th { 
                text-align: left; 
                border-bottom: 1px solid #000; 
              }
              .line-items .item-name { 
                width: 60%; 
              }
              .line-items .item-qty { 
                width: 15%; 
                text-align: center; 
              }
              .line-items .item-price { 
                width: 25%; 
                text-align: right; 
              }
              .totals { 
                width: 100%; 
                margin: 10px 0; 
              }
              .totals tr td { 
                padding: 3px 2px; 
              }
              .totals .label { 
                text-align: left; 
              }
              .totals .value { 
                text-align: right; 
                font-weight: bold; 
              }
              .divider { 
                border-top: 1px solid #000; 
                margin: 10px 0; 
              }
              .thank-you { 
                text-align: center; 
                margin-top: 15px; 
                font-style: italic; 
              }
              .order-info { 
                margin: 8px 0; 
              }
              .order-info div { 
                margin: 3px 0; 
              }
              .status-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
              }
              .text-red-600 {
                color: #dc2626;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Get selected order details by shipping ID
  const getSelectedOrdersDetails = () => {
    return orders.filter(order => selectedOrders.includes(order?.shipping?.id));
  };

  if (loading) return <p>Loading...</p>;

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  return (
    <div className="relative overflow-x-auto w-full max-w-full">
      {selectedOrders.length > 0 && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg flex flex-wrap items-center gap-4">
          <div>
            <span className="font-medium">{selectedOrders.length} order(s) selected</span>
          </div>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="border px-3 py-2 rounded"
            disabled={isUpdating}
          >
            <option value="">Select status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            onClick={updateOrderStatus}
            disabled={!newStatus || isUpdating}
            className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark disabled:bg-gray-300"
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </button>
          <button 
            onClick={handlePrint}
            disabled={selectedOrders.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 disabled:bg-gray-300"
          >
            <Printer size={16} />
            Print Selected ({selectedOrders.length})
          </button>
          <button
            onClick={() => setSelectedOrders([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Printable content - Hidden but accessible */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef} className="p-6">
          {getSelectedOrdersDetails().length > 0 ? (
            getSelectedOrdersDetails().map((order) => (
              <div key={order.id} className="receipt">
                <div className="header">
                  {/* Add your company header here if needed */}
                </div>
                
                <div className="divider"></div>
                
                <div className="order-info">
                  <div><strong>LOGISTICS:</strong> {order.shipping?.shippingProvider}</div>
                  <div><strong>ORDER #:</strong> {order.id?.substring(0, 8) || 'N/A'}</div>
                  <div><strong>DATE:</strong> {dateTimeToWord(order.dateCreated)}</div>
                  <div><strong>CUSTOMER:</strong> {order.shipping?.fullName || 'N/A'}</div>
                  <div><strong>PHONE:</strong> {order.shipping?.phoneNumber || 'N/A'}</div>
                  {order.couponCode && (
                    <div><strong>COUPON:</strong> {order.couponCode} ({order.discountPercentage || 0}% off)</div>
                  )}
                </div>
                
                <div className="divider"></div>
                
                {/* Barcode */}
                <div 
                  className="barcode" 
                  dangerouslySetInnerHTML={{ __html: generateLineBarcode(order.id) }} 
                />
                
                <table className="line-items">
                  <thead>
                    <tr>
                      <th className="item-name">ITEM</th>
                      <th className="item-qty">QTY</th>
                      <th className="item-price">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="item-name">
                            {item.product?.name || 'Unknown Product'}
                            {item.variant && (
                              <div style={{ fontSize: '10px' }}>
                                {item.variant.color || item.variant.size || 'Standard'}
                              </div>
                            )}
                          </td>
                          <td className="item-qty">{item.quantity}</td>
                          <td className="item-price">{formatNumberToCurrency(item.price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                <div className="divider"></div>
                
                <table className="totals">
                  <tbody>
                    <tr>
                      <td className="label">Subtotal:</td>
                      <td className="value">{formatNumberToCurrency(order.subTotal || order.amount)}</td>
                    </tr>

                    {order.discountPercentage > 0 && (
                      <tr>
                        <td className="label text-red-600">Discount ({order.discountPercentage}%):</td>
                        <td className="value text-red-600">
                          -{formatNumberToCurrency((order.subTotal - order.subTotalAfterDiscount) || 0)}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="label">Shipping:</td>
                      <td className="value">{formatNumberToCurrency(order.deliveryFee || 0)}</td>
                    </tr>

                    {order.tax > 0 && (
                      <tr>
                        <td className="label">VAT:</td>
                        <td className="value">{formatNumberToCurrency(order.tax)}</td>
                      </tr>
                    )}

                    <tr>
                      <td className="label">TOTAL:</td>
                      <td className="value">
                        {formatNumberToCurrency(order.discountPercentage > 0 ? order.amountAfterDiscount : order.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="divider"></div>
                
                <div className="order-info">
                  <div><strong>SHIPPING TO:</strong></div>
                  <div>{order.shipping?.addressLine1 || 'N/A'}</div>
                  {order.shipping?.addressLine2 && <div>{order.shipping.addressLine2}</div>}
                  <div>
                    {order.shipping?.city || ''}, {order.shipping?.state || ''} {order.shipping?.postalCode || ''}
                  </div>
                  <div>{order.shipping?.country || 'N/A'}</div>
                </div>
                
                <div className="divider"></div>
                
                <div className="order-info">
                  <div>
                    <strong>PAYMENT: </strong>
                    <span className="status-badge" style={{
                      backgroundColor: order.hasPaid ? '#dcfce7' : '#fee2e2',
                      color: order.hasPaid ? '#166534' : '#991b1b'
                    }}>
                      {order.hasPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                <div className="footer">
                  <div>Thank you for your business!</div>
                  <div className="thank-you">Please come again</div>
                </div>
              </div>
            ))
          ) : (
            <p>No orders selected for printing</p>
          )}
        </div>
      </div>

      <table className="min-w-full border border-gray-200 text-sm text-gray-700">
        <thead className="sticky top-0 bg-gray-100 shadow-sm">
          <tr className="bg-gray-100">
            <th scope="col" className="px-6 py-3 w-10">
              <input 
                type="checkbox" 
                onChange={handleSelectAll}
                checked={selectedOrders.length === orders.length && orders.length > 0}
                className="cursor-pointer"
              />
            </th>
            <th scope="col" className="px-6 py-3">Order ID</th>
            <th scope="col" className="px-6 py-3">Waybill ID</th>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3">Items</th>
            <th scope="col" className="px-6 py-3">Amount</th>
            <th scope="col" className="px-6 py-3">Coupon</th>
            <th scope="col" className="px-6 py-3">Payment Status</th>
            <th scope="col" className="px-6 py-3">Delivery Status</th>
            <th scope="col" className="px-6 py-3">Shipping Provider</th>
            <th scope="col" className="px-6 py-3">Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((or) => (
            <tr 
              key={or?.shipping?.id} 
              className={`hover:bg-gray-50 border-b ${selectedOrders.includes(or?.shipping?.id) ? 'bg-blue-50' : 'bg-white'}`}
              onClick={() => handleRowClick(or?.shipping?.id)}
              style={{ cursor: 'pointer' }}
            >
              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedOrders.includes(or?.shipping?.id)}
                  onChange={(e) => handleSelectOrder(e, or?.shipping?.id)}
                  className="cursor-pointer"
                />
              </td>
              <td className="px-6 py-4">#{or?.id?.substring(0, 8).toUpperCase()}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="min-w-[80px]">
                    {or?.shipping?.shippingProviderTrackingId || 'N/A'}
                  </span>
                  {allowWaybillEdit && (<div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={trackingIdMap[or.id] || ''}
                      onChange={(e) => handleTrackingIdChange(or.id, e.target.value)}
                      placeholder="New waybill ID"
                      className="text-xs border rounded px-2 py-1 w-32"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShippingTrackingIdUpdate(or.shipping?.id, or.id);
                      }}
                      disabled={updatingTrackingId === or.id || !trackingIdMap[or.id]?.trim()}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {updatingTrackingId === or.id ? 'Updating...' : 'Update'}
                    </button>
                  </div>)}
                </div>
              </td>
              <td className="px-6 py-4">{dateTimeToWord(or?.dateCreated)}</td>
              <td className="px-6 py-4">{or?.items?.length || 0}</td>
              <td className="px-6 py-4">
                {or.discountPercentage > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-gray-500 line-through text-xs">
                      {formatNumberToCurrency(or.amount || or.subTotal)}
                    </span>
                    <span className="font-semibold text-green-700">
                      {formatNumberToCurrency(or.amountAfterDiscount || or.amount)}
                    </span>
                  </div>
                ) : (
                  <span className="font-medium text-gray-900">
                    {formatNumberToCurrency(or.amount)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {or.couponCode ? (
                  <div>
                    <span className="block font-medium text-blue-700">{or.couponCode}</span>
                    {or.discountPercentage > 0 && (
                      <span className="text-xs text-gray-500">({or.discountPercentage}% off)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td className="px-6 py-4"><StatusComponent status={or.hasPaid} /></td>
              <td className="px-6 py-4"><StatusComponent status={or?.shipping?.status} /></td>
              <td className="px-6 py-4">{or?.shipping?.shippingProvider}</td>
              <td className="px-6 py-4"> 
                <Link to={`/orders/${or?.id}`} className="hover:text-brand" onClick={(e) => e.stopPropagation()}>
                  <Eye size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;