"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiClipboard,
  FiCreditCard,
  FiGift,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiStar,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import formatNumberToCurrency from "@/utils/numberToMoney";
import toast from "react-hot-toast";

const quickLinks = [
  {
    title: "Orders",
    description: "Track purchases and delivery status.",
    href: "/customer/orders",
    icon: FiPackage,
    accent: "from-[#ffedd5] to-[#fff7ed]",
  },
  {
    title: "Addresses",
    description: "Manage saved delivery locations.",
    href: "/customer/addresses",
    icon: FiMapPin,
    accent: "from-[#ecfccb] to-[#f7fee7]",
  },
  {
    title: "Transactions",
    description: "Review payments and activity.",
    href: "/customer/transactions",
    icon: FiCreditCard,
    accent: "from-[#dbeafe] to-[#eff6ff]",
  },
  {
    title: "Profile",
    description: "Update your account details.",
    href: "/customer/profile",
    icon: FiUser,
    accent: "from-[#fae8ff] to-[#fdf4ff]",
  },
];

export default function CustomerDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ commission: 0, withdrawn: 0 });
  const [orders, setOrders] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [user, setUser] = useState(null);

  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      setRefreshing(true);

      const loggedInUserResp = await requestHandler.get(
        `${endpointsPath.auth}/logged-in-user-details`,
        true
      );

      if (loggedInUserResp.statusCode !== 200 || !loggedInUserResp.result?.data) {
        throw new Error("Unable to load your account details");
      }

      const currentUser = loggedInUserResp.result.data;
      setUser(currentUser);

      const [profileResp, walletResp, ordersResp, referralsResp] = await Promise.all([
        requestHandler.get(`${endpointsPath.profile}/${currentUser.id}`, true),
        requestHandler.get(`${endpointsPath.wallet}/${currentUser.id}/user`, true),
        requestHandler.get(
          `${endpointsPath.order}/by-user?searchTerm=&pageNumber=1&pageSize=6&status=all`,
          true
        ),
        requestHandler.get(
          `${endpointsPath.referral}?pageNumber=1&pageSize=20&referrerId=${currentUser.id}`,
          true
        ),
      ]);

      if (profileResp.statusCode === 200) {
        setProfile(profileResp.result?.data || null);
      }

      if (walletResp.statusCode === 200) {
        setWallet(walletResp.result?.data || { commission: 0, withdrawn: 0 });
      }

      if (ordersResp.statusCode === 200) {
        setOrders(ordersResp.result?.data || []);
      }

      if (referralsResp.statusCode === 200) {
        setReferrals(referralsResp.result?.data || []);
      }

      if (showRefreshToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("dashboard fetch failed", error);
      toast.error(error.message || "Failed to load your dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const firstName = profile?.firstName || user?.firstName || "there";
  const completedOrders = useMemo(
    () => orders.filter((order) => order.hasPaid).length,
    [orders]
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => !order.hasPaid).length,
    [orders]
  );
  const totalReferralCommission = useMemo(
    () => referrals.reduce((sum, referral) => sum + Number(referral.totalCommissionEarned || 0), 0),
    [referrals]
  );
  const formatOrderDate = (value) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const heroStats = [
    {
      label: "Completed orders",
      value: completedOrders,
      tone: "bg-white/75 text-gray-900",
      icon: FiPackage,
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      tone: "bg-[#1f2937] text-white",
      icon: FiClipboard,
    },
    {
      label: "Referral commission",
      value: formatNumberToCurrency(wallet?.commission || totalReferralCommission || 0),
      tone: "bg-[#f97316] text-white",
      icon: FiGift,
    },
  ];

  const metricCards = [
    {
      title: "Saved Commission",
      value: formatNumberToCurrency(wallet?.commission || 0),
      note: "Available now",
      icon: FiGift,
    },
    {
      title: "Commission Used",
      value: formatNumberToCurrency(wallet?.withdrawn || 0),
      note: "Already applied",
      icon: FiRefreshCw,
    },
    {
      title: "Referrals",
      value: referrals.length,
      note: "Connected accounts",
      icon: FiUsers,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[32px] bg-white/70" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-[28px] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[34px] border border-[#f3d4bf] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(255,244,237,0.92)_38%,_rgba(255,226,201,0.95)_100%)] p-6 shadow-[0_24px_80px_rgba(240,108,35,0.12)] md:p-8">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#fb923c]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#fdba74]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c2410c]">
              Customer Dashboard
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 md:text-[2.5rem]">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 text-sm text-gray-600 md:text-base">
              Your orders, referrals, and account details in one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/customer/orders"
                className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                View Orders
                <FiArrowRight />
              </Link>
              <Link
                href="/customer/profile"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-white"
              >
                Update Profile
              </Link>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[520px]">
            {heroStats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-[24px] border border-white/60 p-4 shadow-sm backdrop-blur ${item.tone}`}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/5">
                    <Icon className="text-lg" />
                  </div>
                  <div className="text-2xl font-semibold">{item.value}</div>
                  <div className="mt-1 text-sm opacity-80">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-[28px] border border-[#ece7df] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">{card.title}</div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#ea580c]">
                  <Icon className="text-lg" />
                </div>
              </div>
              <div className="mt-5 text-[1.9rem] font-semibold tracking-tight text-gray-950">
                {card.value}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-500">{card.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[30px] border border-[#ece7df] bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                Recent Orders
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">Latest activity</h2>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="flex flex-col gap-4 rounded-[22px] border border-gray-100 bg-[#fcfbf8] p-4 transition hover:border-[#f3c9a7] hover:bg-white md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-950">
                      Order #{String(order.id).slice(0, 8).toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatOrderDate(order.orderDate || order.dateCreated)} • {order.items?.length || 0} item(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Amount</div>
                      <div className="font-semibold text-gray-950">
                        {formatNumberToCurrency(order.amountAfterDiscount || order.amount || 0)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.hasPaid
                          ? "bg-[#ecfdf3] text-[#166534]"
                          : "bg-[#fff7ed] text-[#c2410c]"
                      }`}
                    >
                      {order.hasPaid ? "Completed" : "Pending"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#fcfbf8] p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ec] text-[#ea580c]">
                  <FiPackage className="text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your recent activity will appear here.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-[#ece7df] bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Quick Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Jump into your account</h2>
            <div className="mt-5 grid gap-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`rounded-[24px] border border-gray-100 bg-gradient-to-br ${item.accent} p-4 transition hover:-translate-y-0.5 hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-gray-950">{item.title}</div>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-gray-900">
                        <Icon className="text-lg" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#ece7df] bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Referral Snapshot
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-950">Earn with your network</h2>
              <FiStar className="text-xl text-[#f97316]" />
            </div>
            <div className="mt-5 rounded-[24px] bg-[#fff7f1] p-4">
              <div className="text-sm text-gray-500">Referral performance</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Referrals</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-950">{referrals.length}</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Total earned</div>
                  <div className="mt-2 text-xl font-semibold text-gray-950">
                    {formatNumberToCurrency(totalReferralCommission)}
                  </div>
                </div>
              </div>
              <Link
                href="/customer/referrals"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c2410c]"
              >
                Open referrals
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
