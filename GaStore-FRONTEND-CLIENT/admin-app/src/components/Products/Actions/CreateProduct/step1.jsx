import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import endpointsPath from '../../../../constants/EndpointsPath';
import requestHandler from '../../../../utils/requestHandler';
import ClassStyle from '../../../../class-styles';
import productColors from '../../../../constants/ProductColors';
import { v4 as uuidv4 } from 'uuid';

const StepOneProductInfo = ({ onNext, onChange, data, tags, categories }) => {
  const MAX_IMAGES = 10;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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
    tags: ''
  });

  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);
  const [brandQuery, setBrandQuery] = useState('');
  const [colorQuery, setColorQuery] = useState('');
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  // State for filtered categories
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  
  const tagDropdownRef = useRef();
  const colorDropdownRef = useRef();
  const brandDropdownRef = useRef();
  const fileInputRef = useRef();

  const colors = productColors;

  // Initialize form with data if provided
  useEffect(() => {
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
      if (data.images) setImages(data.images);
      if (data?.tags) setSelectedTags(data.tags);
      
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
  }, [data, categories]);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsRes = await requestHandler.get(endpointsPath.brand, true);
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
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // Debounce form updates (without images)
  useEffect(() => {
    const handler = setTimeout(() => {
      const { ...rest } = form;
      onChange({ ...rest }); // send only form data, no images
    }, 500);

    return () => clearTimeout(handler);
  }, [form]);

  // Sync images immediately
  useEffect(() => {
    onChange({ images });
  }, [images]);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'categoryId') {
      const category = categories.find(c => c.id === value);
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      setSelectedProductType(null);
      
      setForm(prev => ({ 
        ...prev, 
        categoryId: value,
        subCategoryId: '',
        productTypeId: '',
        productSubTypeId: ''
      }));
    } 
    else if (name === 'subCategoryId') {
      const subCategory = selectedCategory?.subCategories?.find(sc => sc.id === value);
      setSelectedSubCategory(subCategory);
      setSelectedProductType(null);
      
      setForm(prev => ({ 
        ...prev, 
        subCategoryId: value,
        productTypeId: '',
        productSubTypeId: ''
      }));
    }
    else if (name === 'productTypeId') {
      const productType = selectedSubCategory?.productTypes?.find(pt => pt.id === value);
      setSelectedProductType(productType);
      
      setForm(prev => ({ 
        ...prev, 
        productTypeId: value,
        productSubTypeId: ''
      }));
    }
    else if (name === 'productSubTypeId') {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > MAX_IMAGES) {
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
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      toast.error('Error processing images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const removed = images[index];
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('imageIndex', index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = e.dataTransfer.getData('imageIndex');
    if (dragIndex === null) return;

    const updatedImages = [...images];
    const [draggedImage] = updatedImages.splice(dragIndex, 1);
    updatedImages.splice(dropIndex, 0, draggedImage);
    setImages(updatedImages);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(brandQuery.toLowerCase())
  );
  
  const filteredColors = colors.filter(color => 
    color.toLowerCase().includes(colorQuery.toLowerCase())
  );

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

        {/* Category Select */}
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

        {/* Primary Color */}
        {/* <div className="relative" ref={colorDropdownRef}>
          <label className="block text-sm font-medium">Primary Color</label>
          <input
            type="text"
            placeholder="Search or select color"
            value={form.primaryColor}
            onChange={(e) => {
              setForm(prev => ({ ...prev, primaryColor: e.target.value }));
              setColorQuery(e.target.value);
              setShowColorDropdown(true);
            }}
            onFocus={() => setShowColorDropdown(true)}
            className={ClassStyle.input}
          />
          {showColorDropdown && (
            <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
              {filteredColors.map((color, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setForm(prev => ({ ...prev, primaryColor: color }));
                    setColorQuery(color);
                    setShowColorDropdown(false);
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color.toLowerCase() }}
                  ></div>
                  {color}
                </li>
              ))}
            </ul>
          )}
        </div>*/}

        {/* Weight */}
        {/*<div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleInputChange}
            className={ClassStyle.input}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>*/}

        {/* Stock Quantity */}
        {/*<div>
          <label className="block text-sm font-medium">Stock Quantity</label>
          <input
            type="number"
            name="stockQuantity"
            value={form.stockQuantity}
            onChange={handleInputChange}
            className={ClassStyle.input}
            placeholder="0"
            min="0"
          />
        </div>*/}
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

        {showTagDropdown && (
          <ul className="absolute z-10 bg-white border mt-1 w-full max-h-40 overflow-y-auto shadow-lg rounded">
            {tags
              .filter((t) =>
                t.name.toLowerCase().includes(tagQuery.toLowerCase())
              )
              .map((t, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    if (!selectedTags.includes(t.name)) {
                    const updated = [...selectedTags, t.name];
                    setSelectedTags(updated);
                    setForm(prev => ({ ...prev, tags: updated }));
                    onChange({ ...form, tags: updated });
                  }
                    setTagQuery('');
                    setShowTagDropdown(false);
                  }}
                >
                  {t.name}
                </li>
              ))}

            {/* Allow manual tag entry */}
            {tagQuery &&
              !tags.some((t) => t.name.toLowerCase() === tagQuery.toLowerCase()) && (
                <li
                  className="px-4 py-2 text-blue-600 cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    const newTag = tagQuery.trim();
                    if (newTag && !selectedTags.includes(newTag)) {
                      const updated = [...selectedTags, newTag];
                      setSelectedTags(updated);
                      onChange({ tags: updated });
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

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag, i) => (
              <span
                key={i}
                className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const updated = selectedTags.filter((t) => t !== tag);
                    setSelectedTags(updated);
                    onChange({ tags: updated });
                  }}
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
            disabled={isUploading || images.length >= MAX_IMAGES}
            className={`px-4 py-2 rounded ${isUploading || images.length >= MAX_IMAGES ? 
              'bg-gray-300 cursor-not-allowed' : 
              'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isUploading ? 'Uploading...' : 'Select Images'}
          </button>
          <span className="text-sm text-gray-500">
            {images.length}/{MAX_IMAGES} images (max {MAX_IMAGE_SIZE/1024/1024}MB each)
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
            disabled={isUploading || images.length >= MAX_IMAGES}
          />
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex gap-4 mt-4 overflow-x-auto max-w-full pb-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative w-32 h-32 flex-shrink-0 cursor-move group"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <img
                src={typeof image === 'string' ? image : image.preview}
                alt={`preview-${index}`}
                className="w-full h-full object-cover rounded border group-hover:opacity-75 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default StepOneProductInfo;