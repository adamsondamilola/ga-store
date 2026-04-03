'use client';
import formatNumberToCurrency from '@/utils/numberToMoney';
import DeliveryOptions from './DeliveryOptions';

export default function OrderTotal({
  subtotal,
  deliveryFee,
  deliveryFee2,
  isDoorStepDelivery,
  setIsDoorStepDelivery,
  vat,
  tax,
  total,
  selectedAddress,
  pickupAddress,
  pickupAddressPhone
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatNumberToCurrency(subtotal)}</span>
        </div>
        
        <DeliveryOptions
          isDoorStepDelivery={isDoorStepDelivery}
          setIsDoorStepDelivery={setIsDoorStepDelivery}
          deliveryFee={deliveryFee}
          deliveryFee2={deliveryFee2}
          pickupAddress={pickupAddress}
        />
        
        <div className="flex justify-between pt-2">
          <span className="text-gray-600">Tax ({vat}%)</span>
          <span className="font-medium">{formatNumberToCurrency(tax)}</span>
        </div>
        
        <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-blue-600">{formatNumberToCurrency(total)}</span>
        </div>

        {selectedAddress && (
          <AddressDisplay
            selectedAddress={selectedAddress}
            isDoorStepDelivery={isDoorStepDelivery}
            pickupAddress={pickupAddress}
            pickupAddressPhone={pickupAddressPhone}
          />
        )}
      </div>
    </div>
  );
}

const AddressDisplay = ({ selectedAddress, isDoorStepDelivery, pickupAddress, pickupAddressPhone }) => (
  <div className="mt-4 pt-4 border-t">
    <h3 className="font-medium mb-2">Delivery Address</h3>
    <div className="text-sm bg-gray-50 p-3 rounded-md">
      <p className="font-medium">{selectedAddress.name}</p>
      <p>{isDoorStepDelivery ? selectedAddress.address : pickupAddress}, {selectedAddress.city}</p>
      <p>{selectedAddress.state}, {selectedAddress.country}</p>
      <p className="mt-1">Phone: {selectedAddress.phoneNumber}</p>
      {!isDoorStepDelivery && (
        <p className="mt-1">Location Contact: <a href={`tel:${pickupAddressPhone}`}>{pickupAddressPhone}</a></p>
      )}
    </div>
  </div>
);