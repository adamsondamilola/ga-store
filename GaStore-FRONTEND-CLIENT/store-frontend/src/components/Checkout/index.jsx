'use client';

import { useCheckout } from '../../hooks/useCheckout';
import OrderItems from './OrderItems';
import DeliveryMethod from './DeliveryMethod';
import DoorstepDeliveryAddress from './DoorstepDeliveryAddress';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';
import PickupModal from './PickupModal';
import Link from 'next/link';
import { Edit } from '@mui/icons-material';
import { FiCheckCircle, FiChevronRight, FiMapPin, FiPackage, FiShield, FiTruck } from 'react-icons/fi';

export default function CheckoutPage() {
  const {
    cartItems,
    isDoorStepDelivery,
    hasDoorStepDeliveryOption,
    setIsDoorStepDelivery,
    deliveryFee,
    deliveryFee2,
    pickupAddress,
    pickupAddressPhone,
    shippingProvider,
    shippingCity,
    selectedAddress,
    setSelectedAddress,
    deliveryAddresses,
    states,
    cities,
    locations,
    showAddAddress,
    setShowAddAddress,
    isEditing,
    editableAddress,
    newAddress,
    setNewAddress,
    handleAddAddress,
    handleDeleteAddress,
    hideAddresses,
    setHideAddresses,
    isPickupModalOpen,
    setIsPickupModalOpen,
    deliveryLocations,
    handlePickupSelect,
    totalCartWeightKg,
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
    subtotal,
    tax,
    vat,
    vatPer,
    shippingFee,
    total,
    discountedSubtotal,
    totalAfterDiscountCalc,
    couponCode,
    setCouponCode,
    discountPercentage,
    subTotalAfterDiscount,
    setSubTotalAfterDiscount,
    setTotalAfterDiscount,
    isApplyingCoupon,
    isCouponSuccessful,
    setIsCouponSuccessful,
    applyCoupon,
    isLoading,
    deliveryMethodSelected,
    setDeliveryMethodSelected,
  } = useCheckout();

  const isCheckoutReady =
  deliveryMethodSelected &&
  (
    (isDoorStepDelivery === true && selectedAddress) ||
    (isDoorStepDelivery === false && pickupAddress)
  ) &&
  shippingFee > 0 &&
  cartItems.length > 0;

  const shippingProviders = [...new Set(
  deliveryLocations
    ?.filter(loc => loc?.shippingProvider && loc?.isActive)
    .map(loc => loc.shippingProvider)
    .filter(Boolean)
)] || [];

  const checkoutSteps = [
    {
      title: 'Review items',
      description: `${cartItems.length} item${cartItems.length === 1 ? '' : 's'} ready`,
      icon: FiPackage,
      complete: cartItems.length > 0
    },
    {
      title: 'Choose delivery',
      description: deliveryMethodSelected ? 'Delivery method selected' : 'Select how you want to receive it',
      icon: FiTruck,
      complete: deliveryMethodSelected
    },
    {
      title: 'Confirm address',
      description: selectedAddress ? 'Address confirmed' : 'Add or select an address',
      icon: FiMapPin,
      complete: Boolean(selectedAddress)
    },
    {
      title: 'Payment',
      description: paymentMethod ? 'Payment option selected' : 'Choose a payment option',
      icon: FiShield,
      complete: Boolean(paymentMethod)
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f3ee] pb-24 md:pb-0">
      <div className="border-b border-[#eadfce] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f97316]">Secure Checkout</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 sm:text-[2.4rem]">
                Almost there, let&apos;s complete your order
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-[15px]">
                We&apos;ve organized your checkout into simple steps so it feels clear, trustworthy, and easy to finish on any device.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cart"
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                <Edit className="mr-2" fontSize="small" />
                Edit Cart
              </Link>
              <div className="inline-flex items-center rounded-full bg-[#fff2e8] px-4 py-2.5 text-sm font-semibold text-[#c2410c]">
                <FiCheckCircle className="mr-2" />
                Protected checkout
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {checkoutSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    step.complete
                      ? 'border-[#f6c8a9] bg-[#fff7f1]'
                      : 'border-gray-200 bg-[#faf9f6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        step.complete ? 'bg-[#f97316] text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200'
                      }`}
                    >
                      <Icon className="text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          {/* LEFT: main content */}
          <div className="space-y-6">
            <OrderItems cartItems={cartItems} />

            <DoorstepDeliveryAddress
              isDoorStepDelivery={isDoorStepDelivery}
              deliveryAddresses={deliveryAddresses}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              states={states}
              cities={cities}
              locations={locations}
              showAddAddress={showAddAddress}
              setShowAddAddress={setShowAddAddress}
              isEditing={isEditing}
              editableAddress={editableAddress}
              newAddress={newAddress}
              setNewAddress={setNewAddress}
              handleAddAddress={handleAddAddress}
              handleDeleteAddress={handleDeleteAddress}
              hideAddresses={hideAddresses}
              setHideAddresses={setHideAddresses}
              shippingProviders={shippingProviders}
            />
            
            {selectedAddress != null ? (
              <DeliveryMethod
                isDoorStepDelivery={isDoorStepDelivery}
                hasDoorStepDeliveryOption={hasDoorStepDeliveryOption}
                setIsDoorStepDelivery={setIsDoorStepDelivery}
                deliveryFee={deliveryFee}
                deliveryFee2={deliveryFee2}
                pickupAddress={pickupAddress}
                pickupAddressPhone={pickupAddressPhone}
                shippingProvider={shippingProvider}
                shippingCity={shippingCity}
                setIsPickupModalOpen={setIsPickupModalOpen}
                deliveryMethodSelected={deliveryMethodSelected}
                setDeliveryMethodSelected={setDeliveryMethodSelected}   
                selectedAddress={selectedAddress}
              />
            ) : ""}


            <PaymentMethod
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentMethods={paymentMethods}
              manualPaymentAccounts={manualPaymentAccounts}
              manualProofFile={manualProofFile}
              setManualProofFile={setManualProofFile}
              manualSelectedBankAccountId={manualSelectedBankAccountId}
              setManualSelectedBankAccountId={setManualSelectedBankAccountId}
              manualPaymentReference={manualPaymentReference}
              setManualPaymentReference={setManualPaymentReference}
              manualCustomerNote={manualCustomerNote}
              setManualCustomerNote={setManualCustomerNote}
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              voucherValidation={voucherValidation}
              isVoucherChecking={isVoucherChecking}
              validateVoucher={validateVoucher}
              paymentGateway={paymentGateway}
              setPaymentGateway={setPaymentGateway}
              handlePaymentSubmit={handlePaymentSubmit}
              isLoading={isLoading}
              isCheckoutReady={isCheckoutReady}
            />
          </div>

          {/* RIGHT: summary */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[24px] border border-[#f0dccf] bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff2e8] text-[#f97316]">
                  <FiShield className="text-lg" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Why customers feel safe here</h2>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <FiChevronRight className="text-[#f97316]" />
                      Your delivery and payment steps stay visible while you complete checkout
                    </p>
                    <p className="flex items-center gap-2">
                      <FiChevronRight className="text-[#f97316]" />
                      Order total updates clearly before you place your order
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <OrderSummary
              subtotal={subtotal}
              discountPercentage={discountPercentage}
              shippingFee={shippingFee}
              tax={tax}
              vat={vat}
              totalAfterDiscountCalc={totalAfterDiscountCalc}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              isApplyingCoupon={isApplyingCoupon}
              isCouponSuccessful={isCouponSuccessful}
              applyCoupon={applyCoupon}
              isLoading={isLoading}
              handlePaymentSubmit={handlePaymentSubmit}
              isDoorStepDelivery={isDoorStepDelivery}
              deliveryMethodSelected={deliveryMethodSelected}
              paymentMethod={paymentMethod}
              paymentGateway={paymentGateway}
              paymentMethods={paymentMethods}
              manualProofFile={manualProofFile}
              voucherCode={voucherCode}
              isCheckoutReady={isCheckoutReady}
            />
          </div>
        </div>
      </div>

      {/* Pickup modal */}
      {isPickupModalOpen && (
        <PickupModal 
          selectedAddress={selectedAddress}
          deliveryLocations={deliveryLocations}
          handlePickupSelect={handlePickupSelect}
          totalCartWeightKg={totalCartWeightKg}
          setIsPickupModalOpen={setIsPickupModalOpen}
          isDoorStepDelivery={isDoorStepDelivery}
        />
      )}
    </div>
  );
}

