"use client"
import React, { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import toast from 'react-hot-toast';
import formatNumberToCurrency from '@/utils/numberToMoney';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [wallet, setWallet] = useState({
    balance: 0,
    commission: 0,
    withdrawn: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user ID first
        const userResp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        if (userResp.statusCode !== 200 || !userResp.result.data[0]?.id) {
          //throw new Error('Failed to fetch user data');
        }
        
        const userId = userResp.result.data[0].userId;
        setUserId(userId);

        // Then fetch wallet data
        const walletResp = await requestHandler.get(
          `${endpointsPath.wallet}/${userId}/user`,
          true
        );

        if (walletResp.statusCode === 200 && walletResp.result?.data) {
          setWallet({
            balance: walletResp.result.data.balance || 0,
            commission: walletResp.result.data.commission || 0,
            withdrawn: walletResp.result.data.withdrawn || 0
          });
        } else {
          throw new Error(walletResp.result?.message || 'Failed to fetch wallet data');
        }
      } catch (err) {
        console.error('Fetch failed:', err);
        setError(err.message || 'An unknown error occurred');
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-3 border-b last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {formatNumberToCurrency(value) || '0.00'}
      </span>
    </div>
  );

  const handleRefresh = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      
      const walletResp = await requestHandler.get(
        `${endpointsPath.wallet}/${userId}`,
        true
      );

      if (walletResp.statusCode === 200 && walletResp.result?.data) {
        setWallet({
          balance: walletResp.result.data.balance || 0,
          commission: walletResp.result.data.commission || 0,
          withdrawn: walletResp.result.data.withdrawn || 0
        });
        toast.success('Wallet data refreshed');
      } else {
        throw new Error(walletResp.result?.message || 'Failed to refresh wallet data');
      }
    } catch (err) {
      console.error('Refresh failed:', err);
      setError(err.message || 'Failed to refresh');
      toast.error('Failed to refresh wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto md:px-4 px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Referral Commission</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto md:px-4 px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Referral Commission</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Referral Commission</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-500 text-sm"
          >
            {loading ? (
              <span className="animate-spin mr-2">↻</span>
            ) : (
              <span className="mr-2">↻</span>
            )}
            Refresh
          </button>
        </div>
        
        <div className="space-y-6">
         {/* <h2 className="text-lg font-bold text-gray-800">Wallet Information</h2>*/}
          <div className="space-y-3">
            {/*<InfoRow label="Balance" value={wallet.balance} />*/}
            <InfoRow label="Commission Available" value={wallet.commission} />
            <InfoRow label="Commission Used" value={wallet.withdrawn} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;