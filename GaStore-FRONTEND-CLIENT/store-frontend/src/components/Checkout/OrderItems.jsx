"use client";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { FiPackage } from "react-icons/fi";
import Link from "next/link";

export default function OrderItems({ cartItems }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FiPackage className="mr-3 text-blue-600" />
            Order Items ({cartItems.length})
          </h2>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {cartItems.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.createdAt}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 sm:w-14 sm:h-14 object-cover rounded-lg shadow-sm"
                />

                <div className="flex-1 min-w-0 w-full">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">
                      Qty: {item.quantity}, {item.variantName}
                    </span>
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto">
                  <p className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatNumberToCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 md:hidden">
                    {formatNumberToCurrency(item.unitPrice)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12">
            <FiPackage className="mx-auto text-gray-400 text-4xl sm:text-5xl mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">
              Your cart is empty
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
