"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiClipboard, FiCreditCard, FiFilter, FiPackage, FiRefreshCw, FiSearch } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import OrderList from "./OrderList";
import PaginationAlt from "@/components/PaginationAlt";
import toast from "react-hot-toast";
import formatNumberToCurrency from "@/utils/numberToMoney";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const limit = 10;

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
  ];

  const dateOptions = [
    { value: "all", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  const fetchOrders = async (showToast = false) => {
    setLoading(true);
    setRefreshing(true);
    try {
      let url = `${endpointsPath.order}/by-user?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${limit}&status=Completed`;

      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      if (dateFilter !== "all") {
        url += `&dateRange=${dateFilter}`;
      }

      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setOrders(response.result.data);
        setTotalPages(response.result.totalPages || 1);

        if (showToast) {
          toast.success("Orders refreshed");
        }
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, page, statusFilter, dateFilter]);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.hasPaid).length,
    [orders]
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => !order.hasPaid).length,
    [orders]
  );
  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.amountAfterDiscount || order.amount || 0),
        0
      ),
    [orders]
  );

  const metricCards = [
    {
      label: "Orders",
      value: orders.length,
      note: "In this view",
      icon: FiPackage,
      tone: "bg-[linear-gradient(135deg,#fff1e5,#fffaf5)] text-gray-950",
    },
    {
      label: "Completed",
      value: completedOrders,
      note: "Paid orders",
      icon: FiCreditCard,
      tone: "bg-white text-gray-950",
    },
    {
      label: "Pending",
      value: pendingOrders,
      note: "Awaiting completion",
      icon: FiClipboard,
      tone: "bg-[#1f2937] text-white",
    },
    
  ];

  return (
    <div className="space-y-6 p-2 md:p-4">
      <section className="rounded-[32px] border border-[#f0dacc] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,236,0.95)_42%,_rgba(255,232,214,0.92)_100%)] p-6 shadow-[0_20px_70px_rgba(240,108,35,0.10)] md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c2410c]">
              Order Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-[2.4rem]">
              Your orders
            </h1>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Track purchases, review payments, and open any order details quickly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`rounded-[26px] border border-white/60 p-5 shadow-sm ${card.tone}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium opacity-80">{card.label}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5">
                    <Icon className="text-lg" />
                  </div>
                </div>
                <div className="mt-5 text-[1.9rem] font-semibold tracking-tight">{card.value}</div>
                <div className="mt-1 text-sm opacity-75">{card.note}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#ece4db] bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Filters
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Find the order you need</h2>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-4 py-2 text-sm font-medium text-[#c2410c]">
            <FiFilter />
            {statusFilter === "all" ? "All statuses" : statusOptions.find((x) => x.value === statusFilter)?.label}
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order id"
              className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="rounded-[30px] border border-[#ece4db] bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-5">
        <OrderList loading={loading} orders={orders} />
      </div>

      <div className="pt-1">
        <PaginationAlt currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Orders;
