"use client";
import formatNumberToCurrency from "@/utils/numberToMoney";
import { FiCheckCircle, FiPercent, FiShield } from "react-icons/fi";

export default function OrderSummary({
  subtotal,
  discountPercentage,
  shippingFee,
  tax,
  vat,
  totalAfterDiscountCalc,
  couponCode,
  setCouponCode,
  isApplyingCoupon,
  isCouponSuccessful,
  applyCoupon,
  isLoading,
  handlePaymentSubmit,
  deliveryMethodSelected,
  paymentMethod,
  paymentGateway,
  paymentMethods,
  manualProofFile,
  voucherCode,
  isCheckoutReady,
}) {
  const enabledPaymentMethods = paymentMethods || [];
  const gatewayMethods = enabledPaymentMethods.filter(
    (method) => method.isGateway && method.isEnabled
  );
  const walletMethod = enabledPaymentMethods.find(
    (method) => method.methodKey === "commission" && method.isEnabled
  );
  const manualMethod = enabledPaymentMethods.find(
    (method) => method.methodKey === "manual" && method.isEnabled
  );
  const voucherMethod = enabledPaymentMethods.find(
    (method) => method.methodKey === "voucher" && method.isEnabled
  );

  const hasValidPaymentSelection =
    (paymentMethod === "credit-card" &&
      gatewayMethods.some((method) => method.methodKey === paymentGateway)) ||
    (paymentMethod === "wallet" && Boolean(walletMethod)) ||
    (paymentMethod === "manual" && Boolean(manualMethod)) ||
    (paymentMethod === "voucher" && Boolean(voucherMethod));
  const isManualProofReady =
    paymentMethod !== "manual" || Boolean(manualProofFile);
  const isVoucherReady =
    paymentMethod !== "voucher" || Boolean(voucherCode?.trim());

  const isButtonDisabled =
    isLoading ||
    !deliveryMethodSelected ||
    !isCheckoutReady ||
    shippingFee < 1 ||
    enabledPaymentMethods.length === 0 ||
    !hasValidPaymentSelection ||
    !isManualProofReady ||
    !isVoucherReady;

  return (
    <div className="sticky top-24 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#fcfbf8] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2e8] text-[#f97316]">
            <FiShield className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            <p className="mt-1 text-sm text-gray-500">Everything you need before you confirm payment.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="rounded-2xl border border-[#f2d9c6] bg-[#fff8f3] p-4">
          <div className="mb-3 flex items-center gap-2">
            <FiPercent className="text-[#f97316]" />
            <label className="block text-sm font-semibold text-gray-900">Discount Code</label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter Code"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                 focus:border-transparent focus:ring-2 focus:ring-[#f97316]
                 placeholder:text-gray-400 transition-shadow"
              disabled={isApplyingCoupon || isCouponSuccessful}
            />

            <button
              type="button"
              onClick={applyCoupon}
              disabled={isApplyingCoupon || isCouponSuccessful}
              className="rounded-xl bg-[#f97316] px-4 py-2 font-medium text-white transition hover:bg-[#ea580c]"
            >
              {isApplyingCoupon ? "..." : isCouponSuccessful ? "Applied" : "Apply"}
            </button>
          </div>

          {discountPercentage > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-green-700">
              <FiCheckCircle />
              {discountPercentage}% discount applied!
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-[#faf9f6] p-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatNumberToCurrency(subtotal)}</span>
          </div>

          {discountPercentage > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Discount ({discountPercentage}%)</span>
              <span>-{formatNumberToCurrency((subtotal * discountPercentage) / 100)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{formatNumberToCurrency(shippingFee)}</span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({vat}%)</span>
              <span>{formatNumberToCurrency(tax)}</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-4 text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-[#f97316]">
              {formatNumberToCurrency(totalAfterDiscountCalc)}
            </span>
          </div>
        </div>

        <button
          onClick={handlePaymentSubmit}
          disabled={isButtonDisabled}
          className={`mt-2 w-full rounded-full py-3.5 text-sm font-semibold transition ${
            isButtonDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-950 text-white hover:bg-black active:scale-95"
            }`}
        >
          {isLoading ? "Processing..." : "Complete Order"}
        </button>

        <p className="text-center text-xs leading-5 text-gray-500">
          By completing your order, you confirm your delivery and payment details are correct.
        </p>
      </div>
    </div>
  );
}
