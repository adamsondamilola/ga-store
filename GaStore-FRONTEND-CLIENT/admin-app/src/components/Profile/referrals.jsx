import React, { useEffect, useState } from 'react';
import endpointsPath from '../../constants/EndpointsPath';
import requestHandler from '../../utils/requestHandler';
import Pagination from '../Pagination';
import { format } from 'date-fns'; // Optional: for better date formatting
import formatNumberToCurrency from '../../utils/numberToMoney';
import { Link } from 'react-router-dom';

const ReferralsList = (props) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, [page, pageSize, props.userId]);

  const fetchReferrals = async () => {
    if (!props.userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNumber: page,
        pageSize: pageSize,
        referrerId: props.userId
      });

      const response = await requestHandler.get(
        `${endpointsPath.referral}/admin?${params}`,
        true
      );

      if (response.statusCode === 200) {
        setReferrals(response.result.data || []);
        setTotalPages(response.result.totalPages || 1);
        setTotalRecords(response.result.totalRecords || 0);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (referralId) => {
    setExpandedRow(expandedRow === referralId ? null : referralId);
  };


  const getStatusBadge = (totalCommission) => {
    const status = totalCommission > 0 ? 'Active' : 'Pending';
    const colorClass = totalCommission > 0 
      ? 'bg-green-100 text-green-800 border-green-300' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-300';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        {status}
      </span>
    );
  };

  const getCommissionStatusBadge = (commissionAmount) => {
    const status = commissionAmount > 0 ? 'Paid' : 'Pending';
    const colorClass = commissionAmount > 0 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="container mx-auto px-0 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Referral Management</h1>
            <p className="text-gray-600 mt-1">Track and manage your referral commissions</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-xl font-bold text-blue-600">{totalRecords}</p>
            </div>
            <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-100">
              <p className="text-sm text-gray-600">Total Commission</p>
              <p className="text-xl font-bold text-green-600">
                {formatNumberToCurrency(referrals.reduce((sum, r) => sum + r.totalCommissionEarned, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5l-5.5 5.5m0 0l-5.5-5.5m5.5 5.5V3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
            <p className="text-gray-500">Start sharing your referral link to earn commissions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                 {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>*/}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <React.Fragment key={referral.referralId}>
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold text-sm">
                              {getInitials(referral.referralUserDto?.firstName, referral.referralUserDto?.lastName)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referralUserDto?.firstName} {referral.referralUserDto?.lastName}
                            </div>
                            {/*<div className="text-sm text-gray-500">
                              @{referral.referralUserDto?.username}
                            </div>*/}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(referral.referralUserDto?.dateCreated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(referral.referralUserDto?.dateCreated).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatNumberToCurrency(referral.totalCommissionEarned)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{referral.purchasesDto?.length || 0}</span>
                          
                        </div>
                      </td>
                      {/*<td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(referral.totalCommissionEarned)}
                      </td>*/}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleRowExpansion(referral.referralId)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {expandedRow === referral.referralId ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => window.location.href = `/profile/${referral.referralId}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Commission Details */}
                    {expandedRow === referral.referralId && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-semibold text-gray-900">Commission Details</h4>
                              <span className="text-sm text-gray-500">
                                Total: {formatNumberToCurrency(referral.totalCommissionEarned)}
                              </span>
                            </div>
                            
                            {referral.purchasesDto && referral.purchasesDto.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {referral.purchasesDto.map((purchase, index) => (
                                      <tr key={`${purchase.orderId}-${index}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                          <Link to={`/orders/${purchase.orderId}`} className="text-blue-600 hover:underline">
                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                            {purchase.orderId.substring(0, 8)}...
                                          </span>
                                          </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                          {formatNumberToCurrency(purchase.commissionAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                          {getCommissionStatusBadge(purchase.commissionAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {/* Add purchase date if available in API response */}
                                          {new Date().toLocaleDateString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>No purchase commissions recorded yet</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && referrals.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Active Referrals</div>
              <div className="text-2xl font-bold text-green-600">
                {referrals.filter(r => r.totalCommissionEarned > 0).length}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Pending Referrals</div>
              <div className="text-2xl font-bold text-yellow-600">
                {referrals.filter(r => r.totalCommissionEarned === 0).length}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Total Purchases</div>
              <div className="text-2xl font-bold text-blue-600">
                {referrals.reduce((sum, r) => sum + (r.purchasesDto?.length || 0), 0)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Avg. Commission</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatNumberToCurrency(
                  referrals.length > 0 
                    ? referrals.reduce((sum, r) => sum + r.totalCommissionEarned, 0) / referrals.length 
                    : 0
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {referrals.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralsList;