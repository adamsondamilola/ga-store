import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import { ArrowLeft, Calendar, Percent, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import dateTimeToWord from '../../utils/dateTimeToWord';
import endpointsPath from '../../constants/EndpointsPath';

export default function CouponDetails() {
  const { id } = useParams();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchCoupon = async () => {
    try {
      const response = await requestHandler.get(`${endpointsPath.coupon}/${id}`, true);
      if (response.statusCode === 200 && response.result?.data) {
        setCoupon(response.result.data);
      } else {
        toast.error(response.result?.message || 'Failed to load coupon');
      }
    } catch (error) {
      console.error('Error fetching coupon:', error);
      toast.error('An error occurred while loading coupon');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsers = async () => {
    try {
      const response = await requestHandler.get(`${endpointsPath.coupon}/${id}/users`, true);
      if (response.statusCode === 200 && response.result?.data) {
        setUsers(response.result.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching coupon users:', error);
      toast.error('Failed to load coupon users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCoupon();
      fetchCouponUsers();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-10 w-10 border-t-2 border-primary border-b-2 rounded-full"></div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Coupon not found.</p>
        <Link to="/coupon" className="text-blue-600 hover:underline mt-3 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto md:px-4 px-4 py-8 space-y-6">
      {/* Coupon Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-gray-500 uppercase">Code</h3>
            <p className="text-lg font-semibold text-blue-700">{coupon.code}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 uppercase">Description</h3>
            <p className="text-gray-800">{coupon.description || '—'}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 uppercase">Global Usage Limit</h3>
            <p className="font-medium">{coupon.globalUsageLimit || 'Unlimited'}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 uppercase">Usage per User</h3>
            <p className="font-medium">{coupon.usagePerUserLimit || 'Unlimited'}</p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <div>
              <h3 className="text-sm text-gray-500 uppercase">Valid From</h3>
              <p className="font-medium">{dateTimeToWord(coupon.validFrom)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <div>
              <h3 className="text-sm text-gray-500 uppercase">Valid To</h3>
              <p className="font-medium">{dateTimeToWord(coupon.validTo)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-gray-500 uppercase">Status</h3>
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${
                coupon.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {coupon.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Discount Tiers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Percent size={18} className="text-blue-600" /> Discount Tiers
        </h2>
        {coupon.tiers && coupon.tiers.length > 0 ? (
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left border-b">Usage Number</th>
                <th className="p-3 text-left border-b">Discount (%)</th>
              </tr>
            </thead>
            <tbody>
              {coupon.tiers.map((tier) => (
                <tr key={tier.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{tier.usageNumber}</td>
                  <td className="p-3">{tier.discountPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No tiers configured for this coupon.</p>
        )}
      </div>

      {/* Coupon Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={18} className="text-blue-600" /> Coupon Users
        </h2>

        {loadingUsers ? (
          <div className="text-center text-gray-500 py-6">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full text-sm text-left text-gray-700">
    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
      <tr>
        <th className="p-3 border-b whitespace-nowrap">User</th>
        <th className="p-3 border-b whitespace-nowrap">Email</th>
        <th className="p-3 border-b whitespace-nowrap">Times Used</th>
        <th className="p-3 border-b whitespace-nowrap">Last Used</th>
        <th className="p-3 border-b whitespace-nowrap">Total Discount</th>
        <th className="p-3 border-b whitespace-nowrap text-center">Action</th>
      </tr>
    </thead>
    <tbody>
      {users.map((u) => (
        <tr
          key={u.id}
          className="border-b hover:bg-gray-50 transition-colors duration-150"
        >
          <td className="p-3 whitespace-nowrap">{u.fullName || '—'}</td>
          <td className="p-3 whitespace-nowrap">{u.email || '—'}</td>
          <td className="p-3 whitespace-nowrap">{u.usageCount || 1}</td>
          <td className="p-3 whitespace-nowrap">
            {u.lastUsedDate ? dateTimeToWord(u.lastUsedDate) : '—'}
          </td>
          <td className="p-3 text-green-700 whitespace-nowrap">
            ₦{(u.totalDiscountReceived || 0).toLocaleString()}
          </td>
          <td className="p-3 text-center whitespace-nowrap">
            <Link
              to={`/orders?couponCode=${coupon.code}&userId=${u.userId}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Orders
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        ) : (
          <p className="text-gray-500">No users have used this coupon yet.</p>
        )}
      </div>
    </div>
  );
}
