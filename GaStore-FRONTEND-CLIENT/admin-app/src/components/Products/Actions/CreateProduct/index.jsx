import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import StepOneProductInfo from './step1';
import StepTwoVariant from './step2';
import StepThreeSpecification from './step3';
import requestHandler from '../../../../utils/requestHandler';
import endpointsPath from '../../../../constants/EndpointsPath';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchTags } from '../../../Tags/Actions/TagService';

const steps = [
  { id: 1, title: 'Product Info' },
  { id: 2, title: 'Variants' },
  { id: 3, title: 'Specification' }
];

const CreateProduct = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [productData, setProductData] = useState({
    productInfo: {
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
    tags: [],
    },
    images: [],
    variants: [],
    specification: {},
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const navigate = useNavigate();
  
  // Refs for each step section to detect scroll position
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  const loadTags = async () => {
    const res = await fetchTags("", 1, 20);
    setTags(res.data || []);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await requestHandler.get(`${endpointsPath.category}/full-hierarchy`, true);
        if (res.statusCode === 200) {
          setCategories(res.result.data);
        }
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
    loadTags();
  }, []);

  useEffect(() => {
    if (productData.productInfo?.categoryId) {
      const category = categories.find(c => c.id === productData.productInfo.categoryId);
      setSelectedCategory(category);
      if(productData.productInfo.subCategoryId != null){
      const subCategory = category?.subCategories.find(c => c.id === productData.productInfo.subCategoryId);
      if(subCategory) setSelectedSubCategory(subCategory);
      }
    }
  }, [productData.productInfo?.categoryId, productData.productInfo?.subCategoryId, categories]);

  // Set up scroll detection to highlight the current step
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Get positions of all steps
      const step1Position = step1Ref.current?.offsetTop || 0;
      const step2Position = step2Ref.current?.offsetTop || 0;
      const step3Position = step3Ref.current?.offsetTop || 0;
      
      // Determine which step is currently in view
      if (scrollPosition >= step3Position) {
        setActiveStep(3);
      } else if (scrollPosition >= step2Position) {
        setActiveStep(2);
      } else if (scrollPosition >= step1Position) {
        setActiveStep(1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDataUpdate = useCallback((key, data) => {
    setProductData(prev => {
      if (key === 'productInfo') {
        // For product info, we need to separate images from other data
        const { images, ...productInfo } = data;
        return {
          ...prev,
          productInfo: { ...prev.productInfo, ...productInfo },
          images: images || prev.images
        };
      }else if (key === 'variants') {
        // Ensure variants is always an array
        return {
          ...prev,
          variants: Array.isArray(data) ? data : [data]
        };
      } else {
        return {
          ...prev,
          [key]: data
        };
      }
    });
  }, []);

  const prepareFormData = async () => {
    const formData = new FormData();
    
    // Add product info
    const pd = productData.productInfo;

    (pd.tags || []).forEach((tag, index) => {
  formData.append(`Tags[${index}]`, tag);
});

    formData.append('Id', pd.id);
    formData.append('Name', pd.name);
    formData.append('Description', pd.description);
    formData.append('Highlights', pd.highlights);
    formData.append('PrimaryColor', pd.primaryColor);
    formData.append('Weight', pd.weight);
    formData.append('StockQuantity', pd.stockQuantity);
    formData.append('IsAvailable', pd.isAvailable);
    formData.append('BrandId', pd.brandId);
    formData.append('CategoryId', pd.categoryId);
    formData.append('SubCategoryId', pd.subCategoryId);
    formData.append('ProductTypeId', pd.productTypeId);
    formData.append('ProductSubTypeId', pd.productSubTypeId);

    //formData.append('Tags', pd.tags);
    
    // Add main product images
    productData.images.forEach((image, index) => {
      if (image.file) {
        // This is a new file that needs to be uploaded
        formData.append(`imageFiles`, image.file);
      } else if (typeof image === 'string') {
        // This is an existing image URL (for editing)
        formData.append(`ImageUrls`, image);
      }
    });

    // Add variants
    const variants = Array.isArray(productData.variants) ? productData.variants : [];
    variants.forEach((variant, index) => {
      formData.append(`VariantsDto[${index}].Color`, variant.color || '');
      formData.append(`VariantsDto[${index}].Size`, variant.size || '');
      formData.append(`VariantsDto[${index}].Style`, variant.style || '');
      formData.append(`VariantsDto[${index}].Name`, variant.name || '');
      formData.append(`VariantsDto[${index}].SellerSKU`, variant.sellerSKU || '');
      formData.append(`VariantsDto[${index}].BarCode`, variant.barCode || '');
      formData.append(`VariantsDto[${index}].Weight`, variant.weight.toString() || '0');
      formData.append(`VariantsDto[${index}].StockQuantity`, variant.stockQuantity || 0);
      formData.append(`VariantsDto[${index}].SaleStartDate`, variant.saleStartDate || '');
      formData.append(`VariantsDto[${index}].SaleEndDate`, variant.saleEndDate || '');
      
      // Add variant images
      if (variant.images && variant.images.length > 0) {
        variant.images.forEach((image, imgIndex) => {
          if (image.file) {
            formData.append(`VariantsDto[${index}].imageFiles`, image.file);
          } else if (typeof image === 'string') {
            formData.append(`VariantsDto[${index}].imageUrls`, image);
          }
        });
      }

      // Add variant pricing tiers
      if (variant.pricingTiers && variant.pricingTiers.length > 0) {
        variant.pricingTiers.forEach((tier, tierIndex) => {
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnitGlobal`, tier.pricePerUnitGlobal || 0);
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].MinQuantity`, tier.minQuantity || 1);
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnit`, tier.pricePerUnit || 0);
        });
      }
    });

    // Add specifications
    const spec = productData.specification;

    if (spec) {
      formData.append('SpecificationsDto.Certification', spec.certification || '');
      formData.append('SpecificationsDto.MainMaterial', spec.mainMaterial || '');
      formData.append('SpecificationsDto.MaterialFamily', spec.materialFamily || '');
      formData.append('SpecificationsDto.Model', spec.model || '');
      formData.append('SpecificationsDto.Note', spec.note || '');
      formData.append('SpecificationsDto.ProductionCountry', spec.productionCountry || '');
      formData.append('SpecificationsDto.ProductLine', spec.productLine || '');
      formData.append('SpecificationsDto.Size', spec.size || '');
      formData.append('SpecificationsDto.WarrantyDuration', spec.warrantyDuration || '');
      formData.append('SpecificationsDto.WarrantyType', spec.warrantyType || '');
      formData.append('SpecificationsDto.YouTubeId', spec.youTubeId || '');
      formData.append('SpecificationsDto.Nafdac', spec.nafdac || '');
      formData.append('SpecificationsDto.Fda', spec.fda || '');
      formData.append('SpecificationsDto.FdaApproved', spec.fdaApproved ? 'true' : 'false');
      formData.append('SpecificationsDto.FromTheManufacturer', spec.fromTheManufacturer || '');
      formData.append('SpecificationsDto.Disclaimer', spec.disclaimer  || '');
      formData.append('SpecificationsDto.WhatIsInTheBox', spec.whatIsInTheBox || '');
      formData.append('SpecificationsDto.ProductWarranty', spec.productWarranty || '');
      formData.append('SpecificationsDto.WarrantyAddress', spec.warrantyAddress || '');
    }

    return formData;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!productData.productInfo.name) {
      toast.error('Product name is required');
      scrollToStep(1);
      return;
    }
    
    if (!productData.productInfo.brandId) {
      toast.error('Brand is required');
      scrollToStep(1);
      return;
    }
    
    if (!productData.productInfo.categoryId) {
      toast.error('Category is required');
      scrollToStep(1);
      return;
    }
    
    if (productData.images.length === 0) {
      toast.error('At least one product image is required');
      scrollToStep(1);
      return;
    }
    

    setIsSubmitting(true);
  
    try {
      const formData = await prepareFormData();
      
      // Log form data for debugging (remove in production)
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const response = await requestHandler.postForm(
        endpointsPath.product,
        formData,
        true
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        toast.success('Product created successfully!');
        navigate('/products');
      } else {
        toast.error(response.result?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Product creation error:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToStep = (stepId) => {
    setActiveStep(stepId);
    const element = document.getElementById(`step-${stepId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

return (
  <div className="max-w-7xl mx-auto mt-8 p-4 bg-white rounded-lg shadow-md flex flex-col lg:flex-row gap-6">
    {/* Left Side Navigation */}
    <div className="w-full lg:w-1/4">
      <div className="lg:sticky lg:top-24 bg-white p-4 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Create Product</h2>
        <p className="text-gray-600 text-sm mb-6">Fill out all the required information to create a new product</p>
        
        <div className="space-y-2 mb-6">
          {steps.map(s => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center
                ${s.id === activeStep 
                  ? 'bg-blue-100 border border-blue-300 text-blue-700 shadow-md' 
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              onClick={() => scrollToStep(s.id)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0 ${s.id === activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {s.id}
              </span>
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
        
        {/* Submit Button in Sidebar - Hidden on mobile, shown on tablet+ */}
        <div className="hidden md:block">
          <button
            type="button"
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Product'
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Right Side Content */}
    <div className="w-full lg:w-3/4">
      {/* All Steps Rendered at Once */}
      <div className="space-y-6">
        {/* Step 1 */}
        <div id="step-1" ref={step1Ref} className="p-4 md:p-6 border rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 shrink-0">1</span>
            {steps[0].title}
          </h2>
          <StepOneProductInfo
            data={productData.productInfo}
            categories={categories}
            onChange={data => handleDataUpdate('productInfo', data)}
            tags={tags}
          />
        </div>

        {/* Step 2 */}
        <div id="step-2" ref={step2Ref} className="p-4 md:p-6 border rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 shrink-0">2</span>
            {steps[1].title}
          </h2>
          <StepTwoVariant
            data={productData.variants}
            category={selectedCategory}
            subCategory={selectedSubCategory}
            onChange={data => handleDataUpdate('variants', data)}
          />
        </div>

        {/* Step 3 */}
        <div id="step-3" ref={step3Ref} className="p-4 md:p-6 border rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 shrink-0">3</span>
            {steps[2].title}
          </h2>
          <StepThreeSpecification
            data={productData.specification}
            onChange={data => handleDataUpdate('specification', data)}
          />
        </div>
      </div>

      {/* Submit Button at Bottom - Only show on mobile/tablet */}
      <div className="mt-8 flex justify-end md:hidden">
        <button
          type="button"
          className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Product'
          )}
        </button>
      </div>
    </div>
  </div>
);
};

export default CreateProduct;