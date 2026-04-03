"use client";
import React from "react";
import Link from "next/link";
import dateTimeToWord from "@/utils/dateTimeToWord";
import formatNumberToCurrency from "@/utils/numberToMoney";
import StatusComponent from "@/components/Status";
import Spinner from "@/utils/spinner";

const OrderList = ({ loading, orders }) => {
  if (loading) return <Spinner loading={loading} />;

  if (!orders?.length)
    return (
      <div className="col-span-full text-center py-10">
        <div className="text-gray-500 dark:text-gray-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium">No orders found</h3>
          <p className="mt-1">You haven’t placed any orders yet.</p>
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {orders.map((order) => {
        const totalItems =
          order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        const hasDiscount = order.discountPercentage > 0;

        return (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {dateTimeToWord(order?.dateCreated)}
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                Order #{order.id.substring(0, 8).toUpperCase()}
              </h3>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Amount
                  </p>
                  {hasDiscount ? (
                    <div className="flex flex-col">
                      <span className="text-gray-500 line-through text-xs">
                        {formatNumberToCurrency(order.amount || order.subTotal)}
                      </span>
                      <span className="font-semibold text-green-700">
                        {formatNumberToCurrency(
                          order.amountAfterDiscount || order.amount
                        )}
                      </span>
                      {order.couponCode && (
                        <span className="text-xs text-blue-600 mt-1 font-medium">
                          {order.couponCode} ({order.discountPercentage}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatNumberToCurrency(order.amount)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Quantity
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {totalItems}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Payment
                  </p>
                  <StatusComponent status={order.hasPaid} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delivery
                  </p>
                  <StatusComponent status={order?.shipping?.status} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <Link
                href={`/customer/orders/${order.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
              >
                View Details
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderList;
