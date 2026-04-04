"use client"
import React, { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import toast from 'react-hot-toast';
import PaginationAlt from '@/components/PaginationAlt';
import formatNumberToCurrency from '@/utils/numberToMoney';
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from '../PageShell';
import { FiRefreshCw, FiUsers, FiTrendingUp, FiActivity } from 'react-icons/fi';

const ReferralsList = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null); // For expandable commission details
  const [userId, setUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 10;

  useEffect(() => {
    const loggedInUser = async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if(resp.statusCode === 200){
        const usrId = resp.result.data[0]?.userId;
        setUserId(usrId);
        fetchReferrals(usrId);
      }
    }
    loggedInUser();
  }, []);

  // Re-fetch when page changes
  useEffect(() => {
    if (userId) {
      fetchReferrals(userId);
    }
  }, [page, userId]);

  const fetchReferrals = async (userId) => {
    setLoading(true);
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        pageNumber: page,
        pageSize: limit,
        referrerId: userId
      });

      const response = await requestHandler.get(
        `${endpointsPath.referral}?${params}`,
        true
      );

      if (response.statusCode === 200) {
        setReferrals(response.result.data || []);
        setTotalPages(response.result.totalPages || 1);
        setTotalRecords(response.result.totalRecords || 0);
      } else {
        toast.error(response.message || 'Failed to fetch referrals');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error(error.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleRowExpansion = (referralId) => {
    if (expandedRow === referralId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(referralId);
    }
  };

  return (
    <DashboardPageShell
      eyebrow="Referrals"
      title="Referral Dashboard"
      description="See who joined through you and how your commissions are performing."
      actions={
        <button
          onClick={() => userId && fetchReferrals(userId)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard label="Referrals" value={totalRecords} note="Total joined" icon={FiUsers} tone="bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950" />
        <DashboardStatCard label="Earned" value={formatNumberToCurrency(referrals.reduce((total, referral) => total + referral.totalCommissionEarned, 0))} note="Total commission" icon={FiTrendingUp} tone="bg-white text-gray-950" />
        <DashboardStatCard label="Active" value={referrals.filter(r => r.totalCommissionEarned > 0).length} note="Paying referrals" icon={FiActivity} tone="bg-white text-gray-950" />
        <DashboardStatCard label="Purchases" value={referrals.reduce((sum, r) => sum + (r.purchasesDto?.length || 0), 0)} note="Tracked purchases" icon={FiTrendingUp} tone="bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white" />
      </div>

      <DashboardPanel>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5l-5.5 5.5m0 0l-5.5-5.5m5.5 5.5V3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start referring friends to earn commissions!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-[#efe6de]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#fcfaf8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                  {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>*/}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <React.Fragment key={referral.referralId}>
                    <tr className="hover:bg-[#fffaf5] cursor-pointer" onClick={() => toggleRowExpansion(referral.referralId)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {referral.referralUserDto?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referralUserDto?.firstName} {referral.referralUserDto?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{referral.referralUserDto?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(referral.referralUserDto?.dateCreated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(referral.referralUserDto?.dateCreated).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatNumberToCurrency(referral.totalCommissionEarned)}
                        </div>
                        <div className="text-xs text-gray-500">
                          from {referral.purchasesDto?.length || 0} purchases
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.purchasesDto?.length || 0}
                      </td>
                      {/*<td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${referral.totalCommissionEarned > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {referral.totalCommissionEarned > 0 ? 'Active' : 'Pending'}
                        </span>
                      </td>*/}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => toggleRowExpansion(referral.referralId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {expandedRow === referral.referralId ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row - Commission Details */}
                    {expandedRow === referral.referralId && referral.purchasesDto && referral.purchasesDto.length > 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-[#fffaf5]">
                          <div className="bg-white rounded-2xl border border-[#efe6de] p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Commission Details</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#fcfaf8]">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S/N</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {referral.purchasesDto.map((purchase, index) => (
                                    <tr key={`${purchase.orderId}-${index}`}>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                          {index + 1}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                        {formatNumberToCurrency(purchase.commissionAmount)}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                          ${purchase.commissionAmount > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                          {purchase.commissionAmount > 0 ? 'Paid' : 'Pending'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {/* Add purchase date if available in your API */}
                                        {new Date().toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Summary Section */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-[#eff6ff] p-3 rounded-2xl">
                                <p className="text-xs text-gray-600">Total Purchases</p>
                                <p className="text-lg font-bold text-blue-600">{referral.purchasesDto.length}</p>
                              </div>
                              <div className="bg-[#ecfdf3] p-3 rounded-2xl">
                                <p className="text-xs text-gray-600">Total Commission Earned</p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatNumberToCurrency(referral.totalCommissionEarned)}
                                </p>
                              </div>
                              <div className="bg-[#fff7ed] p-3 rounded-2xl">
                                <p className="text-xs text-gray-600">Average Commission</p>
                                <p className="text-lg font-bold text-purple-600">
                                  {formatNumberToCurrency(
                                    referral.purchasesDto.length > 0 
                                      ? referral.totalCommissionEarned / referral.purchasesDto.length 
                                      : 0
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Expanded Row - No Purchases */}
                    {expandedRow === referral.referralId && (!referral.purchasesDto || referral.purchasesDto.length === 0) && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-[#fffaf5]">
                          <div className="text-center py-4 text-gray-500">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2">No purchases made by this referral yet</p>
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

        {referrals.length > 0 && (
          <div className="mt-6">
            <PaginationAlt
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default ReferralsList;
