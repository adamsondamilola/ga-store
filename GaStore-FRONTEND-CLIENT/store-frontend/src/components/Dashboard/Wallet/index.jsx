"use client";

import React, { useEffect, useState } from "react";
import { FiDollarSign, FiRefreshCw, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import toast from "react-hot-toast";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { DashboardPageShell, DashboardPanel, DashboardStatCard } from "../PageShell";

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [wallet, setWallet] = useState({
    balance: 0,
    commission: 0,
    withdrawn: 0,
  });
  const [error, setError] = useState(null);

  const fetchWallet = async (targetUserId, showToast = false) => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      const walletResp = await requestHandler.get(`${endpointsPath.wallet}/${targetUserId}/user`, true);

      if (walletResp.statusCode === 200 && walletResp.result?.data) {
        setWallet({
          balance: walletResp.result.data.balance || 0,
          commission: walletResp.result.data.commission || 0,
          withdrawn: walletResp.result.data.withdrawn || 0,
        });

        if (showToast) {
          toast.success("Commission refreshed");
        }
      } else {
        throw new Error(walletResp.result?.message || "Failed to fetch wallet data");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(err.message || "An unknown error occurred");
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        const currentUserId = userResp?.result?.data?.[0]?.userId;
        setUserId(currentUserId);
        await fetchWallet(currentUserId);
      } catch (err) {
        console.error("Fetch failed:", err);
        setError("Unable to load account information");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <DashboardPageShell
        eyebrow="Commission"
        title="Referral Commission"
        description="Track available and used commission."
      >
        <DashboardPanel className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => fetchWallet(userId)}
            className="mt-4 rounded-2xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </DashboardPanel>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      eyebrow="Commission"
      title="Referral Commission"
      description="A clean view of what you have earned and already used."
      actions={
        <button
          onClick={() => fetchWallet(userId, true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Available"
          value={loading ? "..." : formatNumberToCurrency(wallet.commission)}
          note="Ready now"
          icon={FiDollarSign}
          tone="bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950"
        />
        <DashboardStatCard
          label="Used"
          value={loading ? "..." : formatNumberToCurrency(wallet.withdrawn)}
          note="Already applied"
          icon={FiTrendingDown}
          tone="bg-white text-gray-950"
        />
        <DashboardStatCard
          label="Total Flow"
          value={loading ? "..." : formatNumberToCurrency((wallet.commission || 0) + (wallet.withdrawn || 0))}
          note="Available plus used"
          icon={FiTrendingUp}
          tone="bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white"
        />
      </div>

      <DashboardPanel>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#efe6de] pb-3">
            <span className="text-sm font-medium text-gray-500">Commission Available</span>
            <span className="text-base font-semibold text-gray-950">{formatNumberToCurrency(wallet.commission)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#efe6de] pb-3">
            <span className="text-sm font-medium text-gray-500">Commission Used</span>
            <span className="text-base font-semibold text-gray-950">{formatNumberToCurrency(wallet.withdrawn)}</span>
          </div>
        </div>
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default Wallet;
