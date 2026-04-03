'use client';
import endpointsPath from '@/constants/EndpointsPath';
import nigeriaStates from '@/constants/NigeriaStates'; // Import the static data
import formatNumberToCurrency from '@/utils/numberToMoney';
import requestHandler from '@/utils/requestHandler';
import { Wallet, Add, CheckCircle, Edit, Cancel, LocalShipping, Check } from '@mui/icons-material';
import { useEffect, useState, useMemo } from 'react';
import { FiCreditCard, FiDollarSign, FiSend, FiMapPin, FiTruck, FiChevronDown, FiHome, FiNavigation } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppStrings from '@/constants/Strings';
import Spinner from '@/utils/spinner';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import Link from 'next/link';

export default function Addresses() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cartItems, setCartItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editableAddress, setEditableAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0.00);
  const [deliveryFee2, setDeliveryFee2] = useState(0.00); //pickup location delivery fee
  const [isDoorStepDelivery, setIsDoorStepDelivery] = useState(true);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [pickupAddressPhone, setPickupAddressPhone] = useState(null);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [hideAddresses, setHideAddresses] = useState(false);
  const limit = 10;
  const [vat, setVat] = useState(0.00);
  const [isVatAvailable, setIsVatAvailable] = useState(false);

  // Get available cities based on selected state
  const availableCities = useMemo(() => {
    if (!newAddress.state) return [];
    const stateData = nigeriaStates.find(
      (s) => s.name.toLowerCase() === newAddress.state.toLowerCase()
    );
    return stateData ? stateData.subdivision : [];
  }, [newAddress.state]);

  const fetchVats = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.vat}?pageNumber=${page}&pageSize=${limit}`;    
      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        setVat(response.result.data[0].percentage || 7.5);
        setIsVatAvailable(response.result.data[0].isActive || false);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load vat');
    } finally {
      setLoading(false);
    }
  };
 
  const fetchDeliveryFee = async () => {
    setLoading(true);
    try {
      let url = `${endpointsPath.deliveryLocation}/get-by-state-city?State=${selectedAddress?.state}&City=${selectedAddress?.city}`;    
      const response = await requestHandler.get(url, true);
      if (response.statusCode === 200 && response.result?.data) {
        const data = response.result.data;
        setDeliveryFee(data.doorDeliveryAmount || 0);
        setDeliveryFee2(data.pickupDeliveryAmount || 0);
        setPickupAddress(data.pickupAddress);
        setPickupAddressPhone(data.phoneNumber);
      }
    } catch (error) {
      console.error('Delivery fee fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryFee(); 
  }, [selectedAddress, isDoorStepDelivery]);

  useEffect(() => {
    fetchVats(); 
  }, []);

  const fetchUserAddresses = async () => {
    try {
      setLoading(true);
      const resp = await requestHandler.get(`${endpointsPath.userDeliveryAddress}`, true);
      if (resp.statusCode === 200) {
        setIsLoggedIn(true);
        setDeliveryAddresses(resp.result.data || []);
        // Select the primary address by default if available
        const primary = resp.result.data.find(addr => addr.isPrimary);
        setSelectedAddress(primary || resp.result.data[0] || null);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  const resetForm = () => {
    setNewAddress({
      fullName: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria'
    });
    setEditableAddress(null);
    setIsEditing(false);
  };

  const handleAddAddress = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!newAddress.fullName || !newAddress.phoneNumber || !newAddress.address || !newAddress.state || !newAddress.city) {
        toast.error('Please fill all required fields');
        setIsLoading(false);
        return;
      }

      const endpoint = isEditing && editableAddress?.id 
        ? `${endpointsPath.userDeliveryAddress}`
        : endpointsPath.userDeliveryAddress;

      const method = isEditing && editableAddress?.id ? 'POST' : 'POST';

      const response = await requestHandler[method.toLowerCase()](
        endpoint,
        newAddress,
        true
      );

      if (response.statusCode < 202) {
        toast.success(isEditing ? "Address updated successfully" : "Address added successfully");
        await fetchUserAddresses();
        resetForm();
        setShowAddAddress(false);
      } else {
        toast.error(response.result?.message || "Failed to save address");
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(AppStrings.internalServerError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.userDeliveryAddress}/${id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success("Address deleted successfully");
        const updatedAddresses = deliveryAddresses.filter(addr => addr.id !== id);
        setDeliveryAddresses(updatedAddresses);

        if (selectedAddress?.id === id) {
          setSelectedAddress(updatedAddresses[0] || null);
        }
      } else {
        toast.error(response.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Something went wrong");
    }
  };

  const updatePrimaryAddress = async (addressId) => {
    try {
      const response = await requestHandler.put(
        `${endpointsPath.userDeliveryAddress}/${addressId}/set-primary`, 
        {}, 
        true
      );
      if (response.statusCode === 200) {
        await fetchUserAddresses();
        toast.success('Primary address updated');
      }
    } catch (error) {
      console.error('Failed to update primary address:', error);
    }
  };

  // Address Form Component
  const AddAddressForm = () => (
    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <FiHome className="text-blue-600" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? " Edit Address" : " Add New Address"}
          </h3>
        </div>
        {selectedAddress && (
          <button
            onClick={() => {
              setShowAddAddress(false);
              resetForm();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Cancel />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Name and Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="08012345678"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={newAddress.phoneNumber}
              onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="123 Main Street, Apartment 4B"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={newAddress.address}
            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
          />
        </div>

        {/* State and City */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={newAddress.state}
              onChange={(e) => {
                const newState = e.target.value;
                setNewAddress({
                  ...newAddress,
                  state: newState,
                  city: "" // Reset city when state changes
                });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            >
              <option value="">Select State</option>
              {nigeriaStates.map((state, index) => (
                <option key={index} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City / LGA <span className="text-red-500">*</span>
            </label>
            <select
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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

        {/* Country (Auto-filled) */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Country:</span> Nigeria
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={handleAddAddress}
            disabled={!newAddress.fullName || !newAddress.phoneNumber || !newAddress.address || !newAddress.state || !newAddress.city || isLoading}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${!newAddress.fullName || !newAddress.phoneNumber || !newAddress.address || !newAddress.state || !newAddress.city || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Spinner loading={true} size="small" />
                <span className="ml-2">Saving...</span>
              </span>
            ) : isEditing ? (
              "Update Address"
            ) : (
              "Save Address"
            )}
          </button>
          
          <button
            onClick={() => {
              setShowAddAddress(false);
              resetForm();
            }}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Delivery Addresses
          </h1>
        </div>

        {/* Main Address Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <FiNavigation className="text-blue-600" size={20} />
                  </div>
                  Saved Addresses
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Select an address for delivery or add a new one
                </p>
              </div>

            </div>
          </div>

          {/* Address List */}
          {!hideAddresses && (
            <div className="p-6">
              {deliveryAddresses.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {deliveryAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedAddress?.id === address.id
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm"
                      }`}
                      onClick={() => {
                        setSelectedAddress(address);
                        updatePrimaryAddress(address.id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {address.fullName}
                            </h3>
                            {address.isPrimary && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <CheckCircle fontSize="small" className="mr-1" />
                                Primary
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-gray-700 flex items-start">
                              <span className="font-medium text-gray-900 mr-2">📍</span>
                              {address.address}, {address.city}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <span className="font-medium mr-2">State:</span>
                              {address.state}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <span className="font-medium mr-2">Country:</span>
                              {address.country}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <span className="font-medium mr-2">📞</span>
                              {address.phoneNumber}
                            </p>
                          </div>

                          {/* Delivery Fee Info */}
                          {/*selectedAddress?.id === address.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                  <FiTruck className="text-gray-500 mr-2" />
                                  <span className="text-gray-700">Estimated Delivery Fee:</span>
                                </div>
                                <span className="font-bold text-blue-600">
                                  ₦{deliveryFee.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )*/}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditableAddress(address);
                              setNewAddress({
                                ...address,
                                country: address.country || 'Nigeria'
                              });
                              setIsEditing(true);
                              setShowAddAddress(true);
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
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl mb-6 bg-gray-50">
                  <div className="p-4 bg-white rounded-full inline-flex mb-4">
                    <FiMapPin className="text-gray-400" size={36} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No delivery addresses saved
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add your first address to start receiving deliveries. We'll use this for shipping and delivery estimates.
                  </p>
                </div>
              )}

              {/* Add Address Button or Form */}
              {showAddAddress ? (
                AddAddressForm()
              ) : (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddAddress(true);
                  }}
                  className="mt-6 w-full py-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all duration-300 group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                    <Add className="text-blue-600" />
                  </div>
                  <span className="text-blue-600 font-medium group-hover:text-blue-800">
                    Add New Address
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Currently Selected Address Summary */}
          {/*selectedAddress && !hideAddresses && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Check className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Currently Selected Address</h4>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.state}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Ready for Delivery
                </span>
              </div>
            </div>
          )*/}
        </div>

        {/* Delivery Information Card */}
        {/*selectedAddress && !hideAddresses && (
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTruck className="mr-2 text-blue-600" />
              Delivery Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Doorstep Delivery</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  ₦{deliveryFee.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Delivered directly to your address
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Pickup Location</h4>
                <p className="text-2xl font-bold text-gray-600 mb-2">
                  ₦{deliveryFee2.toLocaleString()}
                </p>
                {pickupAddress && (
                  <p className="text-sm text-gray-600">
                    {pickupAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        )*/}

        <Spinner loading={loading} />
      </div>
    </div>
  );
}