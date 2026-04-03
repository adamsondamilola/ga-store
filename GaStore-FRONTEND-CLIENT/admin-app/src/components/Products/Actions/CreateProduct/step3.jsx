import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import ClassStyle from "../../../../class-styles";
import countriesList from "../../../../constants/Countries";
import { useDebounce } from "../../../../hooks/useDebounce";

const StepThreeSpecification = ({ data, onBack, onSubmit, onChange }) => {
  const [specifications, setSpecifications] = useState({
    certification: "",
    mainMaterial: "",
    materialFamily: "",
    model: "",
    note: "",
    productionCountry: "",
    productLine: "",
    size: "",
    warrantyDuration: "",
    warrantyType: "",
    youTubeId: "",
    nafdac: "",
    fda: "",
    fdaApproved: false,
    fromTheManufacturer: "",
    disclaimer: "",
    whatIsInTheBox: "",
    productWarranty: "",
    warrantyAddress: "",
  });

  const debouncedSpecs = useDebounce(specifications, 500); // ✅ debounce all fields

  // fire only when debounce settles
  useEffect(() => {
    onChange(debouncedSpecs);
  }, [debouncedSpecs]);

  const countries = countriesList;
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // initialize from parent
/*  useEffect(() => {
    if (data) {
      setSpecifications((prev) => ({ ...prev, ...data }));
      if (data.productionCountry) setCountryQuery(data.productionCountry);
    }
  }, [data]);*/

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(countryQuery.toLowerCase())
  );

  const handleCountrySelect = (country) => {
    setSpecifications((prev) => ({
      ...prev,
      productionCountry: country,
    }));
    setCountryQuery(country);
    setShowCountryDropdown(false);
    onChange({ ...specifications, productionCountry: country }); // ✅ fire instantly for dropdowns
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpecifications((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // ✅ fire instantly for checkboxes
    if (type === "checkbox") {
      onChange({ ...specifications, [name]: checked });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!specifications.mainMaterial || !specifications.productionCountry) {
        toast.error("Main material and production country are required");
        return;
      }

      await onSubmit();
    } catch (error) {
      toast.error(error.message || "Failed to save specifications");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Main Material <span className='text-red-500'>*</span></label>
            <input
              type="text"
              name="mainMaterial"
              value={specifications.mainMaterial}
              onChange={handleInputChange}
              className={ClassStyle.input}
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
            />
          </div>

          <div className="relative" ref={countryDropdownRef}>
        <label className="block text-sm font-medium">Production Country <span className='text-red-500'>*</span></label>
        <input
        autoComplete="off"
          type="text"
          name="productionCountry"
          value={countryQuery}
          onChange={(e) => {
            setCountryQuery(e.target.value);
            setShowCountryDropdown(true);
          }}
          onFocus={() => setShowCountryDropdown(true)}
          className={ClassStyle.input}
          required
        />
        {showCountryDropdown && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, idx) => (
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium">NAFDAC Code</label>
            <input
              type="text"
              name="nafdac"
              value={specifications.nafdac}
              onChange={handleInputChange}
              className={ClassStyle.input}
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
            />
          </div>

          {/*<div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="fdaApproved"
              checked={specifications.fdaApproved}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="text-sm">FDA Approved</label>
          </div>*/}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Additional Information</h3>

        <div>
          <label className="block text-sm font-medium">Disclaimer</label>
          <textarea
            name="disclaimer"
            value={specifications.disclaimer}
            onChange={handleInputChange}
            rows={3}
            className={ClassStyle.input}
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
          />
        </div>
      </div>

    </div>
  );
};

export default StepThreeSpecification;