"use client";
import { FiTruck } from "react-icons/fi";
import { Check, LocationOn } from "@mui/icons-material";
import { useEffect } from "react";

export default function DeliveryMethod({
  isDoorStepDelivery,
  setIsDoorStepDelivery,
  hasDoorStepDeliveryOption,
  deliveryFee,
  deliveryFee2,
  pickupAddress,
  pickupAddressPhone,
  shippingProvider,
  shippingCity,
  setIsPickupModalOpen,
  deliveryMethodSelected,
  setDeliveryMethodSelected,
  selectedAddress,
}) {
  const handleSelectPickup = () => {
    if (selectedAddress && !selectedAddress.deliveryLocationId) {
      setIsDoorStepDelivery(false);
      setIsPickupModalOpen(true);
    } else {
      setIsDoorStepDelivery(false);
      setDeliveryMethodSelected(true);
    }
  };

  const handleSelectDoorstep = () => {
    if (selectedAddress && !selectedAddress.deliveryLocationId) {
      setIsDoorStepDelivery(true);
      setIsPickupModalOpen(true);
    } else {
      setIsDoorStepDelivery(true);
      setDeliveryMethodSelected(true);
    }
  };

  useEffect(() => {
    if (deliveryFee > 0 || deliveryFee2 > 0) {
      setDeliveryMethodSelected(true);
    }
  }, [deliveryFee, deliveryFee2, setDeliveryMethodSelected]);


  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#fcfbf8] p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-2 flex items-center text-xl font-semibold text-gray-900">
              <FiTruck className="mr-3 text-[#f97316]" />
              Select Delivery Method
            </h2>
            <p className="text-sm text-gray-500">
              Pick the delivery option that works best for this order and location.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleSelectPickup}
            className={`p-6 rounded-xl border-2 transition-all ${
              deliveryMethodSelected && !isDoorStepDelivery && deliveryFee2 > 0
                ? "border-[#f6c8a9] bg-[#fff7f1] shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-lg ${
                  deliveryMethodSelected && !isDoorStepDelivery && deliveryFee2 > 0
                    ? "bg-[#f97316] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <LocationOn className="text-xl" />
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Pickup Delivery</h3>
                <p className="text-sm text-gray-600 mt-1">Collect from station</p>

                {deliveryFee2 > 0 && !isDoorStepDelivery && (
                  <p className="font-semibold text-gray-900 mt-2">
                    NGN {deliveryFee2.toLocaleString()}
                  </p>
                )}
              </div>

              {deliveryMethodSelected && !isDoorStepDelivery && deliveryFee2 > 0 && (
                <Check className="ml-auto text-[#f97316]" />
              )}
            </div>
          </button>

          {hasDoorStepDeliveryOption && (
            <button
              onClick={handleSelectDoorstep}
              className={`p-6 rounded-xl border-2 transition-all ${
                deliveryMethodSelected && isDoorStepDelivery
                  ? "border-[#f6c8a9] bg-[#fff7f1] shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-lg ${
                    deliveryMethodSelected && isDoorStepDelivery
                      ? "bg-[#f97316] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <FiTruck className="text-xl" />
                </div>

                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Doorstep Delivery</h3>
                  <p className="text-sm text-gray-600 mt-1">Delivered to your address</p>

                  {deliveryFee > 0 && isDoorStepDelivery && (
                    <p className="font-semibold text-gray-900 mt-2">
                      NGN {deliveryFee.toLocaleString()}
                    </p>
                  )}
                </div>

                {deliveryFee > 0 && deliveryMethodSelected && isDoorStepDelivery && (
                  <Check className="ml-auto text-[#f97316]" />
                )}
              </div>
            </button>
          )}
        </div>

        {deliveryMethodSelected && !isDoorStepDelivery && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-900 mb-2">Pickup Location</h4>

            {pickupAddress ? (
              <div className="space-y-3">
                <div className="text-green-800">
                  <p className="font-medium whitespace-pre-line">
                    {shippingProvider
                      ? `${shippingProvider} - ${shippingCity}\n${pickupAddress}`
                      : pickupAddress}
                  </p>

                  {pickupAddressPhone && <p className="mt-1">Phone: {pickupAddressPhone}</p>}
                </div>

                <button
                  onClick={() => setIsPickupModalOpen(true)}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  Update Selection
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPickupModalOpen(true)}
                className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 transition text-green-700 font-medium"
              >
                Select Pickup Location
              </button>
            )}
          </div>
        )}

        {deliveryMethodSelected && isDoorStepDelivery && hasDoorStepDeliveryOption && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Delivery Address</h4>
            {selectedAddress && shippingProvider && deliveryFee > 0 ? (
              <div className="text-blue-800">
                {shippingCity && shippingProvider && <p>{shippingProvider} - {shippingCity}</p>}
                <p className="font-medium">{selectedAddress.fullName}</p>
                <p>{selectedAddress.address}, {selectedAddress.city}</p>
                <p>{selectedAddress.state}, {selectedAddress.country}</p>
                <p className="mt-2">Phone: {selectedAddress.phoneNumber}</p>
                <button
                  onClick={() => setIsPickupModalOpen(true)}
                  className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  Update Selection
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPickupModalOpen(true)}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 transition text-blue-700 font-medium"
              >
                Setup Home Delivery
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


