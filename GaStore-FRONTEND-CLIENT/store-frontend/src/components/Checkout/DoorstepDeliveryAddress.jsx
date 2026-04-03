"use client";
import { Add, Edit, Cancel, LocalShipping, Check } from "@mui/icons-material";
import { FiMapPin, FiTruck, FiChevronDown } from "react-icons/fi";
import { useState, useEffect, useMemo } from "react";
// Import the static data
import nigeriaStates from '@/constants/NigeriaStates';
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";

export default function DoorstepDeliveryAddress({
  isDoorStepDelivery,
  deliveryAddresses,
  selectedAddress,
  setSelectedAddress,
  states, // inherited props (might not be needed if using static json)
  cities, // inherited props
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
  shippingProviders,
}) {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Initialize selected provider from selectedAddress or newAddress
  useEffect(() => {
    if (selectedAddress?.shippingProvider) {
      setSelectedProvider(selectedAddress.shippingProvider);
    } else if (newAddress?.shippingProvider) {
      setSelectedProvider(newAddress.shippingProvider);
    }
  }, [selectedAddress, newAddress]);

  // Logic to get cities based on selected state from the static JSON
  const availableCities = useMemo(() => {
    if (!newAddress.state) return [];
    const stateData = nigeriaStates.find(
      (s) => s.name.toLowerCase() === newAddress.state.toLowerCase()
    );
    return stateData ? stateData.subdivision : [];
  }, [newAddress.state]);

  const updatePrimaryAddress = async (addressId) => {
    var response = await requestHandler.put(`${endpointsPath.userDeliveryAddress}/${addressId}/set-primary`, {}, true);
    if (response.statusCode === 200) {
      // Successfully updated primary address 
    }else{
      // Handle error
    }
  };

  {/* Add Form */}
  const AddAddressComponent = () => (
    <div className="mt-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isEditingAddress ? "Edit Address" : "Add New Address"}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Name and Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={newAddress.fullName || ''}
            onChange={(e) =>
              setNewAddress({ ...newAddress, fullName: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={newAddress.phoneNumber || ''}
            onChange={(e) =>
              setNewAddress({
                ...newAddress,
                phoneNumber: e.target.value,
              })
            }
          />
        </div>

        {/* Street Address */}
        <input
          type="text"
          placeholder="Street Address"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={newAddress.address || ''}
          onChange={(e) =>
            setNewAddress({ ...newAddress, address: e.target.value })
          }
        />

        {/* State and City - Now Independent of Provider */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={newAddress.state || ""}
              onChange={(e) => {
                const newState = e.target.value;
                setNewAddress({
                  ...newAddress,
                  state: newState,
                  city: "" // Reset city when state changes
                });
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select State</option>
              {nigeriaStates.map((s, i) => (
                <option key={i} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City / LGA <span className="text-red-500">*</span>
            </label>
            <select
              value={newAddress.city || ""}
              onChange={(e) =>
                setNewAddress({ ...newAddress, city: e.target.value })
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={!newAddress.state}
              required
            >
              <option value="">Select City</option>
              {availableCities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shipping Providers Selection - Moved below Address */}
        {/*shippingProviders && shippingProviders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Shipping Provider (Optional):
            </label>

            <div className="flex flex-wrap gap-3">
              {(showAllProviders ? shippingProviders : shippingProviders.slice(0, 4)).map((provider, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedProvider(provider);
                    setNewAddress({
                      ...newAddress,
                      shippingProvider: provider,
                    });
                  }}
                  className={`inline-flex items-center px-4 py-2.5 rounded-lg border-2 transition-all ${selectedProvider === provider
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                >
                  <FiTruck className="mr-2" size={16} />
                  <span>{provider}</span>
                  {selectedProvider === provider && <Check className="ml-2" size={16} />}
                </button>
              ))}

              {shippingProviders.length > 4 && (
                <button
                  onClick={() => setShowAllProviders(!showAllProviders)}
                  className="inline-flex items-center px-4 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                >
                  <FiChevronDown className={`mr-2 transition-transform ${showAllProviders ? 'rotate-180' : ''}`} />
                  {showAllProviders ? 'Show Less' : `+${shippingProviders.length - 4} more`}
                </button>
              )}
            </div>
            
            {!selectedProvider && (
                 <p className="text-xs text-gray-500 mt-2">
                 You can select a provider now or later during checkout.
               </p>
            )}
          </div>
        )*/}

        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleAddAddress}
            // Logic updated: Allow save if basic details are there, regardless of provider
            disabled={!newAddress.fullName || !newAddress.phoneNumber || !newAddress.address || !newAddress.state || !newAddress.city}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${!newAddress.fullName || !newAddress.phoneNumber || !newAddress.address || !newAddress.state || !newAddress.city
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            {isEditingAddress ? "Update Address" : "Save Address"}
          </button>
          {selectedAddress && (
            <button
              onClick={() => {
                setShowAddAddress(false);
                setSelectedProvider("");
                setIsEditingAddress(false);
              }}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // if (!isDoorStepDelivery) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">

      {/*If address is null, ask to fill address first*/}
      {!selectedAddress &&
        AddAddressComponent()
      }
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiMapPin className="mr-3 text-blue-600" />
              Address
            </h2>
          </div>

          <button
            onClick={() => setHideAddresses(!hideAddresses)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap ml-4"
          >
            {hideAddresses ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {!hideAddresses && (
        <div className="p-6">
          {/* Address List */}
          {deliveryAddresses.length > 0 ? (
            <div className="space-y-4 mb-6">
              {deliveryAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddress?.id === address.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => {
                    setSelectedAddress(address);
                    updatePrimaryAddress(address.id);
                    if (address.shippingProvider) {
                      setSelectedProvider(address.shippingProvider);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {address.fullName}
                        </h3>
                        {address.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">
                        {address.address}, {address.city}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.state}, {address.country}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.phoneNumber}
                      </p>

                      {/* Shipping provider for this address */}
                      {address.shippingProvider && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <FiTruck className="text-gray-400" size={14} />
                            <span className="font-medium text-gray-700">Preferred Provider:</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {address.shippingProvider}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewAddress(address);
                          setSelectedProvider(address.shippingProvider || "");
                          setShowAddAddress(true);
                          setIsEditingAddress(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit address"
                      >
                        <Edit fontSize="small" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete address"
                      >
                        <Cancel fontSize="small" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-gray-300 rounded-xl mb-6">
              <FiMapPin className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-gray-500 mb-2">No delivery addresses saved.</p>
              <p className="text-sm text-gray-400">
                Add an address to save your delivery preferences
              </p>
            </div>
          )}

          {showAddAddress &&
            AddAddressComponent()
          }

          {!showAddAddress && (
            <button
              onClick={() => {
                if (selectedAddress?.shippingProvider) {
                  setSelectedProvider(selectedAddress.shippingProvider);
                }
                setShowAddAddress(true);
              }}
              className="mt-4 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all"
            >
              <Add className="mr-2" /> Add New Address
            </button>
          )}
        </div>
      )}
    </div>
  );
}