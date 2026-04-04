import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import endpointsPath from '../../../../constants/EndpointsPath';
import requestHandler from '../../../../utils/requestHandler';
import ClassStyle from '../../../../class-styles';
import productColors from '../../../../constants/ProductColors';
import { v4 as uuidv4 } from 'uuid';
import { deleteTaggedProduct } from '../../../Tags/Actions/TaggedProductService';

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const StepOneProductInfo = ({ onNext, onChange, data, existingImages = [], isUpdate = false, tags, existingTags = [], productId, categories }) => {
  const [form, setForm] = useState({
    id: uuidv4(),
    name: '',
    description: '',
    highlights: '',
    weight: '',
    primaryColor: '',
    stockQuantity: 0,
    isAvailable: true,
    brandId: '',
    categoryId: '',
    subCategoryId: '',
    productTypeId: '',
    productSubTypeId: '',
    tags: []
  });

  const [brands, setBrands] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [brandQuery, setBrandQuery] = useState('');
  const [colorQuery, setColorQuery] = useState('');
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // State for filtered categories
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  
  const tagDropdownRef = useRef();
  const colorDropdownRef = useRef();
  const brandDropdownRef = useRef();
  const fileInputRef = useRef();

  const colors = productColors;

  //remove image by url
  const deleteExistingImageByUrl = (image) => {
    //const action = window.confirm('Are you sure you want to delete this image?');
    //if (!action) return;
    setIsUploading(true);
    try {
      const response = requestHandler.deleteReq(`${endpointsPath.productImage}/delete-by-url?imageUrl=${encodeURIComponent(image.imageUrl)}`, true);
    if (response.statusCode === 200) {
      //toast.success('Image deleted successfully');
    } else {
      //toast.error('Failed to delete image');
    }
    } catch (error) { 
      toast.error('Error deleting image');
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize form with data if provided
  useEffect(() => {
    if (data) {
      setForm(prev => ({
        ...prev,
        ...data,
        categoryId: data?.categoryId,
        id: isUpdate ? data.id : prev.id
      }));

      const mergedTags = Array.from(
        new Map(
          [...(data?.tags || []), ...(existingTags || [])]
            .map(tag => [
              typeof tag === 'string' ? tag : tag.id || tag.name,
              typeof tag === 'string' ? { name: tag } : tag
            ])
        ).values()
      );

      setSelectedTags(mergedTags);
      setForm(prev => ({ ...prev, tags: mergedTags }));
      
      // Set selected category objects when data is loaded
      if (data.categoryId && categories) {
        const category = categories.find(c => c.id === data.categoryId);
        setSelectedCategory(category);
        
        if (data.subCategoryId && category) {
          const subCategory = category.subCategories?.find(sc => sc.id === data.subCategoryId);
          setSelectedSubCategory(subCategory);
          
          if (data.productTypeId && subCategory) {
            const productType = subCategory.productTypes?.find(pt => pt.id === data.productTypeId);
            setSelectedProductType(productType);
          }
        }
      }
    }
  }, [data, isUpdate, existingTags, categories]);

  // Set brand query when brand is selected
  useEffect(() => {
    if (form.brandId && brands.length > 0) {
      const selectedBrand = brands.find(b => b.id === form.brandId);
      if (selectedBrand) {
        setBrandQuery(selectedBrand.name);
      }
    }
  }, [form.brandId, brands]);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsRes = await requestHandler.get(`${endpointsPath.brand}?pageNumber=1&pageSize=100`, true);
        if (brandsRes.statusCode === 200) setBrands(brandsRes.result.data);
      } catch (err) {
        toast.error('Failed to load brands');
      }
    };

    fetchBrands();
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setShowBrandDropdown(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      newImages.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [newImages]);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === 'checkbox' ? checked : value;
    
    // Handle category hierarchy changes
    if (name === 'categoryId') {
      const category = categories.find(c => c.id === value);
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      setSelectedProductType(null);
      
      const updatedForm = { 
        ...form, 
        [name]: updatedValue,
        subCategoryId: '',
        productTypeId: '',
        productSubTypeId: ''
      };
      setForm(updatedForm);
      
      // Immediately notify parent of changes
      onChange({ 
        ...updatedForm, 
        images: newImages,
        existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
        imagesToDelete
      });
    } 
    else if (name === 'subCategoryId') {
      const subCategory = selectedCategory?.subCategories?.find(sc => sc.id === value);
      setSelectedSubCategory(subCategory);
      setSelectedProductType(null);
      
      const updatedForm = { 
        ...form, 
        [name]: updatedValue,
        productTypeId: '',
        productSubTypeId: ''
      };
      setForm(updatedForm);
      
      onChange({ 
        ...updatedForm, 
        images: newImages,
        existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
        imagesToDelete
      });
    }
    else if (name === 'productTypeId') {
      const productType = selectedSubCategory?.productTypes?.find(pt => pt.id === value);
      setSelectedProductType(productType);
      
      const updatedForm = { 
        ...form, 
        [name]: updatedValue,
        productSubTypeId: ''
      };
      setForm(updatedForm);
      
      onChange({ 
        ...updatedForm, 
        images: newImages,
        existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
        imagesToDelete
      });
    }
    else {
      const updatedForm = { ...form, [name]: updatedValue };
      setForm(updatedForm);
      
      // Immediately notify parent of changes
      onChange({ 
        ...updatedForm, 
        images: newImages,
        existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
        imagesToDelete
      });
    }
  };

  const updateTags = (updated) => {
    setSelectedTags(updated);
    const updatedForm = { ...form, tags: updated };
    setForm(updatedForm);
    onChange({
      ...updatedForm,
      images: newImages,
      existingImages: existingImages.filter(
        (img) => !imagesToDelete.includes(img.id)
      ),
      imagesToDelete,
    });
  };

  const handleDeleteExistingTag = async (tagId) =>{
    const response = await deleteTaggedProduct(tagId);
    if(response.statusCode == 200){

    }else{
      toast.error(response.message)
    }
  }

  const handleTagRemove = async (tag) => {
    const tagKey = (tag.id ?? tag.name).toString().toLowerCase();

    // Optimistically update the UI
    const updatedTags = selectedTags.filter(
      (t) => (t.id ?? t.name).toString().toLowerCase() !== tagKey
    );
    setSelectedTags(updatedTags);
    setForm((prev) => ({ ...prev, tags: updatedTags }));
    onChange({
      ...form,
      tags: updatedTags,
      images: newImages,
      existingImages: existingImages.filter(
        (img) => !imagesToDelete.includes(img.id)
      ),
      imagesToDelete,
    });

    // Delete from backend (if tag has an ID)
    if (tag.id && isUpdate) {
      try {
        if (!window.confirm(`Remove tag "${tag.name}" from this product?`)) return;

        const response = await deleteTaggedProduct(tag.id, productId);

        if (response.statusCode === 200) {
          toast.success(`Tag "${tag.name}" removed successfully`);
          window.location.reload();
        } else {
          /*
          toast.error(response.message || "Failed to remove tag");
          // Revert on failure
          setSelectedTags((prev) => [...prev, tag]);
          setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));*/
        }
      } catch (error) {
        toast.error("An error occurred while deleting the tag");
        // Revert on error
        setSelectedTags((prev) => [...prev, tag]);
        setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      }
    }
  };

  const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);

  if ((existingImages.length - imagesToDelete.length + newImages.length + files.length) > MAX_IMAGES) {
    toast.error(`Maximum ${MAX_IMAGES} images allowed`);
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
    formData.append('productId', productId);

    const response = await requestHandler.postForm(`${endpointsPath.productImage}`, formData, true);

    if (response.statusCode < 202) {
      const uploadedImages = response.result.data;

      const uploadedWithPreview = uploadedImages.map((img, idx) => ({
        ...img,
        id: img.id,
        imageUrl: img.imageUrl,
        preview: URL.createObjectURL(files[idx]),
        isNew: true
      }));

      setNewImages(prev => {
        const updated = [...prev, ...uploadedWithPreview];

        // Immediately notify parent
        onChange({
          ...form,
          images: updated,
          existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
          imagesToDelete
        });

        return updated;
      });

      return;
    }
  } catch (error) {
    toast.error("Error uploading image");
  } finally {
    setIsUploading(false);
    e.target.value = "";
  }
};


  const handleRemoveImage = (index, isExisting) => {
    const action = window.confirm('Are you sure you want to delete this image?');
    if (!action) return;
  if (isExisting || displayImages[index].isNew) {
    deleteExistingImageByUrl(displayImages[index]);
    const existingIndex = index;
    const existingImage = displayImages[existingIndex];
    setImagesToDelete(prev => [...prev, existingImage.id]);
    if(!displayImages[index].isNew) return;
  }

  // NEW IMAGE
  const existingCount = existingImages.filter(img => !imagesToDelete.includes(img.id)).length;
  const newImageIndex = index - existingCount; // FIXED

  const imageToRemove = newImages[newImageIndex];
  if (imageToRemove?.preview) {
    URL.revokeObjectURL(imageToRemove.preview);
  }

  setNewImages(prev => prev.filter((_, i) => i !== newImageIndex));
};


  const handleDragStart = (e, index, isExisting) => {
    e.dataTransfer.setData('imageIndex', index);
    e.dataTransfer.setData('isExisting', isExisting);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = e.dataTransfer.getData('imageIndex');
    const isExisting = e.dataTransfer.getData('isExisting') === 'true';
    
    if (dragIndex === null) return;

    if (isExisting) {
      // For now, we won't allow reordering existing images as it would require server updates
      toast.info('Reordering existing images requires server updates. Please upload new images to change order.');
      return;
    }

    const updatedImages = [...newImages];
    const [draggedImage] = updatedImages.splice(dragIndex, 1);
    updatedImages.splice(dropIndex, 0, draggedImage);
    setNewImages(updatedImages);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateForm = useCallback(() => {
    const errors = [];
    if (!form.name.trim()) errors.push('Product name is required');
    if (!form.brandId) errors.push('Brand is required');
    if (!form.categoryId) errors.push('Category is required');
    if (!form.description.trim()) errors.push('Description is required');
    if (!form.highlights.trim()) errors.push('Highlights are required');
    if (form.stockQuantity < 0) errors.push('Stock quantity cannot be negative');
    //if (selectedTags.length === 0) errors.push('At least one tag is recommended');
    const totalImages = (existingImages.length - imagesToDelete.length) + newImages.length;
    //if (totalImages === 0) errors.push('At least one image is required');
    
    return errors;
  }, [form, existingImages, imagesToDelete, newImages]);

  const handleNextStep = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    onChange({ 
      ...form, 
      images: newImages,
      existingImages: existingImages.filter(img => !imagesToDelete.includes(img.id)),
      imagesToDelete
    });
    onNext();
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(brandQuery.toLowerCase())
  );
  
  const filteredColors = colors.filter(color => 
    color.toLowerCase().includes(colorQuery.toLowerCase())
  );

  // Combine existing (not marked for deletion) and new images for display
  const displayImages = [
    ...existingImages.filter(img => !imagesToDelete.includes(img.id)),
    ...newImages
  ];

  return (
    <div className="border space-y-6 p-4 rounded relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium">Product Name <span className='text-red-500'>*</span></label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className={ClassStyle.input}
            placeholder="Enter product name"
          />
        </div>

        {/* Brand Search Dropdown */}
        <div className="relative" ref={brandDropdownRef}>
          <label className="block text-sm font-medium">Brand <span className='text-red-500'>*</span></label>
          <input
            type="text"
            placeholder="Search Brand"
            value={brandQuery}
            onChange={(e) => {
              setBrandQuery(e.target.value);
              setShowBrandDropdown(true);
            }}
            onFocus={() => setShowBrandDropdown(true)}
            className={ClassStyle.input}
          />
          {showBrandDropdown && (
            <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
              {filteredBrands.map((brand, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setForm(prev => ({ ...prev, brandId: brand.id }));
                    setBrandQuery(brand.name);
                    setShowBrandDropdown(false);
                  }}
                >
                  {brand.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Main Category Select */}
        <div>
          <label className="block text-sm font-medium">Main Category <span className='text-red-500'>*</span></label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleInputChange}
            className={ClassStyle.input}
          >
            <option value="">Select Main Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sub Category Select */}
        <div>
          <label className="block text-sm font-medium">Sub Category</label>
          <select
            name="subCategoryId"
            value={form.subCategoryId}
            onChange={handleInputChange}
            className={ClassStyle.input}
            disabled={!selectedCategory}
          >
            <option value="">Select Sub Category</option>
            {selectedCategory?.subCategories?.map(subCat => (
              <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
            ))}
          </select>
          {!selectedCategory && (
            <p className="text-xs text-gray-500 mt-1">Select a main category first</p>
          )}
        </div>

        {/* Product Type Select */}
        <div>
          <label className="block text-sm font-medium">Product Type</label>
          <select
            name="productTypeId"
            value={form.productTypeId}
            onChange={handleInputChange}
            className={ClassStyle.input}
            disabled={!selectedSubCategory}
          >
            <option value="">Select Product Type</option>
            {selectedSubCategory?.productTypes?.map(productType => (
              <option key={productType.id} value={productType.id}>{productType.name}</option>
            ))}
          </select>
          {!selectedSubCategory && (
            <p className="text-xs text-gray-500 mt-1">Select a sub category first</p>
          )}
        </div>

        {/* Product Sub Type Select */}
        <div>
          <label className="block text-sm font-medium">Product Sub Type</label>
          <select
            name="productSubTypeId"
            value={form.productSubTypeId}
            onChange={handleInputChange}
            className={ClassStyle.input}
            disabled={!selectedProductType}
          >
            <option value="">Select Product Sub Type</option>
            {selectedProductType?.productSubTypes?.map(subType => (
              <option key={subType.id} value={subType.id}>{subType.name}</option>
            ))}
          </select>
          {!selectedProductType && (
            <p className="text-xs text-gray-500 mt-1">Select a product type first</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium">Description <span className='text-red-500'>*</span></label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          rows="3"
          className={ClassStyle.input}
          placeholder="Enter detailed product description"
        />
      </div>

      {/* Highlights */}
      <div>
        <label className="block text-sm font-medium">Highlights <span className='text-red-500'>*</span></label>
        <textarea
          name="highlights"
          value={form.highlights}
          onChange={handleInputChange}
          rows="2"
          className={ClassStyle.input}
          placeholder="Enter key product features (one per line)"
        />
      </div>

      {/* Tag Selection */}
      <div className="relative" ref={tagDropdownRef}>
        <label className="block text-sm font-medium">Tags</label>
        <input
          type="text"
          placeholder="Search or add tags"
          value={tagQuery}
          onChange={(e) => {
            setTagQuery(e.target.value);
            setShowTagDropdown(true);
          }}
          onFocus={() => setShowTagDropdown(true)}
          className={ClassStyle.input}
        />

        {/* Dropdown */}
        {showTagDropdown && (
          <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
            {tags
              ?.filter((t) => {
                const query = tagQuery.toLowerCase();
                const isMatch = t.name.toLowerCase().includes(query);
                const alreadySelected = selectedTags.some(
                  (sel) =>
                    (sel.id ?? sel.name).toString().toLowerCase() ===
                    (t.id ?? t.name).toString().toLowerCase()
                );
                return isMatch && !alreadySelected;
              })
              .map((t, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    const newTag = { id: t.id ?? null, name: t.name };
                    updateTags([...selectedTags, newTag]);
                    setTagQuery('');
                    setShowTagDropdown(false);
                  }}
                >
                  {t.name}
                </li>
              ))}

            {/* Manual tag entry */}
            {tagQuery &&
              !tags?.some(
                (t) => t.name.toLowerCase() === tagQuery.toLowerCase()
              ) && (
                <li
                  className="px-4 py-2 text-blue-600 cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    const newTag = { id: null, name: tagQuery.trim() };
                    const exists = selectedTags.some(
                      (sel) =>
                        (sel.id ?? sel.name).toString().toLowerCase() ===
                        newTag.name.toLowerCase()
                    );
                    if (newTag.name && !exists) {
                      updateTags([...selectedTags, newTag]);
                    }
                    setTagQuery('');
                    setShowTagDropdown(false);
                  }}
                >
                  + Add "{tagQuery}"
                </li>
              )}
          </ul>
        )}

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag) => (
              <span
                key={tag.id ?? tag.name}
                className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full flex items-center gap-1"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAvailable"
          name="isAvailable"
          checked={form.isAvailable}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isAvailable" className="text-sm">Available for Sale</label>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium">Upload Images <span className='text-red-500'>*</span></label>
        <div className="mt-1 flex items-center gap-4">
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading || displayImages.length >= MAX_IMAGES}
            className={`px-4 py-2 rounded ${isUploading || displayImages.length >= MAX_IMAGES ? 
              'bg-gray-300 cursor-not-allowed' : 
              'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isUploading ? 'Uploading...' : 'Select Images'}
          </button>
          <span className="text-sm text-gray-500">
            {displayImages.length}/{MAX_IMAGES} images (max {MAX_IMAGE_SIZE/1024/1024}MB each)
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
            disabled={isUploading || displayImages.length >= MAX_IMAGES}
          />
        </div>
      </div>

      {/* Image Previews */}
      {displayImages.length > 0 && (
        <div className="flex gap-4 mt-4 overflow-x-auto max-w-full pb-2">
          
          {displayImages.map((image, index) => {
            const isExisting = index < (existingImages.length - imagesToDelete.length);
            //const imageUrl = isExisting ? image.imageUrl : image.preview;
            const imageUrl = image.imageUrl || image.preview;

            return (
              <div
                key={isExisting ? `existing-${image.id}` : `new-${index}`}
                className="relative w-32 h-32 flex-shrink-0 cursor-move group"
                //draggable={!isExisting}
                //onDragStart={(e) => handleDragStart(e, index, isExisting)}
                //onDragOver={handleDragOver}
                //onDrop={(e) => handleDrop(e, index)}
              >
                <img
                  src={imageUrl}
                  alt={`preview-${index}`}
                  className="w-full h-full object-cover rounded border group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index, isExisting)}
                    className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleNextStep}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
          disabled={isUploading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepOneProductInfo;