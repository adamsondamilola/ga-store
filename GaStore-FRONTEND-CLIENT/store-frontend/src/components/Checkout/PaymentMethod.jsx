"use client";
import { Wallet } from "@mui/icons-material";
import AppImages from "@/constants/Images";

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
  paymentMethods,
  manualPaymentAccounts,
  manualProofFile,
  setManualProofFile,
  manualSelectedBankAccountId,
  setManualSelectedBankAccountId,
  manualPaymentReference,
  setManualPaymentReference,
  manualCustomerNote,
  setManualCustomerNote,
  voucherCode,
  setVoucherCode,
  voucherValidation,
  isVoucherChecking,
  validateVoucher,
  paymentGateway,
  setPaymentGateway,
  handlePaymentSubmit,
  isLoading,
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
    paymentMethod !== "voucher" || Boolean(voucherCode.trim());
  const isButtonDisabled =
    isLoading ||
    !isCheckoutReady ||
    enabledPaymentMethods.length === 0 ||
    !hasValidPaymentSelection ||
    !isManualProofReady ||
    !isVoucherReady;

  const getGatewayLogo = (methodKey) => {
    if (methodKey === "Paystack") return AppImages.paystack;
    if (methodKey === "Flutterwave") return AppImages.flutterwave;
    return null;
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#fcfbf8] p-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose the payment option that feels most convenient for you.
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handlePaymentSubmit}>
          <div className="space-y-3">
            {gatewayMethods.map((gateway) => {
              const logo = getGatewayLogo(gateway.methodKey);

              return (
                <label
                  key={gateway.methodKey}
                  className={`flex cursor-pointer items-center rounded-2xl border p-4 transition ${
                    paymentMethod === "credit-card" && paymentGateway === gateway.methodKey
                      ? "border-[#f6c8a9] bg-[#fff7f1]"
                      : "hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "credit-card" && paymentGateway === gateway.methodKey}
                    onChange={() => {
                      setPaymentMethod("credit-card");
                      setPaymentGateway(gateway.methodKey);
                    }}
                    className="h-5 w-5 text-[#f97316]"
                  />
                  <div className="ml-3 flex items-center space-x-3">
                    {logo ? (
                      <img src={logo} className="h-8" alt={gateway.displayName} />
                    ) : (
                      <span className="font-medium text-gray-900">{gateway.displayName}</span>
                    )}
                  </div>
                </label>
              );
            })}

            {walletMethod && (
              <label
                className={`flex cursor-pointer items-center rounded-2xl border p-4 transition ${
                  paymentMethod === "wallet"
                    ? "border-[#f6c8a9] bg-[#fff7f1]"
                    : "hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "wallet"}
                  onChange={() => {setPaymentMethod("wallet"); setPaymentGateway("");}}
                  className="h-5 w-5 text-[#f97316]"
                />
                <div className="ml-3 flex items-center space-x-3">
                  <Wallet className="text-gray-600 text-2xl" />
                  <span className="font-medium">{walletMethod.displayName || "Use Commission"}</span>
                </div>
              </label>
            )}

            {manualMethod && (
              <label
                className={`flex cursor-pointer items-start rounded-2xl border p-4 transition ${
                  paymentMethod === "manual"
                    ? "border-[#f6c8a9] bg-[#fff7f1]"
                    : "hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "manual"}
                  onChange={() => {
                    setPaymentMethod("manual");
                    setPaymentGateway("");
                  }}
                  className="mt-1 h-5 w-5 text-[#f97316]"
                />
                <div className="ml-3 w-full">
                  <div className="font-medium text-gray-900">{manualMethod.displayName || "Manual Payment"}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Transfer to any account below and upload your proof here before completing the order.
                  </p>

                  {paymentMethod === "manual" && (
                    <div className="mt-3 space-y-3">
                      {manualPaymentAccounts?.length ? (
                        manualPaymentAccounts.map((account) => (
                          <div key={account.id || `${account.bankName}-${account.accountNumber}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="text-sm font-semibold text-gray-900">{account.bankName}</div>
                            <div className="text-sm text-gray-700">{account.accountName}</div>
                            <div className="text-base font-bold tracking-wide text-gray-900">{account.accountNumber}</div>
                            <div className="text-xs text-gray-500">{account.currency || "NGN"}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-amber-600">
                          Manual payment account details are not available yet.
                        </p>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Transferred To
                          </label>
                          <select
                            value={manualSelectedBankAccountId}
                            onChange={(e) => setManualSelectedBankAccountId(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">Select account</option>
                            {(manualPaymentAccounts || []).map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Transfer Reference
                          </label>
                          <input
                            value={manualPaymentReference}
                            onChange={(e) => setManualPaymentReference(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Enter transfer reference"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Note
                        </label>
                        <textarea
                          value={manualCustomerNote}
                          onChange={(e) => setManualCustomerNote(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                          rows={3}
                          placeholder="Optional payment note"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Proof of Payment
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setManualProofFile(e.target.files?.[0] || null)}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                          required={paymentMethod === "manual"}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Upload the transfer receipt or screenshot before submitting this order.
                        </p>
                        {manualProofFile && (
                          <p className="mt-2 text-sm font-medium text-green-700">
                            Selected file: {manualProofFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            )}

            {voucherMethod && (
              <label
                className={`flex cursor-pointer items-start rounded-2xl border p-4 transition ${
                  paymentMethod === "voucher"
                    ? "border-[#f6c8a9] bg-[#fff7f1]"
                    : "hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "voucher"}
                  onChange={() => {
                    setPaymentMethod("voucher");
                    setPaymentGateway("");
                  }}
                  className="mt-1 h-5 w-5 text-[#f97316]"
                />
                <div className="ml-3 w-full">
                  <div className="font-medium text-gray-900">{voucherMethod.displayName || "Voucher"}</div>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a valid voucher code to complete this purchase with voucher balance.
                  </p>

                  {paymentMethod === "voucher" && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Enter voucher code"
                        />
                        <button
                          type="button"
                          onClick={validateVoucher}
                          disabled={isVoucherChecking || !voucherCode.trim()}
                          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isVoucherChecking ? "Checking..." : "Verify"}
                        </button>
                      </div>

                      {voucherValidation && (
                        <div
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            voucherValidation.isValid
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {voucherValidation.message}
                          {voucherValidation.isValid && (
                            <div className="mt-1 font-medium">
                              Balance: {voucherValidation.currency} {Number(voucherValidation.remainingValue || 0).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
            )}

            {enabledPaymentMethods.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                No payment method is currently available. Please contact support before completing checkout.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`mt-4 hidden w-full rounded-full py-3 md:block transition font-medium ${
              isButtonDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 active:scale-95"
            }`}
          >
            {isLoading ? "Processing..." : "Complete Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
