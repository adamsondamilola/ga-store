"use client";
import formatNumberToCurrency from "@/utils/numberToMoney";

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

  const hasValidPaymentSelection =
    (paymentMethod === "credit-card" &&
      gatewayMethods.some((method) => method.methodKey === paymentGateway)) ||
    (paymentMethod === "wallet" && Boolean(walletMethod)) ||
    (paymentMethod === "manual" && Boolean(manualMethod));
  const isManualProofReady =
    paymentMethod !== "manual" || Boolean(manualProofFile);

  const isButtonDisabled =
    isLoading ||
    !deliveryMethodSelected ||
    !isCheckoutReady ||
    shippingFee < 1 ||
    enabledPaymentMethods.length === 0 ||
    !hasValidPaymentSelection ||
    !isManualProofReady;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold">Order Summary</h2>
      </div>

      <div className="p-6 space-y-4">

        {/* Coupon */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium mb-2">Discount Code</label>

           <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter Code"
              className="w-full sm:flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                 placeholder:text-gray-400 transition-shadow"
              disabled={isApplyingCoupon || isCouponSuccessful}
            />

            <button
              type="button"
              onClick={applyCoupon}
              disabled={isApplyingCoupon || isCouponSuccessful}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isApplyingCoupon ? "..." : isCouponSuccessful ? "Applied" : "Apply"}
            </button>
          </div>

          {discountPercentage > 0 && (
            <p className="text-green-600 mt-2 text-sm">
              {discountPercentage}% discount applied!
            </p>
          )}
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatNumberToCurrency(subtotal)}</span>
          </div>

          {discountPercentage > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountPercentage}%)</span>
              <span>-{formatNumberToCurrency((subtotal * discountPercentage) / 100)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>{formatNumberToCurrency(shippingFee)}</span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({vat}%)</span>
              <span>{formatNumberToCurrency(tax)}</span>
            </div>
          )}

          <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-blue-600">
              {formatNumberToCurrency(totalAfterDiscountCalc)}
            </span>
          </div>
        </div>

        {/* Complete Order Button */}
        <button
          onClick={handlePaymentSubmit}
          disabled={isButtonDisabled}
          className={`w-full py-3 mt-4 rounded-lg transition font-medium ${
            isButtonDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800 active:scale-95"
          }`}
        >
          {isLoading ? "Processing..." : "Complete Order"}
        </button>
      </div>
    </div>
  );
}
