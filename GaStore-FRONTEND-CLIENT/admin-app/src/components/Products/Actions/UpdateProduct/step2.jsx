import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ClassStyle from '../../../../class-styles';
import productColors from '../../../../constants/ProductColors';
import requestHandler from '../../../../utils/requestHandler';
import endpointsPath from '../../../../constants/EndpointsPath';

const colors = productColors;
const MAX_IMAGES_PER_VARIANT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const StepTwoVariant = ({ data, productId, onBack, onNext, onChange, category, subCategory, isUpdate = false }) => {
  const [variants, setVariants] = useState([{
    id: '',
    name: '',
    color: '',
    size: '',
    style: '',
    sellerSKU: '',
    barCode: null,
    weight: 0,
    stockQuantity: 0,
    saleStartDate: '',
    saleEndDate: '',
    imageFiles: [], // New images to upload
    existingImages: [], // Existing images from server
    imagesToDelete: [], // IDs of existing images to delete
    pricingTiers: [{
      id: '',
      minQuantity: 1,
      pricePerUnit: 0,
      pricePerUnitGlobal: 0
    }]
  }]);

  const [globalPrice, setGlobalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [colorQuery, setColorQuery] = useState('');
  const [showColorDropdownIndex, setShowColorDropdownIndex] = useState(null);
  const colorDropdownRefs = useRef([]);
  const fileInputRefs = useRef([]);
  const [isUploading, setIsUploading] = useState(false);

// Updated handleImageUpload to upload to server immediately
const handleImageUpload = async (variantIndex, variant, e) => {
  setIsUploading(true);
  const files = Array.from(e.target.files);
  
  const currentImages = [
    ...variants[variantIndex].existingImages.filter(img => 
      !variants[variantIndex].imagesToDelete.includes(img.id)
    ),
    ...variants[variantIndex].imageFiles
  ];
  
  if (currentImages.length + files.length > MAX_IMAGES_PER_VARIANT) {
    toast.error(`Maximum ${MAX_IMAGES_PER_VARIANT} images per variant allowed`);
    return;
  }

  const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
  if (oversizedFiles.length > 0) {
    toast.error(`Some files exceed the ${MAX_IMAGE_SIZE/1024/1024}MB limit`);
    return;
  }

  setIsUploading(true);
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('imageFiles', file));
    formData.append('productId', productId || '');
    formData.append('variantId', variant.id || '');
    const response = await requestHandler.postForm(
      `${endpointsPath.productImage}`, 
      formData, 
      true
    );

    if (response.statusCode < 202) {
      const uploadedImages = response.result.data;

      const uploadedWithPreview = uploadedImages.map((img, idx) => ({
        ...img,
        id: img.id,
        imageUrl: img.imageUrl,
        preview: URL.createObjectURL(files[idx]),
        isNew: true
      }));

      const newVariants = [...variants];
      newVariants[variantIndex].imageFiles = [
        ...newVariants[variantIndex].imageFiles,
        ...uploadedWithPreview
      ];
      
      setVariants(newVariants);
      onChange(newVariants); // Notify parent immediately
      return;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error("Error uploading image");
  } finally {
    setIsUploading(false);
    e.target.value = "";
  }
};

// Updated handleRemoveImage to prevent deleting last existing image
const handleRemoveImage = (variantIndex, imageIndex, isExisting) => {
  const action = window.confirm('Are you sure you want to delete this image?');
  if (!action) return;
  
  const updatedVariants = [...variants];
  const variant = updatedVariants[variantIndex];
  const displayImages = getDisplayImages(variant);
  
  // Check if trying to delete the last existing image when no new images exist
  if (isExisting) {
    const remainingExistingImages = variant.existingImages.filter(
      img => !variant.imagesToDelete.includes(img.id)
    );
    const totalNewImages = variant.imageFiles.length;
    
    // If this is the last existing image and there are no new images, prevent deletion
    if (remainingExistingImages.length === 1 && totalNewImages === 0) {
      toast.error('Cannot delete the last existing image. Please upload a new image first.');
      return;
    }
  }
  
  if (isExisting || displayImages[imageIndex]?.isNew) {
    // If it's an existing image or a newly uploaded one with an ID
    const existingImage = displayImages[imageIndex];
    
    // Call delete API for existing images
    if (isExisting && existingImage.imageUrl) {
      deleteExistingImageByUrl(existingImage);
      updatedVariants[variantIndex].imagesToDelete = [
        ...(variant.imagesToDelete || []),
        existingImage.id
      ];
    }

    // For new images with IDs (already uploaded), also call delete API
    if (existingImage?.imageUrl && existingImage.isNew) {
      deleteExistingImageByUrl(existingImage);
    }
  }

  // Handle the actual removal from display arrays
  if (isExisting) {
    // For existing images, mark for deletion
    const existingImage = variant.existingImages[imageIndex];
    if (existingImage) {
      updatedVariants[variantIndex].imagesToDelete = [
        ...(variant.imagesToDelete || []),
        existingImage.id
      ];
    }
  } else {
    // For new images, calculate the correct index in imageFiles array
    const existingCount = variant.existingImages.filter(
      img => !variant.imagesToDelete.includes(img.id)
    ).length;
    const newImageIndex = imageIndex - existingCount;
    
    if (newImageIndex >= 0) {
      const imageToRemove = variant.imageFiles[newImageIndex];
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      updatedVariants[variantIndex].imageFiles.splice(newImageIndex, 1);
    }
  }

  setVariants(updatedVariants);
  onChange(updatedVariants); // Notify parent immediately
};

// Helper function to get display images
const getDisplayImages = (variant) => {
  // Filter out existing images marked for deletion
  const remainingExistingImages = variant.existingImages.filter(
    img => !variant.imagesToDelete.includes(img.id)
  );
  
  // Return existing images first, then new images
  return [
    ...remainingExistingImages,
    ...variant.imageFiles
  ];
};

// Update the deleteExistingImageByUrl function to accept variant-specific deletion
const deleteExistingImageByUrl = async (image) => {
  setIsUploading(true);
  try {
    const response = await requestHandler.deleteReq(
      `${endpointsPath.productImage}/delete-by-url?imageUrl=${encodeURIComponent(image.imageUrl)}`, 
      true
    );
    if (response.statusCode === 200) {
      //toast.success('Image deleted successfully');
    } else {
      //toast.error('Failed to delete image');
    }
  } catch (error) { 
    console.error('Error deleting image:', error);
    toast.error('Error deleting image');
  } finally {
    setIsUploading(false);
  }
};

  // Initialize with provided data
  useEffect(() => {
    if (data && data.length > 0) {
      setVariants(data.map(variant => ({
        ...variant,
        // Ensure we have proper arrays for images
        imageFiles: variant.imageFiles || [],
        existingImages: variant.existingImages || [],
        imagesToDelete: variant.imagesToDelete || []
      })));
      
      // Set global price from first variant's first tier if available
      if (data[0]?.pricingTiers?.[0]?.pricePerUnitGlobal) {
        setGlobalPrice(data[0].pricingTiers[0].pricePerUnitGlobal);
      }
    }
  }, [data]);

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

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      variants.forEach(variant => {
        variant.imageFiles.forEach(image => {
          if (image.preview) {
            URL.revokeObjectURL(image.preview);
          }
        });
      });
    };
  }, [variants]);

  // Update handleVariantChange to notify parent
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    
    // Convert numeric fields to numbers
    if (['stockQuantity'].includes(field)) {
      value = parseFloat(value) || 0;
    }

    //convert weight to string
    if (['weight'].includes(field)) {
      value = value.toString() || "";
    }
    
    newVariants[index][field] = value;
    
    // If changing sale dates, update all variants
    if (field === 'saleStartDate' || field === 'saleEndDate') {
      newVariants.forEach(variant => {
        variant[field] = value;
      });
    }
    
    setVariants(newVariants);
    onChange(newVariants); // Notify parent immediately
  };

  // Update handlePricingTierChange to notify parent
  const handlePricingTierChange = (variantIndex, tierIndex, field, value) => {
    const newVariants = [...variants];
    
    // Convert numeric fields to numbers
    if (['minQuantity', 'pricePerUnit', 'pricePerUnitGlobal'].includes(field)) {
      value = parseFloat(value) || 0;
    }
    
    newVariants[variantIndex].pricingTiers[tierIndex][field] = value;
    
    // If global price is changed, update it in all variants
    if (field === 'pricePerUnitGlobal') {
      newVariants[variantIndex].pricingTiers = newVariants[variantIndex].pricingTiers.map(tier => ({
        ...tier,
        pricePerUnitGlobal: value
      }));
    }
    
    setVariants(newVariants);
    onChange(newVariants); // Notify parent immediately
  };


  // Update addPricingTier to notify parent
    const addPricingTier = useCallback((variantIndex) => {
    setVariants(prev => {
      const newVariants = [...prev];
      const variant = newVariants[variantIndex];
      //const lastTier = variant.pricingTiers.slice(-1)[0];
      const maxMinQuantity = Math.max(
      0,
      ...variant.pricingTiers.map(t => t.minQuantity || 0)
    );
      // All tiers in a variant share the same global price
      const globalPriceForVariant = variant.pricingTiers[0]?.pricePerUnitGlobal || 0;
      
      variant.pricingTiers.push({
        //minQuantity: lastTier ? lastTier.minQuantity + 1 : 1,
        minQuantity: maxMinQuantity + 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: globalPriceForVariant
      });

      variant.pricingTiers = [...variant.pricingTiers].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );
      return newVariants;
    });
  }, []);

  // Update removePricingTier to notify parent
  const removePricingTier = async (variantIndex, tierIndex, id) => {
  if (variants[variantIndex].pricingTiers.length <= 1) {
    toast.error('You must have at least one pricing tier');
    return;
  }
  
  // Store the original state for potential rollback
  const originalVariants = [...variants];
   
  // Optimistic update
  const newVariants = [...variants];
  const removedTier = newVariants[variantIndex].pricingTiers[tierIndex];
  
  newVariants[variantIndex].pricingTiers = newVariants[variantIndex].pricingTiers.filter(
    (_, i) => i !== tierIndex
  );

  setVariants(newVariants);
  onChange(newVariants);
  
  // If there's an ID, make the API call
  if (id) {
    try {
      await requestHandler.deleteReq(`${endpointsPath.pricingTier}/${id}`, true);
      // Success - no action needed
    } catch (error) {
      // Rollback on error
      //toast.error('Failed to delete pricing tier');
      setVariants(originalVariants);
      onChange(originalVariants);
    }
  }
};

  // Update handleDrop to notify parent
  const handleDrop = (e, variantIndex, dropIndex) => {
    e.preventDefault();
    const dragVariantIndex = e.dataTransfer.getData('variantIndex');
    const dragImageIndex = e.dataTransfer.getData('imageIndex');
    const isExisting = e.dataTransfer.getData('isExisting') === 'true';
    
    if (dragVariantIndex === null || dragImageIndex === null) return;
    if (dragVariantIndex !== variantIndex.toString()) return;
    if (isExisting) {
      toast.info('Reordering existing images requires server updates. Please upload new images to change order.');
      return;
    }

    const updatedVariants = [...variants];
    const [draggedImage] = updatedVariants[variantIndex].imageFiles.splice(dragImageIndex, 1);
    updatedVariants[variantIndex].imageFiles.splice(dropIndex, 0, draggedImage);
    setVariants(updatedVariants);
    onChange(updatedVariants); // Notify parent immediately
  };

  // Update addVariant to notify parent
  const addVariant = () => {
    const baseSaleStartDate = variants[0]?.saleStartDate || '';
    const baseSaleEndDate = variants[0]?.saleEndDate || '';
    
    const newVariants = [...variants, {
      id: '',
      name: '',
      color: '',
      size: '',
      style: '',
      sellerSKU: '',
      barCode: null,
      weight: 0,
      stockQuantity: 0,
      saleStartDate: baseSaleStartDate,
      saleEndDate: baseSaleEndDate,
      imageFiles: [],
      existingImages: [],
      imagesToDelete: [],
      pricingTiers: [{
        id: '',
        minQuantity: 1,
        pricePerUnit: 0,
        pricePerUnitGlobal: globalPrice
      }]
    }];
    
    setVariants(newVariants);
    onChange(newVariants); // Notify parent immediately
  };

  // Update removeVariant to notify parent
  const removeVariant = async (index, id) => {
    const removeVariantCommand = window.confirm("Are you sure you want to remove variant? This cannot be undo");
    if(!removeVariantCommand) return;
    if (variants.length <= 1) {
      toast.error('You must have at least one variant');
      return;
    }
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
    onChange(newVariants); // Notify parent immediately

    //delete
     if(id){
       await requestHandler.deleteReq(`${endpointsPath.productVariant}/${id}`, true)
      }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragStart = (e, variantIndex, imageIndex, isExisting) => {
    e.dataTransfer.setData('variantIndex', variantIndex);
    e.dataTransfer.setData('imageIndex', imageIndex);
    e.dataTransfer.setData('isExisting', isExisting);
  };
  
  const validateVariants = useCallback(() => {
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
      if (parseInt(variant.weight) < 0 || variant.weight == null) {
        errors.push(`Weight is required`);
      }
      
      // Validate that we have at least one image (either existing or new)
      /*const totalImages = variant.existingImages.length - variant.imagesToDelete.length + variant.imageFiles.length;
      if (totalImages === 0) {
        errors.push(`Variant ${index + 1}: At least one image is required`);
      }*/
      
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

    return errors;
  }, [variants, category]);

  const handleNext = () => {
    setIsLoading(true);
    const errors = validateVariants();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      setIsLoading(false);
      return;
    }

    // Data is already updated in parent via onChange, just proceed
    onNext();
    setIsLoading(false);
  };


  return (
    <div className="space-y-6">
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
          <div key={index} className="border p-4 rounded relative group">
            <button
              className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeVariant(index, variant?.id)}
              title="Remove variant"
            >
              ✕
            </button>
            
            <h3 className="font-medium text-lg mb-4">Variant {index + 1}</h3>
            
            <div>
                <label className="block text-sm font-medium">Variant Name <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    placeholder="Select color"
                  />
                  {showColorDropdownIndex === index && (
                    <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
                      {filteredColors.map((color, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
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
                    placeholder="Enter size"
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
                    placeholder="Enter style"
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
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Bar Code</label>
                <input
                  type="text"
                  value={variant.barCode}
                  onChange={(e) => handleVariantChange(index, 'barCode', e.target.value)}
                  className={ClassStyle.input}
                  placeholder="Enter barcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={variant.stockQuantity}
                  onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                  className={ClassStyle.input}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Weight (in gram)</label>
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
                  {variant.pricingTiers
  .slice() 
  .sort((a, b) => a.minQuantity - b.minQuantity) 
  .map((tier, tierIndex) => (
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
                          onClick={() => removePricingTier(index, tierIndex, tier?.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
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
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, variant, e)}
                    className="hidden"
                    ref={el => fileInputRefs.current[index] = el}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={isUploading || getDisplayImages(variant).length >= MAX_IMAGES_PER_VARIANT}
                    className={`px-4 py-2 rounded ${
                      getDisplayImages(variant).length >= MAX_IMAGES_PER_VARIANT
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? 'Uploading...' : 'Select Images'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {getDisplayImages(variant).length}/{MAX_IMAGES_PER_VARIANT} images
                  </span>
                </div>
                {getDisplayImages(variant).length > 0 && (
  <div className="flex gap-4 mt-4 overflow-x-auto max-w-full pb-2">
    {getDisplayImages(variant).map((image, imgIndex) => {
      
      const displayImages = getDisplayImages(variant);

      // Safe identification of existing image
      const isExisting = variant.existingImages.some(e => e.id === image.id);

      const imageUrl = image.imageUrl || image.preview;

      return (
        <div
          key={`${isExisting ? 'existing' : 'new'}-${image.id || imgIndex}`}
          className="relative w-32 h-32 flex-shrink-0 cursor-move group"
        >
          <img
            src={imageUrl}
            alt={`variant-${index}-image-${imgIndex}`}
            className="w-full h-full object-cover rounded border group-hover:opacity-75 transition-opacity"
          />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
           <button
  type="button"
  onClick={() => handleRemoveImage(index, imgIndex, isExisting)}
  className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
  disabled={isExisting && 
    variant.existingImages.filter(img => !variant.imagesToDelete.includes(img.id)).length === 1 && 
    variant.imageFiles.length === 0
  }
  title={
    isExisting && 
    variant.existingImages.filter(img => !variant.imagesToDelete.includes(img.id)).length === 1 && 
    variant.imageFiles.length === 0
      ? "Cannot delete the last existing image. Upload a new image first."
      : "Remove image"
  }
>
  ✕
</button>
          </div>

          {imgIndex === 0 && (
            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
              Primary
            </span>
          )}
        </div>
      );
    })}
  </div>
)}

              </div>
            </div>
          </div>
        );
      })}

      {/*<button
        type="button"
        onClick={addVariant}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        + Add Variant
      </button>*/}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default StepTwoVariant;