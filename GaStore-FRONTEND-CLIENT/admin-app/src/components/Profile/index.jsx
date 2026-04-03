import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import formatNumberToCurrency from '../../utils/numberToMoney';
import ReferralsList from './referrals';
import statesList from '../../constants/States'; // Import the states list

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // State data for dropdowns
  const [selectedState, setSelectedState] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    dateOfBirth: '',
    gender: '',
  });

  const [formData2, setFormData2] = useState({
    file: ''
  });

  const [wallet, setWallet] = useState({});

  // Initialize form data when profile is loaded
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await requestHandler.get(
          `${endpointsPath.profile}/${userId}`,
          true
        );

        if (response.statusCode === 200 && response.result?.data) {
          const userData = response.result.data;
          setProfile(userData);
          setFormData(userData);
          
          // Set state and city selections
          if (userData.state) {
            setSelectedState(userData.state);
            // Find cities for the selected state
            const stateObj = statesList.find(s => s.name === userData.state);
            if (stateObj) {
              setAvailableCities(stateObj.subdivision || []);
            }
          }
          if (userData.city) {
            setSelectedCity(userData.city);
          }
        } else {
          throw new Error(response.result.message || 'Failed to fetch profile');
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        toast.error(error.message || 'Failed to load user profile');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    const fetchWallet = async () => {
      try {
        const response = await requestHandler.get(
          `${endpointsPath.wallet}/${userId}`,
          true
        );

        if (response.statusCode === 200 && response.result?.data) {
          setWallet(response.result.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      }
    };

    fetchProfile();
    fetchWallet();
  }, [userId, navigate]);

  // Handle state selection change
  const handleStateChange = (e) => {
    const stateName = e.target.value;
    setSelectedState(stateName);
    
    // Update form data
    setFormData(prev => ({ ...prev, state: stateName, city: '' }));
    setSelectedCity('');
    
    // Update available cities
    if (stateName) {
      const stateObj = statesList.find(s => s.name === stateName);
      setAvailableCities(stateObj?.subdivision || []);
    } else {
      setAvailableCities([]);
    }
  };

  // Handle city selection change
  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setFormData(prev => ({ ...prev, city: cityName }));
  };

  // Handle other input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await requestHandler.post(
        `${endpointsPath.profile}/${userId}`,
        formData,
        true
      );

      // Upload profile picture if selected
      if (formData2.file) {
        const form = new FormData();
        form.append('file', formData2.file);
        await requestHandler.postForm(
          `${endpointsPath.profile}/${userId}/upload-profile-picture`,
          form,
          true
        );
      }

      if (response.statusCode === 200) {
        toast.success('Profile updated successfully');
        setProfile(response.result.data);
        setEditMode(false);
      } else {
        throw new Error(response.result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData2((prev) => ({
          ...prev,
          file: file,
        }));
        setProfilePicturePreview(reader.result)
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10 text-gray-500">
        User profile not found
      </div>
    );
  }

  // Info row component for display mode
  const InfoRow = ({ label, value }) => (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {editMode ? 'Edit Profile' : 'User Profile'}
          </h1>
          <button
            onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              editMode 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
          
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile Preview"
                      className="h-20 w-20 rounded-full object-cover mb-2 border border-gray-300"
                    />
                  ) : profile?.profilePictureUrl ? (
                    <img
                      src={profile.profilePictureUrl}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover mb-2 border border-gray-300"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500 mb-2">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </div>
                  )}
                  <input
                    type="file"
                    name="profilePicture"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:rounded-md file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark"
                  />
                </div>
          
                {[
                  { label: "First Name", name: "firstName", type: "text", required: true },
                  { label: "Last Name", name: "lastName", type: "text", required: true },
                  { label: "Middle Name", name: "middleName", type: "text" },
                  { label: "Email", name: "email", type: "email", disabled: true, required: true },
                  { label: "Date of Birth", name: "dateOfBirth", type: "date" },
                ].map(({ label, ...inputProps }) => (
                  <div key={inputProps.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      {...inputProps}
                      value={formData[inputProps.name]}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
          
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
        
              {/* Contact Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Contact Information</h2>
                {["phoneNumber", "address"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field === "phoneNumber" ? "Phone Number" : "Address"}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
        
              {/* Location Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700">Location</h2>
                
                {/* Country */}
                {/*<div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>*/}
                
                {/* State Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={selectedState}
                    onChange={handleStateChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Select State</option>
                    {statesList.map((state) => (
                      <option key={state.code} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* City Dropdown (depends on state) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    name="city"
                    value={selectedCity}
                    onChange={handleCityChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    disabled={!selectedState}
                  >
                    <option value="">{selectedState ? "Select City" : "Select State first"}</option>
                    {availableCities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {!selectedState && (
                    <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                  )}
                </div>
              </div>
            </div>
        
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center space-x-4 mb-4">
                  {profile.profilePictureUrl ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover border border-gray-300"
                      src={profile.profilePictureUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-500">
                      {profile.firstName?.charAt(0)}
                      {profile.lastName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    {profile.middleName && (
                      <p className="text-sm text-gray-500">{profile.middleName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow
                    label="Date of Birth"
                    value={
                      profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : 'N/A'
                    }
                  />
                  <InfoRow label="Gender" value={profile.gender || 'N/A'} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <InfoRow label="Phone Number" value={profile.phoneNumber || 'N/A'} />
                  <InfoRow label="Address" value={profile.address || 'N/A'} />
                </div>
              </div>

              {/* Location Info */}
              <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Location</h2>
                <div className="space-y-3">
                  <InfoRow label="City" value={profile.city || 'N/A'} />
                  <InfoRow label="State/Province" value={profile.state || 'N/A'} />
                  <InfoRow label="Country" value={profile.country || 'N/A'} />
                </div>
              </div>

              {/* Wallet Info */}
              <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Wallet Information</h2>
                <div className="space-y-3">
                  {/*<InfoRow label="Balance" value={formatNumberToCurrency(wallet.balance) || '0.00'} />*/}
                  <InfoRow label="Commission" value={formatNumberToCurrency(wallet.commission) || '0.00'} />
                  <InfoRow label="Commission Used" value={formatNumberToCurrency(wallet.withdrawn) || '0.00'} />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <ReferralsList userId={userId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileView;