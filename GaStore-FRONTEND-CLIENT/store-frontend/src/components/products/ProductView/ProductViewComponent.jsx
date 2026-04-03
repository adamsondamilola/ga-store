'use client';
import { useState, useMemo } from 'react';
import { FiShoppingCart, FiStar, FiTruck, FiShield, FiChevronLeft, FiChevronRight, FiZap, FiLock } from 'react-icons/fi';
import ProductImageGallery from './ProductImageGallery';
import SelectedOptionsDisplay from './SelectedOptionsDisplay';
import ProductDetailsSection from './ProductDetailsSelection';
import ProductReviews from '../ProductReviews';
import FeaturedProductListMain from '../FeaturedProductListMain';
import RatingStars from '@/components/RatingStars';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import formatNumberToCurrency from '@/utils/numberToMoney';
import AppImages from '@/constants/Images';
import Styles from '@/constants/Styles';
import endpointsPath from '@/constants/EndpointsPath';
import { stringToSLug } from '@/utils/stringToSlug';
import ProductListByCategory from '../ProductsByCategory';

export default function ProductViewComponent({ productData, productReviews }) {
  // State management
  //const [selectedVariant, setSelectedVariant] = useState(productData?.variants?.[0] || null);
  const [selectedVariant, setSelectedVariant] = useState(() => {
  return productData?.variants?.find(v => v.stockQuantity > 0) || productData?.variants?.[0] || null;
  });
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [hasSelectedItem, setHasSelectedItem] = useState(false);
  const navigate = useRouter();

  // Memoized derived values
  const selectedColor = useMemo(() => selectedVariant?.color || null, [selectedVariant]);
  const imagesToShow = useMemo(() => 
    selectedVariant?.images?.length > 0 ? selectedVariant.images : productData?.images || []
  , [selectedVariant, productData]);

  const { price, originalPrice } = useMemo(() => {
    if (!selectedVariant?.pricingTiers?.length) return { price: 0, originalPrice: 0 };
    const sorted = [...selectedVariant.pricingTiers].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    return {
      price: sorted[0].pricePerUnit,
      originalPrice: sorted[0].pricePerUnitGlobal || sorted[0].pricePerUnit
    };
  }, [selectedVariant]);

  const discount = useMemo(() => 
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  , [price, originalPrice]);

  // Handlers
  const handleTierSelect = (tier) => {
    const matchingVariant = productData?.variants.find(v => v.id === tier.variantId);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      setSelectedTier(tier);
      setQuantity(tier.minQuantity);
    }
  };

  const handleVariantChange = (variant) => {
    if (!variant) return;
    setSelectedVariant(variant);
    setQuantity(1);
    setSelectedTier(null);
    setSelectedImage(0);
  };

  const handleAddToCart = () => {
    if (!selectedVariant?.stockQuantity) {
      toast.error('This item is out of stock');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.variantId === selectedVariant.id);
//      alert(JSON.stringify(selectedVariant));

    if (existingIndex !== -1) {
      setHasSelectedItem(true)
      //cart[existingIndex].quantity += quantity;
      cart[existingIndex].quantity = quantity;
    } else {
      setHasSelectedItem(true)
      cart.push({
        id: productData.id,
        variantId: selectedVariant.id,
        variantName: selectedVariant?.name || 'Standard',
        pricingTiers: selectedVariant?.pricingTiers || [],
        selectedTier: selectedVariant?.pricingTiers?.[0] || null,
        name: productData.name,  
        price,
        originalPrice,
        weight: selectedVariant?.weight,
        stockQuantity: selectedVariant.stockQuantity,
        quantity, 
        pricingTiers: selectedVariant.pricingTiers,
        unitPrice: getTieredPrice(selectedVariant.pricingTiers, quantity),
        image: selectedVariant.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl || AppImages.default
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!selectedVariant?.stockQuantity) {
      toast.error('This item is out of stock');
      return;
    }
    if (!hasSelectedItem) {
      toast.error('No item added to cart from this product');
      return;
    }
    navigate.push('/checkout');
  };

  // Helper functions
  const getTieredPrice = (tiers, qty) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sorted.find(t => qty >= t.minQuantity);
    return tier?.pricePerUnit || sorted[sorted.length-1]?.pricePerUnit || 0;
  };

const PricingTierCard = ({ tier, isSelected, onSelect, selectedVariant }) => {
  const isDisabled = selectedVariant?.stockQuantity < tier.minQuantity;

  return (
    <div
      className={`flex-shrink-0 w-32 p-3 border rounded-lg shadow-sm transition-all 
        ${isDisabled 
          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
          : isSelected 
            ? 'border-blue-500 bg-blue-50 cursor-pointer' 
            : 'bg-white hover:border-blue-300 cursor-pointer'
        }`}
      onClick={() => !isDisabled && onSelect(tier)}
      aria-disabled={isDisabled}
      aria-label={`Select ${tier.minQuantity}+ quantity at ${formatNumberToCurrency(tier.pricePerUnit.toFixed(2))} each`}
    >
      <div className="text-sm text-gray-500">Min Qty</div>
      <div className="font-bold text-lg">{tier.minQuantity}+</div>
      <div className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-blue-600'}`}>
        {formatNumberToCurrency(tier.pricePerUnit.toFixed(2))}
      </div>
      {isSelected && !isDisabled && (
        <div className="text-xs text-green-600 mt-1">Selected</div>
      )}
      {isDisabled && (
        <div className="text-xs text-gray-400 mt-1">Qty too low</div>
      )}
    </div>
  );
};


  const SpecItem = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'col-span-1 md:col-span-2' : ''}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-medium ${!value && 'text-gray-400'}`}>
        {value || 'Not specified'}
      </p>
    </div>
  );

  if (!productData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="md:hidden flex items-center text-gray-600 hover:text-black mb-4"
        aria-label="Go back"
      >
        <FiChevronLeft className="mr-1" /> Back
      </button> 

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-4 md:p-6 rounded-lg shadow-sm">
        {/* Product Images */}
        <div className="lg:sticky lg:top-4">
          <ProductImageGallery 
            imagesToShow={imagesToShow} 
            product={productData} 
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-1 mb-3">
  {/* Home - Always shown */}
  <Link href="/" className="hover:text-blue-600">Home</Link>
  
  {/* Brand */}
  {productData.brand?.name && (
    <>
      <FiChevronRight className="mx-1" aria-hidden="true" />
      <Link href={`/product?search=${productData.brand.name}`} className="hover:text-blue-600 max-w-[80px] truncate">
        {productData.brand.name}
      </Link>
    </>
  )}
  
  {/* Category */}
  {productData.category?.name && (
    <>
      <FiChevronRight className="mx-1" aria-hidden="true" />
      <Link href={`/product/category/${stringToSLug(productData.category.name)}`} className="hover:text-blue-600 max-w-[80px] truncate">
        {productData.category.name}
      </Link>
    </>
  )}
  
  {/* Subcategory */}
  {productData.subCategory?.name && (
    <>
      <FiChevronRight className="mx-1" aria-hidden="true" />
      <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}`} className="hover:text-blue-600 max-w-[80px] truncate">
        {productData.subCategory.name}
      </Link>
    </>
  )}
  
  {/* Product Type */}
  {productData.productType?.name && (
    <>
      <FiChevronRight className="mx-1" aria-hidden="true" />
      <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}/${stringToSLug(productData.productType.name)}`} className="hover:text-blue-600 max-w-[80px] truncate">
        {productData.productType.name}
      </Link>
    </>
  )}
  
  {/* Product Sub Type */}
  {productData.productSubType?.name && (
    <>
      <FiChevronRight className="mx-1" aria-hidden="true" />
      <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}/${stringToSLug(productData.productType.name)}/${stringToSLug(productData.productSubType.name)}`} className="hover:text-blue-600 ">
        {productData.productSubType.name}
      </Link>
    </>
  )}
</nav>

          {/* Product Name */}
          <h1 className="text-2xl sm:text-3xl font-bold">{productData?.brand?.name} - {productData.name}</h1>

          {/* Highlights */}
          {productData.highlights && (
            <div className="space-y-2">
              <h2 className="font-medium text-lg">Key Benefits:</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {productData.highlights.split('\r\n').filter(Boolean).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <RatingStars rating={productReviews?.metadata?.AverageRating} />
            <span className="text-sm text-blue-500">
              ({productReviews?.totalRecords || '0'} reviews)
            </span>
          </div>

          {/* Bulk Pricing */}
          {selectedVariant?.pricingTiers?.length > 0 && (
            <section aria-labelledby="bulk-pricing-heading">
              <h3 id="bulk-pricing-heading" className="text-sm font-medium text-gray-700 mb-2">
                Price
              </h3>
              <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                {selectedVariant.pricingTiers
  .sort((a, b) => a.minQuantity - b.minQuantity)
  .map((tier) => (
    <PricingTierCard 
      key={tier.id}
      tier={tier}
      isSelected={selectedTier?.id === tier.id}
      onSelect={handleTierSelect}
      selectedVariant={selectedVariant} 
    />
  ))
                }
              </div>
            </section>
          )}

          {/* Variants Section */}
          {productData?.variants?.length > 0 && (
            <div className="space-y-6">
              {/* Size Selector */}
              {productData?.subCategory?.hasSizes && selectedVariant?.size && selectedVariant?.size != "null" && (
                <section aria-labelledby="size-selector">
                  <h3 id="size-selector" className="text-sm font-semibold mb-2">
                    Size: <span className='font-bold'>{selectedVariant?.size}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map(v => v.size))].filter(Boolean).map((size) => {
                      const variant = productData.variants.find(
                        v => v.size === size 
                        //&& (!productData.subCategory?.hasColors || v.color === selectedColor)
                      );
                      return (
                        <button
                          key={size}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`
                            px-3 py-1.5 text-sm sm:px-4 sm:py-2 border rounded-md transition-colors
                            ${selectedVariant?.size === size 
                              ? 'bg-blue-100 border-blue-500 text-blue-800 font-medium' 
                              : 'border-gray-300 hover:bg-gray-50'
                            }
                            ${variant?.stockQuantity < 1 && 'opacity-50 cursor-not-allowed'}
                          `}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select size ${size}`}
                        >
                          {size}
                          {variant?.stockQuantity < 1 && (
                            <span className="ml-1 text-xs text-red-500">(Out of stock)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

               {/* Style Selector */}
              {productData?.subCategory?.hasStyles && selectedVariant?.style && selectedVariant?.style != "null" && (
                <section aria-labelledby="size-selector">
                  <h3 id="size-selector" className="text-sm font-semibold mb-2">
                    Style: <span className='font-bold'>{selectedVariant?.style}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map(v => v.style))].filter(Boolean).map((style) => {
                      const variant = productData.variants.find(
                        v => v.style === style 
                        //&& (!productData.subCategory?.hasColors || v.color === selectedColor)
                      );
                      return (
                        <button
                          key={style}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`
                            px-3 py-1.5 text-sm sm:px-4 sm:py-2 border rounded-md transition-colors
                            ${selectedVariant?.style === style 
                              ? 'bg-blue-100 border-blue-500 text-blue-800 font-medium' 
                              : 'border-gray-300 hover:bg-gray-50'
                            }
                            ${variant?.stockQuantity < 1 && 'opacity-50 cursor-not-allowed'}
                          `}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select size ${style}`}
                        >
                          {style}
                          {variant?.stockQuantity < 1 && (
                            <span className="ml-1 text-xs text-red-500">(Out of stock)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Color Selector */}
              {productData?.subCategory?.hasColors && (
                <section aria-labelledby="color-selector">
                  <h3 id="color-selector" className="text-sm font-semibold mb-2 flex">
                    Color: <div style={{backgroundColor: `${selectedColor?.toLowerCase()}`}} class={`ml-1 w-4 h-4 rounded-full`}></div>
                    <span className='ml-1 font-bold'>{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map(v => v.color))].filter(Boolean).map((color) => {
                      const variant = productData.variants.find(
                        v => v.color === color 
                       // && (!productData.subCategory?.hasSizes || v.size === selectedVariant?.size)
                      );
                      return (
                        <button
                          key={color}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`p-1 border-2 rounded-md ${
                            selectedColor === color 
                              ? 'border-blue-500' 
                              : 'border-transparent'
                          } ${!variant?.stockQuantity && 'opacity-50 cursor-not-allowed'}`}
                          disabled={!variant?.stockQuantity}
                          aria-label={`Select color ${color}`}
                        >
                          <img
                            src={variant?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl}
                            alt={color}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-sm"
                            width={64}
                            height={64}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}


              {/* Variant Selector */}
              {selectedVariant.name && selectedVariant?.name != "null" && (
                <section aria-labelledby="size-selector">
                  <h3 id="size-selector" className="text-sm font-semibold mb-2">
                   {productData?.variants?.length > 1? "Options:" : "Option:"} <span className='font-bold'>{selectedVariant?.name}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map(v => v.name))].filter(Boolean).map((name) => {
                      const variant = productData.variants.find(
                        v => v.name === name 
                        //&& (!productData.subCategory?.hasColors || v.color === selectedColor)
                      );
                      return (
                        <button
                          key={name}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`
                            px-3 py-1.5 text-sm sm:px-4 sm:py-2 border rounded-md transition-colors
                            ${selectedVariant?.name === name 
                              ? 'bg-blue-100 border-blue-500 text-blue-800 font-medium' 
                              : 'border-gray-300 hover:bg-gray-50'
                            }
                            ${variant?.stockQuantity < 1 && 'opacity-50 cursor-not-allowed'}
                          `}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select name ${name}`}
                        >
                          {name}
                          {variant?.stockQuantity < 1 && (
                            <span className="ml-1 text-xs text-red-500">(Out of stock)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Product Specs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Weight */}
            {productData.weight && !isNaN(productData.weight) && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-500 uppercase">Weight</p>
                <p className="text-sm font-medium mt-1">
                  {productData.weight} g
                </p>
              </div>
            )}
            
            {/* Color */}
            {selectedColor && selectedColor != "null" && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-500 uppercase">Color</p>
                <p className="text-sm font-medium mt-1">{selectedColor}</p>
              </div>
            )}
            
            {/* Size */}
            {selectedVariant?.size && selectedVariant?.size != "null" && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-medium text-gray-500 uppercase">Size</p>
                <p className="text-sm font-medium mt-1">{selectedVariant.size}</p>
              </div>
            )}
          </div>

          {/* Selected Options */}
          <SelectedOptionsDisplay
            selectedVariant={selectedVariant}
            selectedColor={selectedColor}
            quantity={quantity}
            price={selectedTier?.pricePerUnit || price}
            pricingTiers={selectedVariant?.pricingTiers}
            onQuantityChange={(newQty) => {
              setQuantity(newQty);
              if (selectedTier && newQty < selectedTier.minQuantity) {
                setSelectedTier(null);
              }
            }}
            defaultImage={imagesToShow?.[0]?.imageUrl}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.stockQuantity}
              className={`flex-1 py-3 px-4 rounded-lg transition flex items-center justify-center font-medium ${
                selectedVariant?.stockQuantity 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Add to cart"
            >
              <FiShoppingCart className="mr-2" />
              {selectedVariant?.stockQuantity ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant?.stockQuantity}
              className={`flex-1 py-3 px-4 rounded-lg transition flex items-center justify-center font-medium ${
                selectedVariant?.stockQuantity 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Buy now"
            >
              <FiZap className="mr-2" />
              Buy Now
            </button>
          </div>

          {/* Secure Checkout */}
          <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500">
            <FiLock className="mr-1.5" aria-hidden="true" />
            Secure Checkout
          </div>

          {/* Warranty Info */}
          {productData.specifications?.warrantyDuration && (
            <section aria-labelledby="warranty-info">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FiShield className="text-gray-500 mr-2" aria-hidden="true" />
                  <h3 id="warranty-info" className="font-medium">
                    {productData.specifications.warrantyDuration} Warranty
                  </h3>
                </div>
                {productData.specifications.productWarranty && (
                  <p className="text-sm text-gray-600">
                    {productData.specifications.productWarranty}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Product Details and Reviews */} 
      <div className='grid grid-cols-1 md:grid-cols-1 gap-5 mt-8'>
        <ProductDetailsSection 
          productData={productData} 
          selectedVariant={selectedVariant}
          description={productData.description}
        />

        <ProductReviews 
          productId={productData.id} 
          initialReviews={productReviews}
        />
      </div>

      {/* Related Products */} 
      <section aria-labelledby="related-products" className="bg-white p-5 rounded-lg mt-8 shadow-sm">
        <h2 id="related-products" className={Styles.pageTitle}>Related Products</h2>
        <ProductListByCategory 
          endpointsPath={endpointsPath.product} 
          search={productData?.category?.name} 
          pageSize={10}
        />
      </section>
    </div>
  );
}