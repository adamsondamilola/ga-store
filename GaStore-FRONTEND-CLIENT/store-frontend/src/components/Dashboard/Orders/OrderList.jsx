"use client";

import React from "react";
import Link from "next/link";
import dateTimeToWord from "@/utils/dateTimeToWord";
import formatNumberToCurrency from "@/utils/numberToMoney";
import Spinner from "@/utils/spinner";
import { FiArrowRight, FiBox, FiCheckCircle, FiClock, FiCreditCard, FiTruck } from "react-icons/fi";

const PaymentBadge = ({ paid }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
      paid ? "bg-[#ecfdf3] text-[#166534]" : "bg-[#fff7ed] text-[#c2410c]"
    }`}
  >
    {paid ? <FiCheckCircle className="text-sm" /> : <FiClock className="text-sm" />}
    {paid ? "Paid" : "Pending"}
  </span>
);

const DeliveryBadge = ({ status }) => {
  const normalized = status || "Pending";
  const delivered = normalized.toLowerCase() === "delivered";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        delivered ? "bg-[#ecfdf3] text-[#166534]" : "bg-[#eff6ff] text-[#1d4ed8]"
      }`}
    >
      <FiTruck className="text-sm" />
      {normalized}
    </span>
  );
};

const SummaryCell = ({ label, value, emphasis = false }) => (
  <div className="rounded-2xl bg-[#fcfaf8] p-4">
    <div className="text-xs uppercase tracking-[0.22em] text-gray-400">{label}</div>
    <div className={`mt-2 text-sm ${emphasis ? "font-semibold text-gray-950" : "font-medium text-gray-700"}`}>
      {value}
    </div>
  </div>
);

const OrderList = ({ loading, orders }) => {
  if (loading) return <Spinner loading={loading} />;

  if (!orders?.length) {
    return (
      <div className="py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ec] text-[#ea580c]">
          <FiBox className="text-xl" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No orders found</h3>
        <p className="mt-2 text-sm text-gray-500">Try another filter or place your next order.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {orders.map((order) => {
        const totalItems =
          order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
        const hasDiscount = Number(order.discountPercentage || 0) > 0;
        const displayAmount = order.amountAfterDiscount || order.amount || 0;

        return (
          <div
            key={order.id}
            className="overflow-hidden rounded-[28px] border border-[#ece4db] bg-white shadow-[0_16px_44px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.10)]"
          >
            <div className="border-b border-[#f1e7de] bg-[linear-gradient(180deg,#fffdfa,#fff7f1)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c2410c]">
                    {dateTimeToWord(order?.dateCreated)}
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-gray-950">
                    Order #{String(order.id).slice(0, 8).toUpperCase()}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PaymentBadge paid={order.hasPaid} />
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-[#efe2d7]">
                    <FiBox className="text-sm text-[#c2410c]" />
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCell
                  label="Amount"
                  value={
                    hasDiscount ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 line-through">
                          {formatNumberToCurrency(order.amount || order.subTotal || 0)}
                        </div>
                        <div className="text-base font-semibold text-gray-950">
                          {formatNumberToCurrency(displayAmount)}
                        </div>
                        {order.couponCode ? (
                          <div className="text-xs font-medium text-[#c2410c]">
                            {order.couponCode} ({order.discountPercentage}% off)
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      formatNumberToCurrency(displayAmount)
                    )
                  }
                  emphasis
                />

                <SummaryCell label="Quantity" value={`${totalItems} item${totalItems === 1 ? "" : "s"}`} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#fcfaf8] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-gray-400">Payment</div>
                  <PaymentBadge paid={order.hasPaid} />
                </div>

                <div className="rounded-2xl bg-[#fcfaf8] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-gray-400">Delivery</div>
                  <DeliveryBadge status={order?.shipping?.status} />
                </div>
              </div>
            </div>

            <div className="border-t border-[#f1e7de] bg-[#fffdfa] p-5">
              <Link
                href={`/customer/orders/${order.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                View Details
                <FiArrowRight className="text-sm" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderList;
