import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import StepOneProductInfo from './step1';
import StepTwoVariant from './step2';
import StepThreeSpecification from './step3';
import requestHandler from '../../../../utils/requestHandler';
import endpointsPath from '../../../../constants/EndpointsPath';
import Spinner from '../../../../utils/loader';
import { fetchTags } from '../../../Tags/Actions/TagService';
import { fetchTagsByProductId } from '../../../Tags/Actions/TaggedProductService';
import ProductWorkspaceShell, { ProductSurface } from '../../ProductWorkspaceShell';

const steps = [
  { id: 1, title: 'Product Info' },
  { id: 2, title: 'Variants' },
  { id: 3, title: 'Specification' }
];

const normalizeYouTubeId = (value = '') => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  try {
    const parsedUrl = new URL(trimmedValue);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] || trimmedValue;
    }

    if (host.includes('youtube.com')) {
      const watchId = parsedUrl.searchParams.get('v');
      if (watchId) return watchId;

      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && ['embed', 'shorts'].includes(segments[0])) {
        return segments[1];
      }
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
};

const UpdateProduct = () => {
  const { productId } = useParams();
  const [step, setStep] = useState(1);
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState({
    productInfo: {},
    images: [],
    variants: [],
    pricingTiers: [],
    specification: {},
  });
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

  const navigate = useNavigate();
  // Refs for each step section to detect scroll position
    const step1Ref = useRef(null);
    const step2Ref = useRef(null);
    const step3Ref = useRef(null);

    const scrollToStep = (stepId) => {
    setActiveStep(stepId);
    setStep(stepId);
    const element = document.getElementById(`step-${stepId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
  const loadTags = async () => {
    try {
      const res = await fetchTags('', 1, 50);
      setAllTags(res.data || []);
    } catch (err) {
      toast.error('Failed to load tags');
    }
  };

  const loadExistingTags = async () => {
        const res = await fetchTagsByProductId(productId);
        setExistingTags(res.data || []);
      };

  loadTags();
  loadExistingTags();
}, []);


  useEffect(() => {
    setLoading(true);
    const fetchProductAndCategories = async () => {
      try {
        // Fetch categories
        const categoriesRes = await requestHandler.get(`${endpointsPath.category}/full-hierarchy`, true);
        if (categoriesRes.statusCode === 200) {
          setCategories(categoriesRes.result.data);
        }

        // Fetch product data
        const productRes = await requestHandler.get(
          `${endpointsPath.product}/${productId}`,
          true
        );

        if (productRes.statusCode === 200) {
          const product = productRes.result.data;
          console.log("Source start")
          console.log(product)
          console.log("Source end")
          // Map product data to our state structure
          setProductData({
            productInfo: {
              name: product.name,
              description: product.description,
              highlights: product.highlights,
              weight: product.weight,
              primaryColor: product.primaryColor,
              condition: product.condition ?? 0,
              stockQuantity: product.stockQuantity,
              isAvailable: product.isAvailable,
              isAvailableOnRequest: product.isAvailableOnRequest ?? false,
              brandId: product.brandId,
              categoryId: product.category.id,
              subCategoryId: product.subCategory.id,
              productTypeId: product.productType.id,
              productSubTypeId: product.productSubType.id,
              tags: product.tags
            },
            variants: product.variants.map(variant => ({
              id: variant.id,
              color: variant.color,
              size: variant.size,
              style: variant.style,
              name: variant.name,
              sellerSKU: variant.sellerSKU,
              barCode: variant.barCode,
              weight: variant.weight,
              stockQuantity: variant.stockQuantity,
              saleStartDate: variant.saleStartDate,
              saleEndDate: variant.saleEndDate,
              existingImages: variant.images || [], // This is where variant images should go
              images: variant.images || [], // For new uploaded images
              imageUrls: variant.images || [], // For new uploaded images
              imagesToDelete: [], // For tracking deletions
              pricingTiers: variant.pricingTiers || []
            })),
            images: [], // We'll handle existing images separately
            pricingTiers: product.pricingTiers || [],
            specification: product.specifications || {}
          });

          // Store existing images separately
          setExistingImages(product.images || []);
        }
      } catch (err) {
        toast.error('Failed to load product data');
        //navigate('/products');
      }finally{
        setLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [productId, navigate]);

  useEffect(() => {
    if (productData.productInfo?.categoryId) {
      const category = categories.find(c => c.id === productData.productInfo.categoryId);
      setSelectedCategory(category);
      if(productData.productInfo.subCategoryId != null){
      const subCategory = category?.subCategories.find(c => c.id === productData.productInfo.subCategoryId);
      if(subCategory) setSelectedSubCategory(subCategory);
      }
    }
  }, [productData.productInfo?.categoryId, productData.productInfo.subCategoryId, categories]);

const nextStep = () => {
  const next = step + 1;
  setStep(next);
  setActiveStep(next);
};

const prevStep = () => {
  const prev = step - 1;
  setStep(prev);
  setActiveStep(prev);
};

const handleDataUpdate = (key, data) => {
  console.log('Updating:', key, data);
  
  if (key === 'variants') {
    setProductData(prev => ({
      ...prev,
      variants: data,
    }));
  } else {
    setProductData(prev => ({
      ...prev,
      [key]: data,
    }));
  }
};

  const prepareFormData = () => {
    const formData = new FormData();
    
    // Add product info
    const pd = productData.productInfo;
    
(pd.tags || []).forEach((tag, index) => {
  const value = typeof tag === 'string' ? tag : tag.name;
  formData.append(`Tags[${index}]`, value);
});

    formData.append('Id', productId);
    formData.append('Name', pd.name);
    formData.append('Description', pd.description);
    formData.append('Highlights', pd.highlights);
    formData.append('Weight', pd.weight);
    formData.append('PrimaryColor', pd.primaryColor);
    formData.append('Condition', pd.condition ?? 0);
    formData.append('StockQuantity', pd.stockQuantity);
    formData.append('IsAvailable', pd.isAvailable);
    formData.append('IsAvailableOnRequest', pd.isAvailableOnRequest);
    formData.append('BrandId', pd.brandId);
    formData.append('CategoryId', pd.categoryId);
    formData.append('SubCategoryId', pd.subCategoryId);
    formData.append('ProductTypeId', pd.productTypeId);
    formData.append('ProductSubTypeId', pd.productSubTypeId);

    // Add main product images
    /*productData.images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append(`imageFiles`, image);
      } else {
        // This is an existing image, we might need to handle deletion separately
        formData.append(`ExistingImageIds`, image.id);
      }
    });*/

    productData.images.forEach((image) => {
    if (image instanceof File) {
      // New uploaded file
      formData.append(`imageFiles`, image);
    } else if (image.file) {
      // New file from step component
      formData.append(`imageFiles`, image.file);
    } else if (image.imageUrl || typeof image === 'string') {
      // Existing image
      const imageUrl = typeof image === 'string' ? image : image.imageUrl;
      formData.append(`ImageUrls`, imageUrl);
      formData.append(`existingImages`, imageUrl);
    }
    });

    // Add variants
    const date = new Date();
    productData.variants.forEach((variant, index) => {
      formData.append(`VariantsDto[${index}].Id`, variant.id || '');
      formData.append(`VariantsDto[${index}].Name`, variant.name || '');
      formData.append(`VariantsDto[${index}].Color`, variant.color);
      formData.append(`VariantsDto[${index}].Size`, variant.size);
      formData.append(`VariantsDto[${index}].Style`, variant.style);
      formData.append(`VariantsDto[${index}].SellerSKU`, variant.sellerSKU);
      formData.append(`VariantsDto[${index}].BarCode`, variant.barCode);
      formData.append(`VariantsDto[${index}].weight`, variant.weight?.toString());
      formData.append(`VariantsDto[${index}].StockQuantity`, variant.stockQuantity);
      formData.append(`VariantsDto[${index}].SaleStartDate`, variant.saleStartDate || date.toISOString());
      formData.append(`VariantsDto[${index}].SaleEndDate`, variant.saleEndDate || date.toISOString());
      
      // Add variant images
      if (variant.images) {
        variant.images.forEach((image, imgIndex) => {
          if (image instanceof File) {
            formData.append(`VariantsDto[${index}].imageFiles`, image);
          } else {
            // Existing variant image
            formData.append(`VariantsDto[${index}].ExistingImageIds`, image.id);
          }
        });
      }

      // Add variant pricing tiers
      if (variant.pricingTiers) {
        variant.pricingTiers.forEach((tier, tierIndex) => {
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].Id`, tier.id || '');
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].MinQuantity`, tier.minQuantity);
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnit`, tier.pricePerUnit);
          formData.append(`VariantsDto[${index}].PricingTiersDto[${tierIndex}].PricePerUnitGlobal`, tier.pricePerUnitGlobal);
        });
      }
    });

    // Add global pricing tiers
    productData.pricingTiers.forEach((tier, index) => {
      formData.append(`PricingTiersDto[${index}].Id`, tier.id || '');
      formData.append(`PricingTiersDto[${index}].MinQuantity`, tier.minQuantity);
      formData.append(`PricingTiersDto[${index}].PricePerUnit`, tier.pricePerUnit);
      formData.append(`PricingTiersDto[${index}].PricePerUnitGlobal`, tier.pricePerUnitGlobal || 0);
    });

    // Add product specifications
const spec = productData.specification;

if (spec) {
  formData.append('SpecificationsDto.ProductId', spec.productId);
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
  formData.append('SpecificationsDto.YouTubeId', normalizeYouTubeId(spec.youTubeId || ''));
  formData.append('SpecificationsDto.Nafdac', spec.nafdac || '');
  formData.append('SpecificationsDto.Fda', spec.fda || '');
  formData.append('SpecificationsDto.FdaApproved', spec.fdaApproved?.toString() || '');
  formData.append('SpecificationsDto.FromTheManufacturer', spec.fromTheManufacturer || '');
  formData.append('SpecificationsDto.Disclaimer', spec.disclaimer || '');
  formData.append('SpecificationsDto.WhatIsInTheBox', spec.whatIsInTheBox || '');
  formData.append('SpecificationsDto.ProductWarranty', spec.productWarranty || '');
  formData.append('SpecificationsDto.WarrantyAddress', spec.warrantyAddress || '');
}


    return formData;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const formData = prepareFormData();
      
      const response = await requestHandler.putForm(
        `${endpointsPath.product}/${productId}`,
        formData,
        true
      );

      if (response.statusCode > 200) {
        toast.error(response.result?.message || 'Failed to update product');
        return;
      }

      toast.success('Product updated successfully!');
      navigate(`/products/${productId}/details`);
    } catch (error) {
      console.error('Product update error:', error);
      toast.error(error.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ProductSurface id="step-1" className="scroll-mt-24">
          <div ref={step1Ref} className="p-0">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-[#f97316] text-white rounded-full flex items-center justify-center mr-2">1</span>
              {steps[0].title}
            </h2>
            <StepOneProductInfo
              data={productData.productInfo}
            categories={categories}
            existingImages={existingImages}
            onNext={nextStep}
            onChange={data => handleDataUpdate('productInfo', data)}
            isUpdate={true}
            tags={allTags}
            existingTags={existingTags}
            productId={productId}
            />
          </div>
          </ProductSurface>
        );
      case 2:
        return (
          <ProductSurface id="step-2" className="scroll-mt-24">
          <div ref={step2Ref} className="p-0">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-[#f97316] text-white rounded-full flex items-center justify-center mr-2">2</span>
              {steps[1].title}
            </h2>
            <StepTwoVariant
          data={productData.variants}
          productId={productId}
          category={selectedCategory}
          subCategory={selectedSubCategory}
          onNext={nextStep}
          onBack={prevStep}
          onChange={data => handleDataUpdate('variants', data)}
          isUpdate={true}
        />
          </div>
          </ProductSurface>
        );

        
      /*case 3:
        return (
          <StepThreePricingTier
            data={productData.pricingTiers}
            onNext={nextStep}
            onBack={prevStep}
            onChange={data => handleDataUpdate('pricingTiers', data)}
            isUpdate={true}
          />
        );*/
      case 3:
        return (
          <ProductSurface id="step-3" className="scroll-mt-24">
          <div ref={step3Ref} className="p-0">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-[#f97316] text-white rounded-full flex items-center justify-center mr-2">3</span>
              {steps[2].title}
            </h2>
            <StepThreeSpecification
            data={productData.specification}
            onBack={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onChange={data => handleDataUpdate('specification', data)}
            isUpdate={true}
          />
          </div>
          </ProductSurface>
        );
      default:
        return null;
    }
  };

  return (
    <ProductWorkspaceShell
      eyebrow="Products"
      title="Update product"
      description="Refine product information, variants, and specifications without losing track of where you are in the editing workflow."
      stats={[
        { label: 'Steps', value: steps.length, helper: 'Edit flow' },
        { label: 'Current step', value: activeStep, helper: steps[activeStep - 1]?.title },
        { label: 'Product', value: productId ? 'Loaded' : 'Missing', helper: 'Record' },
      ]}
    >
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
   <Spinner loading={loading} />
      {/* Left Side Navigation */}
      <ProductSurface className="h-fit lg:sticky lg:top-24 mb-6 lg:mb-0">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Update product</h2>
        <p className="text-slate-600 text-sm mb-6">Jump between sections from the sidebar and save your changes when the record is ready.</p>
        
        <div className="space-y-2">
          {steps.map(s => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-colors flex items-center
                ${s.id === activeStep 
                  ? 'bg-orange-50 border border-orange-200 text-orange-700 shadow-sm' 
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              onClick={() => scrollToStep(s.id)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 shrink-0 ${s.id === activeStep ? 'bg-[#f97316] text-white' : 'bg-slate-200 text-slate-600'}`}>
                {s.id}
              </span>
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </ProductSurface>

      <div className="w-full">
        <ProductSurface className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{steps[step - 1].title}</h2>
          <p className="text-slate-500 text-sm mt-1">
            Step {step} of {steps.length}
          </p>
        </ProductSurface>
        {renderStep()}
      </div>
    </div>
    </ProductWorkspaceShell>
  );
};

export default UpdateProduct;
