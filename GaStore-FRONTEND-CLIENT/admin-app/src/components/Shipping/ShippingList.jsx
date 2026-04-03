import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusComponent from '../Status';
import { Eye, Truck, Package, DollarSign, Calendar } from 'lucide-react';
import dateTimeToWord from '../../utils/dateTimeToWord';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';

const ShippingList = ({ loading, shippings, fetchShippings, sortField, sortDirection }) => {
  const [selectedShippings, setSelectedShippings] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedShippings(shippings.map(sh => sh.id));
    } else {
      setSelectedShippings([]);
    }
  };

  const handleSelectShipping = (e, id) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    } else {
      id = e;
    }
    
    setSelectedShippings(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(shippingId => shippingId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const updateShippingStatus = async () => {
    if (!newStatus || selectedShippings.length === 0) return;
    
    setIsUpdating(true);
    try {
      const payload = selectedShippings.map(id => ({
        status: newStatus,
        id: id
      }));

      const response = await requestHandler.put(
        `${endpointsPath.shipping}/update-bulk-status`,
        payload,
        true
      );
      
      if (response.statusCode === 200) {
        toast.success(response.result.message || 'Shipping status updated successfully');
        setSelectedShippings([]);
        setNewStatus('');
        fetchShippings();
      } else {
        throw new Error(response.result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update shipping status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading shipments...</div>;

  if (shippings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No shipments found</div>;
  }

  return (
    <div className="relative overflow-x-auto">
      {selectedShippings.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{selectedShippings.length} shipment(s) selected</span>
          </div>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="border px-3 py-2 rounded"
            disabled={isUpdating}
          >
            <option value="">Select new status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            onClick={updateShippingStatus}
            disabled={!newStatus || isUpdating}
            className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </button>
          <button
            onClick={() => setSelectedShippings([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      <table className="w-full text-sm text-left text-gray-700">
        <thead>
          <tr className="bg-gray-100">
            <th scope="col" className="px-6 py-3 w-10">
              <input 
                type="checkbox" 
                onChange={handleSelectAll}
                checked={selectedShippings.length === shippings.length && shippings.length > 0}
                className="cursor-pointer rounded"
              />
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Date
              </div>
            </th>
            <th scope="col" className="px-6 py-3">Full Name</th>
            <th scope="col" className="px-6 py-3">Phone</th>
            <th scope="col" className="px-6 py-3">Carrier</th>
            <th scope="col" className="px-6 py-3">
              <div className="flex items-center gap-1">
                <Truck size={14} />
                Method
              </div>
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="flex items-center gap-1">
                Cost
              </div>
            </th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Waybill ID</th>
            <th scope="col" className="px-6 py-3">Order</th>
          </tr>
        </thead>
        <tbody>
          {shippings.map((sh) => (
            <tr 
              key={sh.id} 
              className={`hover:bg-gray-50 ${selectedShippings.includes(sh.id) ? 'bg-blue-50' : ''}`}
              onClick={() => handleSelectShipping(sh.id)}
              style={{ cursor: 'pointer' }}
            >
              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedShippings.includes(sh.id)}
                  onChange={(e) => handleSelectShipping(e, sh.id)}
                  className="cursor-pointer rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs text-gray-500">
                  {dateTimeToWord(sh?.dateCreated)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium">{sh?.fullName}</div>
                {sh?.email && (
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">
                    {sh.email}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">{sh?.phoneNumber}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sh.shippingProvider ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {sh.shippingProvider || 'Not specified'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  {sh.shippingMethod || 'Standard'}
                </span>
              </td>
              <td className="px-6 py-4">
                {sh.shippingCost ? (
                  <div className="font-medium">
                    ₦{parseFloat(sh.shippingCost).toLocaleString()}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">Not set</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusComponent status={sh.status} />
              </td>
              <td className="px-6 py-4">
                {sh.shippingProviderTrackingId ? (
                  <div className="flex items-center gap-1">
                    <Package size={14} className="text-gray-500" />
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {sh.shippingProviderTrackingId}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">N/A</span>
                )}
              </td>
              <td className="px-6 py-4"> 
                <Link 
                  to={`/orders/${sh?.orderId}`} 
                  className="inline-flex items-center gap-1 text-brand hover:text-brand-dark"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye size={16} />
                  <span className="text-xs">View</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Stats */}
      {/* <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="font-medium">Total:</span>
          <span>{shippings.length} shipments</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Selected:</span>
          <span>{selectedShippings.length} shipments</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Total Cost:</span>
          <span>₦{shippings.reduce((sum, sh) => sum + (parseFloat(sh.shippingCost) || 0), 0).toLocaleString()}</span>
        </div>
      </div>*/}
    </div>
  );
};

export default ShippingList;