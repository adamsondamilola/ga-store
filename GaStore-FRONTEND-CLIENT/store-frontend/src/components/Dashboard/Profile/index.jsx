"use client"
import React, { useState, useEffect } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import formatNumberToCurrency from '@/utils/numberToMoney';
import toast from 'react-hot-toast';
import { FiClipboard, FiGlobe, FiMapPin, FiUser } from 'react-icons/fi';
import { ArrowDownward, ArrowLeft, BuildOutlined, CalendarToday, CameraAlt, Cancel, Check, Email, Home, Link, LocationOn, Phone, PhoneAndroid, Scale, Share, SupervisedUserCircle } from '@mui/icons-material';
import AppStrings from '@/constants/Strings';
import nigeriaStates from '@/constants/NigeriaStates';
import { DashboardPageShell, DashboardPanel } from '../PageShell';


const UserProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  
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
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);
  const [username, setUsername] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const loggedInUser = async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user-details`, true);
      if(resp.statusCode === 200){
        setUserId(resp.result.data?.id);
        setEmail(resp.result.data?.email);
        setFirstName(resp.result.data?.firstName);
        setLastName(resp.result.data?.lastName);
        setUsername(resp.result.data?.username);
        setFormData(prev => ({ ...prev, ['email']: resp.result.data?.email }));
      }
    }
    loggedInUser();
  }, []);

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
            const stateObj = nigeriaStates.find(s => s.name === userData.state);
            if (stateObj) {
              setAvailableCities(stateObj.subdivision || []);
            }
          }
          if (userData.city) {
            setSelectedCity(userData.city);
          }
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        toast.error(error.message || 'Failed to load user profile');
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
    
    if(!userId) return;

    fetchProfile();
    fetchWallet();
  }, [userId]);

  // Handle state selection change
  const handleStateChange = (e) => {
    const stateName = e.target.value;
    setSelectedState(stateName);
    
    // Update form data
    setFormData(prev => ({ ...prev, state: stateName, city: '' }));
    setSelectedCity('');
    
    // Update available cities
    if (stateName) {
      const stateObj = nigeriaStates.find(s => s.name === stateName);
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

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${username}/invite`;
  const inviteMessage = `Join me on ${AppStrings.title}! ${inviteUrl}`;
  const toggleShare = () => setIsShareOpen(!isShareOpen);
  
  const shareInvite = (method) => {
    switch(method) {
      case 'copy':
        navigator.clipboard.writeText(inviteUrl);
        alert('Invite link copied to clipboard!');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Join me on this platform!')}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Join me!&body=${encodeURIComponent(inviteMessage)}`, '_blank');
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: 'Join me!',
            text: inviteMessage,
            url: inviteUrl,
          });
        }
    }
    setIsShareOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await requestHandler.post(
        `${endpointsPath.profile}`,
        formData,
        true
      );

      // Upload profile picture
      if(formData2.file !== "") {
        const form = new FormData();
        form.append('file', formData2.file);
        await requestHandler.postForm(
          `${endpointsPath.profile}/upload-profile-picture`,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const InfoRow = ({ 
    label, 
    value, 
    icon = null,
    valueClass = "",
    labelClass = "",
    className = "",
    truncate = false,
    copyable = false,
    onClick = null
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
      e.stopPropagation();
      if (!value) return;
      navigator.clipboard.writeText(value.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div 
        className={`flex items-start justify-between gap-2 py-1.5 ${className} ${
          onClick ? "cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2" : ""
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="flex-shrink-0 text-gray-400">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h3 className={`text-sm font-medium text-gray-500 ${labelClass}`}>
              {label}
            </h3>
            <p 
              className={`text-sm text-gray-900 mt-0.5 ${valueClass} ${
                truncate ? "truncate" : ""
              }`}
              title={typeof value === 'string' ? value : undefined}
            >
              {value || '—'}
            </p>
          </div>
        </div>
        
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={copied ? "Copied!" : "Copy to clipboard"}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <FiClipboard className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  };
  
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData2((prev) => ({
          ...prev,
          file: file,
        }));
        setProfilePicturePreview(reader.result);
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

  return (
    <DashboardPageShell
      eyebrow="Account"
      title={editMode ? "Edit Profile" : "My Account"}
      description="Manage your personal details, contact information, and referral link."
      actions={
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
            editMode 
              ? 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
              : 'bg-gray-950 text-white hover:bg-black'
          }`}
          aria-label={editMode ? 'Cancel editing' : 'Edit profile'}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </button>
      }
    >
      <DashboardPanel className="max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div />
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                
                {/* Profile Picture Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile Preview"
                          className="h-20 w-20 rounded-full object-cover border-2 border-white shadow"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                          {formData.firstName?.[0]}{formData.lastName?.[0]}
                        </div>
                      )}
                      <label 
                        htmlFor="profile-upload"
                        className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        title="Change photo"
                      >
                        <CameraAlt className="h-4 w-4 text-gray-600" />
                        <input
                          id="profile-upload"
                          type="file"
                          name="profilePicture"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>JPG, GIF or PNG.</p>
                      <p>Max size of 2MB</p>
                    </div>
                  </div>
                </div>

                {[
                  { label: "First Name", name: "firstName", type: "text", required: true },
                  { label: "Last Name", name: "lastName", type: "text", required: true },
                  { label: "Middle Name", name: "middleName", type: "text" },
                  { label: "Email", name: "email", type: "email", disabled: true, required: true },
                  { label: "Date of Birth", name: "dateOfBirth", type: "date" },
                ].map(({ label, ...inputProps }) => (
                  <div key={inputProps.name} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {label}
                      {inputProps.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      {...inputProps}
                      value={formData[inputProps.name] || ''}
                      onChange={handleInputChange}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ${
                        inputProps.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">Contact Information</h2>
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                
                {[
                  { label: "Phone Number", name: "phoneNumber", type: "tel" },
                  { label: "Address", name: "address", type: "text" },
                ].map(({ label, name, type }) => (
                  <div key={name} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={formData[name] || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Location Info */}
              <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">Location</h2>
                  <LocationOn className="h-5 w-5 text-gray-400" />
                </div>
                
                {/* Country */}
                {/*<div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>*/}
                
                {/* State Dropdown */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <select
                    name="state"
                    value={selectedState}
                    onChange={handleStateChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {nigeriaStates.map((state) => (
                      <option key={state.code} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* City Dropdown (depends on state) */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <select
                    name="city"
                    value={selectedCity}
                    onChange={handleCityChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className='mb-5'>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShare();
                }}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-brand text-white hover:bg-brand-dark"
                aria-label="Share invite"
              >
                <span className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Earn on TOWG. Invite someone
                </span>
              </button>
                {/*Referral link section */}
                <div className="mt-2 md:w-96 text-sm text-gray-600">
                  <InfoRow
                  label="Referral Link"
                  value={inviteUrl}
                  icon={<Link className="h-4 w-4 text-gray-400" />}
                  truncate
                  copyable
                  />
                </div>

              {/* Invite Share Options */}
              {isShareOpen && (
                <div className="absolute top-12 right-2 bg-white rounded-md shadow-xl z-20 w-56 py-1 border border-gray-100">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b">
                    Share your invite link
                  </div>
                  <button 
                    onClick={() => shareInvite('copy')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy invite link
                  </button>
                  <button 
                    onClick={() => shareInvite('whatsapp')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.17.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Share via WhatsApp
                  </button>
                  <button 
                    onClick={() => shareInvite('telegram')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Share via Telegram
                  </button>
                  <button 
                    onClick={() => shareInvite('email')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Share via Email
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info Card */}
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4 mb-4">
                  {profile?.profilePictureUrl ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
                      src={profile.profilePictureUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                      {profile?.firstName?.charAt(0) || firstName?.charAt(0)}
                      {profile?.lastName?.charAt(0) || lastName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile?.firstName || firstName} {profile?.lastName || lastName}
                    </h2>
                    {profile?.middleName && (
                      <p className="text-sm text-gray-500">{profile.middleName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow 
                    label="Email" 
                    value={profile?.email || email} 
                    icon={<Email className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow
                    label="Date of Birth"
                    value={
                      profile?.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : 'Not specified'
                    }
                    icon={<CalendarToday className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow 
                    label="Gender" 
                    value={profile?.gender || 'Not specified'} 
                    icon={<SupervisedUserCircle className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-500" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <InfoRow 
                    label="Phone Number" 
                    value={profile?.phoneNumber || 'Not specified'} 
                    icon={<PhoneAndroid className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow 
                    label="Address" 
                    value={profile?.address || 'Not specified'} 
                    icon={<Home className="h-4 w-4 text-gray-400" />}
                    truncate
                  />
                </div>
              </div>

              {/* Location Info Card */}
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiMapPin className="h-5 w-5 text-gray-500" />
                  Location
                </h2>
                <div className="space-y-3">
                  <InfoRow 
                    label="City" 
                    value={profile?.city || 'Not specified'} 
                    icon={<BuildOutlined className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow 
                    label="State/Province" 
                    value={profile?.state || 'Not specified'} 
                    icon={<FiMapPin className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow 
                    label="Country" 
                    value={profile?.country || 'Not specified'} 
                    icon={<FiGlobe className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>

              {/* Wallet Info Card */}
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  Referral Commission Information
                </h2>
                <div className="space-y-3">
                  
                  {/*<InfoRow 
                    label="Balance" 
                    value={formatNumberToCurrency(wallet?.balance) || '$0.00'} 
                    icon={<MoneyTwoTone className="h-4 w-4 text-gray-400" />}
                    valueClass="text-green-600 font-medium"
                  />*/}
                  <InfoRow 
                    label="Commission Available" 
                    value={formatNumberToCurrency(wallet?.commission) || '$0.00'} 
                    icon={<Scale className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow 
                    label="Commission Used" 
                    value={formatNumberToCurrency(wallet?.withdrawn) || '$0.00'} 
                    icon={<ArrowDownward className="h-4 w-4 text-gray-400" />}
                  />
                  <InfoRow
                  label="Referral Link"
                  value={inviteUrl}
                  icon={<Link className="h-4 w-4 text-gray-400" />}
                  truncate
                  copyable
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default UserProfileView;
