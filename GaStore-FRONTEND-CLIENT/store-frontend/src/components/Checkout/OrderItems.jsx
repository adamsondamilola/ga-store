"use client";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { FiCheckCircle, FiPackage } from "react-icons/fi";
import Link from "next/link";

export default function OrderItems({ cartItems }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#fcfbf8] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center text-xl font-semibold text-gray-900">
              <FiPackage className="mr-3 text-[#f97316]" />
              Review Your Items
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Confirm the products, quantities, and totals before placing your order.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full bg-[#fff2e8] px-4 py-2 text-sm font-semibold text-[#c2410c]">
            <FiCheckCircle className="mr-2" />
            {cartItems.length} item{cartItems.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {cartItems.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.createdAt}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-[#faf9f6] p-4 sm:flex-row sm:items-center"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 rounded-xl object-cover shadow-sm sm:h-20 sm:w-20"
                />

                <div className="flex-1 min-w-0 w-full">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-gray-700 ring-1 ring-gray-200">
                      Qty: {item.quantity}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-gray-700 ring-1 ring-gray-200">
                      {item.variantName}
                    </span>
                    <span className="text-gray-500">
                      {formatNumberToCurrency(item.unitPrice)} each
                    </span>
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto">
                  <p className="text-base font-bold text-gray-900 sm:text-lg">
                    {formatNumberToCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#f97316]">
                    Ready for checkout
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center sm:py-12">
            <FiPackage className="mx-auto text-gray-400 text-4xl sm:text-5xl mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">
              Your cart is empty
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-[#f97316] hover:text-[#ea580c]"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
