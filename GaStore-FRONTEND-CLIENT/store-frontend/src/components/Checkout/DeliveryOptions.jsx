'use client';
import formatNumberToCurrency from '@/utils/numberToMoney';

export default function DeliveryOptions({
  isDoorStepDelivery,
  setIsDoorStepDelivery,
  deliveryFee,
  deliveryFee2,
  pickupAddress
}) {
  return (
    <div className="pt-2">
      <div className="flex justify-between mb-1">
        <span className="text-gray-600">Delivery Method</span>
      </div>
      
      <div className="space-y-2">
        <DeliveryOption
          label="Door Step"
          isSelected={isDoorStepDelivery}
          onSelect={() => setIsDoorStepDelivery(true)}
          price={deliveryFee}
        />
        
        <DeliveryOption
          label="Pickup Location"
          isSelected={!isDoorStepDelivery}
          onSelect={() => setIsDoorStepDelivery(false)}
          price={deliveryFee2}
          isAvailable={!!pickupAddress}
        />
      </div>
    </div>
  );
}

const DeliveryOption = ({ label, isSelected, onSelect, price, isAvailable = true }) => (
  <div 
    onClick={isAvailable ? onSelect : undefined}
    className={`flex justify-between p-3 rounded-md cursor-pointer transition-colors ${
      isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center">
      <span className="text-gray-600">{label}</span>
      {isSelected && (
        <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Selected</span>
      )}
      {!isAvailable && (
        <span className="ml-2 text-xs text-gray-500">Not Available</span>
      )}
    </div>
    {isAvailable && <span className="font-medium">{formatNumberToCurrency(price)}</span>}
  </div>
);