import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Edit, Eye, Trash2 } from 'lucide-react';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import dateTimeToWord from '../../utils/dateTimeToWord';

const CouponList = ({ loading, coupons, fetchCoupons, onEdit }) => {
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCoupons(coupons.map((c) => c.id));
    } else {
      setSelectedCoupons([]);
    }
  };

  // Handle select individual
  const handleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedCoupons((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleViewDetails = async (id) => {
    window.location.href = `/coupon/${id}`
  }

  // Bulk delete selected coupons
  const handleDeleteSelected = async () => {
    if (selectedCoupons.length === 0) {
      toast.warning('No coupons selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedCoupons.length} coupon(s)?`)) return;

    setIsDeleting(true);
    try {
      for (const id of selectedCoupons) {
        await requestHandler.deleteReq(`${endpointsPath.coupon}/${id}`, true);
      }
      toast.success('Selected coupons deleted successfully');
      setSelectedCoupons([]);
      fetchCoupons();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete coupons');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle active/inactive state
  const handleToggleActive = async (coupon) => {
    setIsToggling(true);
    try {
      const payload = { ...coupon, isActive: !coupon.isActive };
      const response = await requestHandler.put(`${endpointsPath.coupon}/${coupon.id}`, payload, true);
      if (response.statusCode === 200) {
        toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchCoupons();
      } else {
        toast.error(response.result?.message || 'Failed to update coupon');
      }
    } catch (error) {
      console.error('Toggle failed:', error);
      toast.error('Failed to update coupon');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-10 w-10 border-t-2 border-primary border-b-2 rounded-full"></div>
      </div>
    );
  }

  if (!coupons?.length) {
    return <p className="text-center text-gray-500 py-6">No coupons found</p>;
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Bulk Action Bar */}
      {selectedCoupons.length > 0 && (
        <div className="mb-3 p-3 bg-gray-100 border rounded flex flex-wrap items-center gap-4">
          <span className="font-medium text-sm">{selectedCoupons.length} selected</span>

          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="bg-red-500 text-white px-4 py-2 text-sm rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>

          <button
            onClick={() => setSelectedCoupons([])}
            className="bg-gray-200 px-4 py-2 text-sm rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <table className="min-w-full text-sm text-left text-gray-700 border border-gray-100 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedCoupons.length === coupons.length && coupons.length > 0}
                className="cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-2 py-3 font-medium">Usage/User</th>
            <th className="px-4 py-3 font-medium">Global Limit</th>
            <th className="px-4 py-3 font-medium">Valid From</th>
            <th className="px-4 py-3 font-medium">Valid To</th>
            <th className="px-4 py-3 font-medium">Tiers</th>
            <th className="px-4 py-3 font-medium text-center">Active</th>
            <th className="px-6 py-3 font-medium text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {coupons.map((coupon) => (
            <tr
              key={coupon.id}
              className={`hover:bg-gray-50 ${selectedCoupons.includes(coupon.id) ? 'bg-blue-50' : 'bg-white'}`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedCoupons.includes(coupon.id)}
                  onChange={(e) => handleSelect(e, coupon.id)}
                  className="cursor-pointer"
                />
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">{coupon.code}</td>
              <td className="px-4 py-3">{coupon.usagePerUserLimit}</td>
              <td className="px-4 py-3">{coupon.globalUsageLimit}</td>
              <td className="px-4 py-3">{dateTimeToWord(coupon.validFrom)}</td>
              <td className="px-4 py-3">{dateTimeToWord(coupon.validTo)}</td>
              <td className="px-4 py-3">
                {coupon.tiers?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {coupon.tiers.map((tier) => (
                      <span
                        key={tier.usageNumber}
                        className="text-xs bg-gray-100 border px-2 py-1 rounded"
                      >
                        {tier.usageNumber}x → {tier.discountPercentage}%
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">No tiers</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleToggleActive(coupon)}
                  disabled={isToggling}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    coupon.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </button>
                <div onClick={() => handleToggleActive(coupon)} className='text-xs cursor-pointer'>{coupon.isActive ? 'Deactivate' : 'Activate'}</div>
              </td>
              <td className="px-2 py-3 text-center space-x-2">
                <button
                  onClick={() => onEdit(coupon)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleViewDetails(coupon.id)}
                  className="text-green-600 hover:text-green-800"
                  title="Details"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDeleteSelected([coupon.id])}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CouponList;