'use client';
import { useState, useEffect } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import toast from 'react-hot-toast';
import AppStrings from '@/constants/Strings';

export default function AddressForm({
  editableAddress,
  isEditing,
  setShowAddAddress,
  setEditableAddress,
  setIsEditing,
  fetchUserAddresses,
  setSelectedAddress
}) {
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (editableAddress) {
      setNewAddress(editableAddress);
    }
    fetchLocations();
  }, [editableAddress]);

  const fetchLocations = async () => {
    try {
      const response = await requestHandler.get(
        `${endpointsPath.deliveryLocation}?pageNumber=1&pageSize=100`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setLocations(response.result.data);
        const uniqueStates = [...new Set(response.result.data.map(location => location.state))];
        const allCities = response.result.data.map(location => location.city);
        setStates(uniqueStates);
        setCities(allCities);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load delivery locations');
    }
  };

  const handleAddAddress = async () => {
    setIsLoading(true);
    try {
      if (isEditing && editableAddress) {
        const response = await requestHandler.post(
          `${endpointsPath.userDeliveryAddress}`,
          newAddress,
          true
        );
        if (response.statusCode < 202) {
          fetchUserAddresses();
          toast.success("Address updated successfully");
          setSelectedAddress(response.result.data);
        } else {
          toast.error(response.result.message || "Failed to update address");
        }
      } else {
        const response = await requestHandler.post(
          endpointsPath.userDeliveryAddress,
          newAddress,
          true
        );
        if (response.statusCode < 202) {
          fetchUserAddresses();
          toast.success(response.result.message);
          setSelectedAddress(response.result.data);
        } else {
          toast.error(response.result.message || 'Something went wrong');
        }
      }
      setShowAddAddress(false);
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
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error(AppStrings.internalServerError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <input
        type="text"
        placeholder="Full Name"
        className="w-full p-2 border rounded"
        value={newAddress.fullName}
        onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
      />
      <input
        type="text"
        placeholder="Phone Number"
        className="w-full p-2 border rounded"
        value={newAddress.phoneNumber}
        onChange={(e) => setNewAddress({...newAddress, phoneNumber: e.target.value})}
      />
      <input
        type="text"
        placeholder="Address"
        className="w-full p-2 border rounded"
        value={newAddress.address}
        onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={newAddress.state}
          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select a state</option>
          {states.map((state, index) => (
            <option key={index} value={state}>{state}</option>
          ))}
        </select>
        
        {newAddress.state ? (
          <select
            value={newAddress.city}
            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="">Select City</option>
            {cities
              .filter(city => 
                locations.some(loc => 
                  loc.state === newAddress.state && loc.city === city
                )
              )
              .map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Select state first"
            className="w-full p-2 border rounded bg-gray-100"
            disabled
          />
        )}
      </div>

      {isEditing && (
        <p className="text-sm text-gray-500">
          Editing: {editableAddress?.address}, {editableAddress?.city}
        </p>
      )}

      <div className="flex space-x-2">
        <button
          onClick={handleAddAddress}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Address'}
        </button>
        <button
          onClick={() => {
            setShowAddAddress(false);
            setEditableAddress(null);
            setIsEditing(false);
          }}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}