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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
     <div className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <Link 
              href="/cart"
              className="hidden md:flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <Edit className="mr-1" fontSize="small" />
              Edit Cart
            </Link>
    </div>
  </div>
</div>


      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* LEFT: main content */}
          <div className="space-y-6 lg:col-span-2">
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
            
            {selectedAddress != null? <DeliveryMethod
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
            /> : ""}


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
              paymentGateway={paymentGateway}
              setPaymentGateway={setPaymentGateway}
              handlePaymentSubmit={handlePaymentSubmit}
              isLoading={isLoading}
              isCheckoutReady={isCheckoutReady}
            />
          </div>

          {/* RIGHT: summary */}
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
            isCheckoutReady={isCheckoutReady}
          />
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

