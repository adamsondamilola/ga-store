import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import ClassStyle from '../../../../class-styles';
import countriesList from '../../../../constants/Countries';

const StepThreeSpecification = ({ data, onBack, onSubmit, onChange, isUpdate = false }) => {
  const initialSpecifications = {
    certification: '',
    mainMaterial: '',
    materialFamily: '',
    model: '',
    note: '',
    productionCountry: '',
    productLine: '',
    size: '',
    warrantyDuration: '',
    warrantyType: '',
    youTubeId: '',
    nafdac: '',
    fda: '',
    fdaApproved: false,
    fromTheManufacturer: '',
    disclaimer: '',
    whatIsInTheBox: '',
    productWarranty: '',
    warrantyAddress: ''
  };

  const [specifications, setSpecifications] = useState(initialSpecifications);
  const [countryQuery, setCountryQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const countries = countriesList;

  // Filter countries based on search query
  const filteredCountries = useCallback(() => {
    return countries.filter(country =>
      country.toLowerCase().includes(countryQuery.toLowerCase())
    );
  }, [countryQuery, countries]);

  // Initialize with provided data
  useEffect(() => {
    if (data) {
      setSpecifications(prev => ({
        ...initialSpecifications,
        ...data
      }));
      if (data.productionCountry) {
        setCountryQuery(data.productionCountry);
      }
    }
  }, [data]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country) => {
    setSpecifications(prev => ({
      ...prev,
      productionCountry: country
    }));
    setCountryQuery(country);
    setShowCountryDropdown(false);
    setTouchedFields(prev => ({ ...prev, productionCountry: true }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpecifications(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = useCallback(() => {
    const errors = [];
    
    if (!specifications.mainMaterial && touchedFields.mainMaterial) {
      errors.push('Main material is required');
    }
    
    if (!specifications.productionCountry && touchedFields.productionCountry) {
      errors.push('Production country is required');
    }
    
    // Validate YouTube ID format if provided
    if (specifications.youTubeId && !/^[a-zA-Z0-9_-]{11}$/.test(specifications.youTubeId)) {
      errors.push('YouTube ID must be 11 characters long and contain only letters, numbers, hyphens, and underscores');
    }
    
    return errors;
  }, [specifications, touchedFields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      setIsSubmitting(false);
      return;
    }

    try {
      onChange(specifications);
      await onSubmit();
    } catch (error) {
      toast.error(error.message || 'Failed to save specifications');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Specifications */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Basic Specifications</h3>
          
          <div>
            <label className="block text-sm font-medium">Certification</label>
            <input
              type="text"
              name="certification"
              value={specifications.certification}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="e.g., CE, RoHS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Main Material {<span className='text-red-500'>*</span>}
            </label>
            <input
              type="text"
              name="mainMaterial"
              value={specifications.mainMaterial}
              onChange={handleInputChange}
              className={`${ClassStyle.input} ${touchedFields.mainMaterial && !specifications.mainMaterial ? 'border-red-500' : ''}`}
              placeholder="e.g., Plastic, Metal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Material Family</label>
            <input
              type="text"
              name="materialFamily"
              value={specifications.materialFamily}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="e.g., Polymer, Alloy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Model</label>
            <input
              type="text"
              name="model"
              value={specifications.model}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="Model number/name"
            />
          </div>

          <div className="relative" ref={countryDropdownRef}>
            <label className="block text-sm font-medium">
              Production Country {<span className='text-red-500'>*</span>}
            </label>
            <input
              type="text"
              name="productionCountry"
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setShowCountryDropdown(true);
                setTouchedFields(prev => ({ ...prev, productionCountry: true }));
              }}
              onFocus={() => setShowCountryDropdown(true)}
              className={`${ClassStyle.input} ${touchedFields.productionCountry && !specifications.productionCountry ? 'border-red-500' : ''}`}
              placeholder="Select country"
              required
            />
            {showCountryDropdown && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredCountries().length > 0 ? (
                  filteredCountries().map((country, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      onClick={() => handleCountrySelect(country)}
                    >
                      {country}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">No countries found</li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Product Line</label>
            <input
              type="text"
              name="productLine"
              value={specifications.productLine}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="Product line name"
            />
          </div>
        </div>

        {/* Warranty Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Warranty & Additional Info</h3>

          <div>
            <label className="block text-sm font-medium">Warranty Duration</label>
            <input
              type="text"
              name="warrantyDuration"
              value={specifications.warrantyDuration}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="e.g., 1 year, 2 years"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Warranty Type</label>
            <input
              type="text"
              name="warrantyType"
              value={specifications.warrantyType}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="e.g., Limited, Extended"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">YouTube Video ID</label>
            <input
              type="text"
              name="youTubeId"
              value={specifications.youTubeId}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="e.g., dQw4w9WgXcQ"
              maxLength={11}
            />
            {specifications.youTubeId && !/^[a-zA-Z0-9_-]{11}$/.test(specifications.youTubeId) && (
              <p className="text-xs text-red-500 mt-1">Invalid YouTube ID format</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">NAFDAC Code</label>
            <input
              type="text"
              name="nafdac"
              value={specifications.nafdac}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="NAFDAC details if applicable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">FDA Code</label>
            <input
              type="text"
              name="fda"
              value={specifications.fda}
              onChange={handleInputChange}
              className={ClassStyle.input}
              placeholder="FDA details if applicable"
            />
          </div>

        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Additional Information</h3>

        <div>
          <label className="block text-sm font-medium">Diclaimer</label>
          <textarea
            name="disclaimer"
            value={specifications.disclaimer}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
            placeholder="Manufacturer's description or notes"
          />
        </div>

<div>
          <label className="block text-sm font-medium">From the Manufacturer</label>
          <textarea
            name="fromTheManufacturer"
            value={specifications.fromTheManufacturer}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
            placeholder="Manufacturer's description or notes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">What's in the Box</label>
          <textarea
            name="whatIsInTheBox"
            value={specifications.whatIsInTheBox}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
            placeholder="List all included items"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Product Warranty Details</label>
          <textarea
            name="productWarranty"
            value={specifications.productWarranty}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
            placeholder="Detailed warranty information"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Warranty Address</label>
          <textarea
            name="warrantyAddress"
            value={specifications.warrantyAddress}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
            placeholder="Address for warranty claims"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition"
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition disabled:bg-green-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isUpdate ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default StepThreeSpecification;