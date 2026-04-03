'use client';
import { useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { Add } from '@mui/icons-material';
import AddressForm from './AddressForm';

export default function AddressSection({ deliveryAddresses, selectedAddress, setSelectedAddress, fetchUserAddresses }) {
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editableAddress, setEditableAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleDeleteAddress = async (id) => {
    // Implementation
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FiMapPin className="mr-2" /> Delivery Address
      </h2>
      
      {deliveryAddresses.length > 0 ? (
        <div className="space-y-3">
          {deliveryAddresses.map(address => (
            <AddressCard
              key={address.id}
              address={address}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              setEditableAddress={setEditableAddress}
              setIsEditing={setIsEditing}
              setShowAddAddress={setShowAddAddress}
              handleDeleteAddress={handleDeleteAddress}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No delivery addresses saved</p>
      )}

      {showAddAddress && (
        <AddressForm
          editableAddress={editableAddress}
          isEditing={isEditing}
          setShowAddAddress={setShowAddAddress}
          setEditableAddress={setEditableAddress}
          setIsEditing={setIsEditing}
          fetchUserAddresses={fetchUserAddresses}
          setSelectedAddress={setSelectedAddress}
        />
      )}

      {!showAddAddress && (
        <button
          onClick={() => setShowAddAddress(true)}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Add fontSize="small" className="mr-1" /> Add New Address
        </button>
      )}
    </div>
  );
}

const AddressCard = ({ address, selectedAddress, setSelectedAddress, setEditableAddress, setIsEditing, setShowAddAddress, handleDeleteAddress }) => (
  <div 
    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
      selectedAddress?.id === address.id ? 'border-blue-500 bg-blue-50' : ''
    }`}
    onClick={() => setSelectedAddress(address)}
  >
    <div className="flex justify-between">
      <h3 className="font-medium">{address.fullName}</h3>
    </div>
    <div className="flex justify-between">
      <h3 className="font-medium">{address.address}, {address.city}</h3>
      {address.isPrimary && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
      )}
    </div>
    <p className="text-sm text-gray-600 mt-1">{address.state}, {address.country}</p>
    <p className="text-sm text-gray-600">{address.phoneNumber}</p>
    <div className="flex justify-between mt-2 text-sm">
      <div className="space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditableAddress(address);
            setIsEditing(true);
            setShowAddAddress(true);
          }}
          className="text-blue-600 hover:underline"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAddress(address.id);
          }}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);