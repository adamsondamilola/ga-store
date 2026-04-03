import React, { useState, useRef, useEffect, useCallback } from 'react';
import ClassStyle from '../../../../class-styles';
import productColors from '../../../../constants/ProductColors';

const colors = productColors;
const MAX_IMAGES_PER_VARIANT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const StepTwoVariant = ({ data, onBack, onNext, onChange, category, subCategory }) => {
  const [globalPrice, setGlobalPrice] = useState(0);
  const [variants, setVariants] = useState(() => {
    // Initialize with default variant if no data provided
    if (data && data.length > 0) {
      return data.map(variant => ({
        ...variant,
        // Ensure images array exists and contains valid data
        images: variant.images ? variant.images.map(img => 
          typeof img === 'string' ? { url: img } : img
        ) : [],
      pricingTiers: variant.pricingTiers ? variant.pricingTiers.map(tier => ({
        ...tier,
        pricePerUnitGlobal: tier.pricePerUnitGlobal || 0
      })) : [{
        minQuantity: 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: 0
      }]
    }));
    }
    return [{
      color: '',
      size: '',
      style: '',
      sellerSKU: '',
      barCode: '',
      stockQuantity: 0,
      weight: 0,
      saleStartDate: '',
      saleEndDate: '',
      images: [],
      pricingTiers: [{
        minQuantity: 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: 0
      }]
    }];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [colorQuery, setColorQuery] = useState('');
  const [showColorDropdownIndex, setShowColorDropdownIndex] = useState(null);
  const colorDropdownRefs = useRef([]);
  const fileInputRefs = useRef([]);

  // Use useRef to track previous variants and avoid infinite loops
  const prevVariantsRef = useRef();
  
  // Send data to parent only when variants actually change
  useEffect(() => {
    // Compare current variants with previous to avoid unnecessary updates
    if (JSON.stringify(prevVariantsRef.current) !== JSON.stringify(variants)) {
      onChange(variants);
      prevVariantsRef.current = variants;
    }
  }, [variants, onChange]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      variants.forEach(variant => {
        variant.images.forEach(image => {
          if (image.preview) {
            URL.revokeObjectURL(image.preview);
          }
        });
      });
    };
  }, []);

  // Handle click outside color dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!colorDropdownRefs.current.some(ref => ref && ref.contains(event.target))) {
        setShowColorDropdownIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVariantChange = useCallback((index, field, value) => {
    setVariants(prev => {
      const newVariants = [...prev];
      
      // Convert numeric fields to numbers
      if (['stockQuantity'].includes(field)) {
        value = parseFloat(value) || 0;
      }
      
      newVariants[index][field] = value;
      
      // If changing sale dates, update all variants
      if (field === 'saleStartDate' || field === 'saleEndDate') {
        newVariants.forEach(variant => {
          variant[field] = value;
        });
      }
      
      return newVariants;
    });
  }, []);

  const handlePricingTierChange = useCallback((variantIndex, tierIndex, field, value) => {
    setVariants(prev => {
      const newVariants = [...prev];
      // Convert numeric fields to numbers
      if (['minQuantity', 'pricePerUnit', 'pricePerUnitGlobal'].includes(field)) {
        value = parseFloat(value) || 0;
      }
      
      newVariants[variantIndex].pricingTiers[tierIndex][field] = value;
      
      // If global price is changed, update it in all variants
     /* if (field === 'pricePerUnitGlobal') {
        setGlobalPrice(value);
        newVariants.forEach((variant, vIndex) => {
          variant.pricingTiers.forEach((tier, tIndex) => {
            newVariants[vIndex].pricingTiers[tIndex].pricePerUnitGlobal = value;
          });
        });
      }*/

      if (field === 'pricePerUnitGlobal') {
      newVariants[variantIndex].pricingTiers = newVariants[variantIndex].pricingTiers.map(tier => ({
        ...tier,
        pricePerUnitGlobal: value
      }));
    }
      
      return newVariants;
    });
  }, []);

  const handleImageUpload = useCallback((index, e) => {
    const files = Array.from(e.target.files);
    
    if (variants[index].images.length + files.length > MAX_IMAGES_PER_VARIANT) {
      alert(`Maximum ${MAX_IMAGES_PER_VARIANT} images per variant allowed`);
      return;
    }

    const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed the ${MAX_IMAGE_SIZE/1024/1024}MB limit`);
      return;
    }

    if (files.length > 0) {
      setVariants(prev => {
        const newVariants = [...prev];
        const newImages = files.map(file => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        newVariants[index].images = [...newVariants[index].images, ...newImages];
        return newVariants;
      });
    }
    e.target.value = ''; // Reset file input
  }, [variants]);

  const handleRemoveImage = useCallback((variantIndex, imageIndex) => {
    setVariants(prev => {
      const newVariants = [...prev];
      const removedImage = newVariants[variantIndex].images[imageIndex];
      
      if (removedImage?.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      newVariants[variantIndex].images = newVariants[variantIndex].images.filter(
        (_, i) => i !== imageIndex
      );
      return newVariants;
    });
  }, []);

/*  const addPricingTier = useCallback((variantIndex) => {
    setVariants(prev => {
      const newVariants = [...prev];
      const lastTier = newVariants[variantIndex].pricingTiers.slice(-1)[0];
      newVariants[variantIndex].pricingTiers.push({
        minQuantity: lastTier ? lastTier.minQuantity + 1 : 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: 0
      });
      return newVariants;
    });
//  }, [globalPrice]);
  }, [variants]); */

  const addPricingTier = useCallback((variantIndex) => {
  setVariants(prev => {
    const newVariants = [...prev];
    const variant = newVariants[variantIndex];
    const lastTier = variant.pricingTiers.slice(-1)[0];
    
    // All tiers in a variant share the same global price
    const globalPriceForVariant = variant.pricingTiers[0]?.pricePerUnitGlobal || 0;
    
    newVariants[variantIndex].pricingTiers.push({
      minQuantity: lastTier ? lastTier.minQuantity + 1 : 1,
      pricePerUnit: 0,
      pricePerUnitGlobal: globalPriceForVariant
    });
    return newVariants;
  });
}, []);

  const removePricingTier = useCallback((variantIndex, tierIndex) => {
    if (variants[variantIndex].pricingTiers.length <= 1) {
      alert('You must have at least one pricing tier');
      return;
    }
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[variantIndex].pricingTiers = newVariants[variantIndex].pricingTiers.filter(
        (_, i) => i !== tierIndex
      );
      return newVariants;
    });
  }, [variants]);

  const handleDragStart = (e, variantIndex, imageIndex) => {
    e.dataTransfer.setData('variantIndex', variantIndex);
    e.dataTransfer.setData('imageIndex', imageIndex);
  };

  const handleDrop = useCallback((e, variantIndex, dropIndex) => {
    e.preventDefault();
    const dragVariantIndex = e.dataTransfer.getData('variantIndex');
    const dragImageIndex = e.dataTransfer.getData('imageIndex');
    
    if (dragVariantIndex === null || dragImageIndex === null) return;

    if (dragVariantIndex === variantIndex.toString()) {
      setVariants(prev => {
        const updatedVariants = [...prev];
        const draggedImage = updatedVariants[variantIndex].images.splice(dragImageIndex, 1)[0];
        updatedVariants[variantIndex].images.splice(dropIndex, 0, draggedImage);
        return updatedVariants;
      });
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const addVariant = useCallback(() => {
    // Use the sale dates from the first variant for new variants
    const baseSaleStartDate = variants[0]?.saleStartDate || '';
    const baseSaleEndDate = variants[0]?.saleEndDate || '';
    
    setVariants(prev => [...prev, {
      color: '',
      size: '',
      style: '',
      name: '',
      sellerSKU: '',
      barCode: '',
      stockQuantity: 0,
      weight: 0,
      saleStartDate: baseSaleStartDate,
      saleEndDate: baseSaleEndDate,
      images: [],
      pricingTiers: [{
        minQuantity: 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: 0
      }]
    }]);
//  }, [variants, globalPrice]);
  }, [variants]);

  const removeVariant = useCallback((index) => {
    if (variants.length <= 1) {
      alert('You must have at least one variant');
      return;
    }
    setVariants(prev => {
      const variantToRemove = prev[index];
      // Clean up image URLs if they're Blob objects
      variantToRemove.images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
      return prev.filter((_, i) => i !== index);
    });
  }, [variants]);

  const [variantTypes, setVariantTypes] = useState({
    hasColors: false,
    hasSizes: false,
    hasStyles: false
  });

  const handleVariantTypeChange = (type) => {
    setVariantTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleNext = useCallback(() => {
    // Validate variants before proceeding
    const errors = [];
    
    variants.forEach((variant, index) => {
      if (subCategory?.hasColors && !variant.color) {
        errors.push(`Variant ${index + 1}: Color is required`);
      }
      if (subCategory?.hasSizes && !variant.size) {
        errors.push(`Variant ${index + 1}: Size is required`);
      }
      if (subCategory?.hasStyles && !variant.style) {
        errors.push(`Variant ${index + 1}: Style is required`);
      }
      if (!variant.name) {
        errors.push(`Variant ${index + 1}: Name is required`);
      }
      if (!variant.sellerSKU) {
        errors.push(`Variant ${index + 1}: Seller SKU is required`);
      }
      if (variant.stockQuantity < 0) {
        errors.push(`Variant ${index + 1}: Stock quantity cannot be negative`);
      }
      if (variant.weight == null) {
        errors.push(`Variant ${index + 1}: Weight is required`);
      }
      
      // Validate pricing tiers
      variant.pricingTiers.forEach((tier, tierIndex) => {
        if (tier.minQuantity < 1) {
          errors.push(`Variant ${index + 1} Tier ${tierIndex + 1}: Minimum quantity must be at least 1`);
        }
        if (tier.pricePerUnit <= 0) {
          errors.push(`Variant ${index + 1} Tier ${tierIndex + 1}: Price must be greater than 0`);
        }
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    // Only call onNext if it's provided (for multi-step forms)
    if (onNext) {
      onChange(variants);
      onNext();
    }
  }, [variants, category, onChange, onNext]);

  return (
    <div className="space-y-6">

      {/* Variant Type Selection */}
      {/*<div className="border p-4 rounded bg-gray-50">
        <h3 className="font-medium text-lg mb-4">Variant Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={variantTypes.hasColors}
              onChange={() => handleVariantTypeChange('hasColors')}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            Has Colors
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={variantTypes.hasSizes}
              onChange={() => handleVariantTypeChange('hasSizes')}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            Has Sizes
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={variantTypes.hasStyles}
              onChange={() => handleVariantTypeChange('hasStyles')}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            Has Styles
          </label>
        </div>
      </div>*/}

      {/* Global Sale Dates Section */}
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-medium text-lg mb-4">Sale Period (Applies to All Variants)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Sale Start Date</label>
            <input
              type="datetime-local"
              value={variants[0]?.saleStartDate || ''}
              onChange={(e) => handleVariantChange(0, 'saleStartDate', e.target.value)}
              className={ClassStyle.input}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Sale End Date</label>
            <input
              type="datetime-local"
              value={variants[0]?.saleEndDate || ''}
              onChange={(e) => handleVariantChange(0, 'saleEndDate', e.target.value)}
              className={ClassStyle.input}
            />
          </div>
        </div>
      </div>

      {/* Variants List */}
      {variants.map((variant, index) => {
        const filteredColors = colors.filter(color => 
          color.toLowerCase().includes((variant.color || '').toLowerCase())
        );

        return (
          <div key={index} className="border p-4 rounded relative">
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={() => removeVariant(index)}
              aria-label="Remove variant"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              

              <div>
                <label className="block text-sm font-medium">Variant Name <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              {/*{variantTypes?.hasColors && (*/}
              {subCategory?.hasColors && (
                <div ref={el => colorDropdownRefs.current[index] = el} className="relative">
                  <label className="block text-sm font-medium">Color <span className='text-red-500'>*</span></label>
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) => {
                      handleVariantChange(index, 'color', e.target.value);
                      setColorQuery(e.target.value);
                      setShowColorDropdownIndex(index);
                    }}
                    onFocus={() => setShowColorDropdownIndex(index)}
                    className={ClassStyle.input}
                  />
                  {showColorDropdownIndex === index && (
                    <ul className="absolute z-10 bg-white border border-gray-200 mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
                      {filteredColors.map((color, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => {
                            handleVariantChange(index, 'color', color);
                            setShowColorDropdownIndex(null);
                          }}
                        >
                          {color}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {subCategory?.hasSizes && (
                <div>
                  <label className="block text-sm font-medium">Size <span className='text-red-500'>*</span></label>
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                    className={ClassStyle.input}
                  />
                </div>
              )}

              {subCategory?.hasStyles && (
                <div>
                  <label className="block text-sm font-medium">Style <span className='text-red-500'>*</span></label>
                  <input
                    type="text"
                    value={variant.style}
                    onChange={(e) => handleVariantChange(index, 'style', e.target.value)}
                    className={ClassStyle.input}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Seller SKU <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  value={variant.sellerSKU}
                  onChange={(e) => handleVariantChange(index, 'sellerSKU', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Bar Code</label>
                <input
                  type="text"
                  value={variant.barCode}
                  onChange={(e) => handleVariantChange(index, 'barCode', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Stock Quantity <span className='text-red-500'>*</span></label>
                <input
                  type="number"
                  min="0"
                  value={variant.stockQuantity}
                  onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Weight (in gram) <span className='text-red-500'>*</span></label>
                <input
                  type="number"
                  min="0.1"
                  value={variant.weight}
                  onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              {/* Pricing Tiers Section */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Pricing Tiers</h4>
                {/*{index === 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium">Global Price Per Unit <span className='text-red-500'>*</span></label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={variant.pricingTiers[index].pricePerUnitGlobal}
                      onChange={(e) => handlePricingTierChange(index, tierIndex, 'pricePerUnitGlobal', e.target.value)}
                      className={ClassStyle.input}
                    />
                  </div>
                )}*/}
                
                <div className="mb-4">
      <label className="block text-sm font-medium">
        Global Price for {variant.name || `Variant ${index + 1}`} <span className='text-red-500'>*</span>
      </label>
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={variant.pricingTiers[0]?.pricePerUnitGlobal || 0}
        onChange={(e) => handlePricingTierChange(index, 0, 'pricePerUnitGlobal', e.target.value)}
        className={ClassStyle.input}
      />
    </div>
                  
                <div className="space-y-4">
                  {variant.pricingTiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded">
                      <div>
                        <label className="block text-sm font-medium">Min Quantity <span className='text-red-500'>*</span></label>
                        <input
                          type="number"
                          min="1"
                          value={tier.minQuantity}
                          onChange={(e) => handlePricingTierChange(index, tierIndex, 'minQuantity', e.target.value)}
                          className={ClassStyle.input}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Price Per Unit <span className='text-red-500'>*</span></label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={tier.pricePerUnit}
                          onChange={(e) => handlePricingTierChange(index, tierIndex, 'pricePerUnit', e.target.value)}
                          className={ClassStyle.input}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removePricingTier(index, tierIndex)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition disabled:bg-red-300"
                          disabled={variant.pricingTiers.length <= 1}
                        >
                          Remove Tier
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addPricingTier(index)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    + Add Pricing Tier
                  </button>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <label className="block text-sm font-medium mb-2">Variant Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(index, e)}
                  className="hidden"
                  ref={el => fileInputRefs.current[index] = el}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded mb-4 transition disabled:bg-gray-100"
                  disabled={variant.images.length >= MAX_IMAGES_PER_VARIANT}
                >
                  Upload Images ({variant.images.length}/{MAX_IMAGES_PER_VARIANT})
                </button>

                {variant.images.length > 0 && (
                  <div className="flex gap-4 mt-4 overflow-x-auto max-w-full pb-2">
                    {variant.images.map((image, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="relative w-32 h-32 flex-shrink-0 cursor-move group"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index, imgIndex)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index, imgIndex)}
                      >
                        <img
                          src={typeof image === 'string' ? image : image.preview}
                          alt={`variant-${index}-image-${imgIndex}`}
                          className="w-full h-full object-cover rounded border group-hover:opacity-75 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index, imgIndex)}
                          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-700 transition-opacity opacity-0 group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                        {imgIndex === 0 && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addVariant}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        + Add Variant
      </button>

      {/* Only show navigation buttons if onBack/onNext are provided */}
      {(onBack || onNext) && (
        <div className="flex justify-between pt-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition"
            >
              Back
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StepTwoVariant;