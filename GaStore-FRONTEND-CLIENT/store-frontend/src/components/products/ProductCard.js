'use client';
import AppImages from '@/constants/Images';
import formatNumberToCurrency from '@/utils/numberToMoney';
import { stringToSLug } from '@/utils/stringToSlug';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiX, FiStar, FiPackage } from 'react-icons/fi';

export default function ProductCard({ product, viewAll = true, featured = false, className = '' }) {
  const [isInCart, setIsInCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalPreviewImage, setModalPreviewImage] = useState(null);
  const [selectedTiers, setSelectedTiers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [variantQuantities, setVariantQuantities] = useState({});
  const getSafeImageSrc = (imageUrl) => {
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl === AppImages.loading) {
      return AppImages.default;
    }

    return imageUrl;
  };
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = AppImages.default;
  };

  // Helper to get product data from either structure
  const getProductData = () => {
    if (featured) {
      return product?.product || product;
    }
    return product;
  };

  // Get all price variants and tiers
  const getPriceVariants = () => {
    const productData = getProductData();
    
    // Handle different property names
    const variants = productData?.variantsDto || productData?.variants || [];
    if (variants.length === 0) return [];
    
    return variants.map((variant, index) => {
      // Handle different tier property names
      const pricingTiers = variant.pricingTiersDto || variant.pricingTiers || [];
      const sortedTiers = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);
      const lowestTier = sortedTiers[0];
      
      return {
        variantId: variant.id,
        variantName: variant.name || `Standard ${index + 1}`,
        weight: variant.weight,
        stockQuantity: variant.stockQuantity,
        images: variant.images,
        pricingTiers: sortedTiers,
        lowestPrice: lowestTier?.pricePerUnit || 0,
        originalPrice: lowestTier?.pricePerUnitGlobal || lowestTier?.pricePerUnit || 0
      };
    }).filter(variant => variant.pricingTiers.length > 0);
  };

  const getFromPrice = () => {
    const priceVariants = getPriceVariants();
    if (priceVariants.length === 0) return 0;
    
    // Find the absolute lowest price across all variants and tiers
    const allPrices = priceVariants.flatMap(variant => 
      variant.pricingTiers.map(tier => tier.pricePerUnit)
    );
    
    return Math.min(...allPrices);
  };

  const productData = getProductData();
  const priceVariants = getPriceVariants();

  // Save product to recently viewed when clicked
  const saveToRecentlyViewed = () => {
    try {
      const productData = getProductData();
      const recentProducts = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const productToSave = {
        id: productData?.id,
        name: productData?.name,
        weight: productData?.variants?.[0]?.weight,
        image: productData?.variants?.[0]?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl || AppImages.default,
        price: currentPrice,
        originalPrice: originalPrice,
        stockQuantity: productData?.variants?.[0]?.stockQuantity,
        viewedAt: new Date().toISOString()
      };
      
      // Remove if already exists 
      const updatedRecent = recentProducts.filter(p => p.id !== productData?.id);
      // Add new product to beginning
      updatedRecent.unshift(productToSave);
      // Keep only last 20 products
      const limitedRecent = updatedRecent.slice(0, 20);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(limitedRecent));
    } catch (e) {
      console.error("Error saving to recently viewed:", e);
    }
  };

  // Check cart status function
  const checkCartStatus = () => {
    try {
      const productData = getProductData();
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const cartItem = cart.find(item => item.id === productData?.id);
      
      if (cartItem) {
        setIsInCart(true);
        setQuantity(cartItem.quantity || 1);
        // Use price from cart if available
        if (cartItem.price) {
          setCurrentPrice(cartItem.price);
        }
        if (cartItem.originalPrice) {
          setOriginalPrice(cartItem.originalPrice);
        }
      } else {
        setIsInCart(false);
        setQuantity(1);
      }
    } catch (e) {
      console.error("Error checking cart status:", e);
      setIsInCart(false);
      setQuantity(1);
    }
  };

  // Initialize selected variant and tier
  useEffect(() => {
    const priceVariants = getPriceVariants();
    
    if (priceVariants.length > 0) {
      const defaultVariant = priceVariants[0];
      setSelectedVariant(defaultVariant);
      
      // Initialize selected tiers and quantities for all variants
      const initialTiers = {};
      const initialQuantities = {};
      
      priceVariants.forEach(variant => {
        initialTiers[variant.variantId] = variant.pricingTiers[0];
        initialQuantities[variant.variantId] = 0;
      });
      
      setSelectedTiers(initialTiers);
      setVariantQuantities(initialQuantities);
      
      // Set initial prices directly from the tier
      if (defaultVariant.pricingTiers[0]) {
        const tier = defaultVariant.pricingTiers[0];
        setCurrentPrice(tier.pricePerUnit);
        setOriginalPrice(tier.pricePerUnitGlobal || tier.pricePerUnit);
      }

      setModalPreviewImage(
        defaultVariant?.images?.[0]?.imageUrl ||
        productData?.images?.[0]?.imageUrl ||
        AppImages.default
      );
    }

    // Check initial cart status
    checkCartStatus();
  }, [productData?.id, productData?.variants, productData?.variantsDto]);

  useEffect(() => {
    if (selectedVariant) {
      setModalPreviewImage(
        selectedVariant?.images?.[0]?.imageUrl ||
        productData?.images?.[0]?.imageUrl ||
        AppImages.default
      );
    }
  }, [selectedVariant, productData?.images]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      checkCartStatus();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const calculateDiscount = (current, original) => {
    if (original <= 0 || current >= original) return 0;
    const discount = ((original - current) / original) * 100;
    return Math.round(discount * 100) / 100;
  };

  const updateCartQuantity = (newQuantity) => {
    if (newQuantity < 1) return;
    
    const productData = getProductData();
    let cart;
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      console.error("Error parsing cart:", e);
      cart = [];
    }

    const itemIndex = cart.findIndex(item => item.id === productData?.id);
    
    if (itemIndex !== -1) {
      if (newQuantity === 0) {
        cart.splice(itemIndex, 1);
        setIsInCart(false);
        setQuantity(1);
        toast.success('Removed from cart');
      } else {
        cart[itemIndex].quantity = newQuantity;
        cart[itemIndex].price = currentPrice;
        cart[itemIndex].originalPrice = originalPrice;
        setQuantity(newQuantity);
      }
      
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
      } catch (e) {
        console.error("Error saving cart:", e);
      }
    }
  };

  const addToCartDirect = () => {
    const productData = getProductData();
    const priceVariants = getPriceVariants();
    const hasMultipleOptions = priceVariants.length > 1 || (priceVariants[0]?.pricingTiers.length > 1);

    if (!hasMultipleOptions) {
      // Simple product - use the current price
      let cart;
      try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      } catch (e) {
        console.error("Error parsing cart:", e);
        cart = [];
      }

      const variant = priceVariants[0];
      const cartItem = {
        id: productData?.id,
        name: productData?.name,
        price: currentPrice,
        unitPrice: currentPrice,
        originalPrice: originalPrice,
        weight: variant?.weight,
        stockQuantity: variant?.stockQuantity,
        image: variant?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl || AppImages.default,
        quantity: quantity,
        variantId: variant?.variantId,
        variantName: variant?.variantName || 'Standard',
        pricingTiers: variant?.pricingTiers || [],
        selectedTier: variant?.pricingTiers?.[0] || null
      };

      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(item => item.id === productData?.id);

      if (existingItemIndex !== -1) {
        cart[existingItemIndex] = cartItem;
      } else {
        cart.push(cartItem);
      }

      try {
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        toast.success('Added to cart');
        setIsInCart(true);
      } catch (e) {
        console.error("Error saving cart:", e);
        toast.error('Failed to add to cart');
      }
    } else {
      // Complex product - show options modal
      setShowOptionsModal(true);
    }
  };

  const addToCartWithOptions = () => {
    const productData = getProductData();
    const priceVariants = getPriceVariants();
    let cart;
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      console.error("Error parsing cart:", e);
      cart = [];
    }

    // Add each variant with its selected quantity and tier
    priceVariants.forEach(variant => {
      const variantQty = variantQuantities[variant.variantId] || 0;
      
      if (variantQty > 0) {
        const selectedTier = selectedTiers[variant.variantId] || variant.pricingTiers[0];
        const priceToUse = selectedTier?.pricePerUnit || variant.lowestPrice;
        const originalPriceToUse = selectedTier?.pricePerUnitGlobal || selectedTier?.pricePerUnit || variant.originalPrice;

        const cartItem = {
          id: productData?.id,
          name: productData?.name,
          price: priceToUse,
          unitPrice: priceToUse,
          originalPrice: originalPriceToUse,
          weight: variant.weight,
          stockQuantity: variant.stockQuantity,
          image: variant.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl || AppImages.default,
          quantity: variantQty,
          variantId: variant.variantId,
          variantName: variant.variantName,
          pricingTiers: variant.pricingTiers || [],
          selectedTier: selectedTier || null
        };

        // Check if item already exists in cart (by product id and variant id)
        const existingItemIndex = cart.findIndex(item => 
          item.id === productData?.id && item.variantId === variant.variantId
        );

        if (existingItemIndex !== -1) {
          if (variantQty > 0) {
            cart[existingItemIndex] = cartItem;
          } else {
            cart.splice(existingItemIndex, 1);
          }
        } else if (variantQty > 0) {
          cart.push(cartItem);
        }
      }
    });

    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Added to cart');
      setIsInCart(true);
      setShowOptionsModal(false);
    } catch (e) {
      console.error("Error saving cart:", e);
      toast.error('Failed to add to cart');
    }
  };

  const updateVariantQuantity = (variantId, newQuantity) => {
    const variant = priceVariants.find(item => item.variantId === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }

    setVariantQuantities(prev => ({
      ...prev,
      [variantId]: Math.max(0, newQuantity)
    }));
  };

  const updateSelectedTier = (variantId, tier) => {
    const variant = priceVariants.find(item => item.variantId === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }

    setSelectedTiers(prev => ({
      ...prev,
      [variantId]: tier
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(variantQuantities).reduce((total, qty) => total + qty, 0);
  };

  const getTotalPrice = () => {
    const priceVariants = getPriceVariants();
    return priceVariants.reduce((total, variant) => {
      const variantQty = variantQuantities[variant.variantId] || 0;
      const selectedTier = selectedTiers[variant.variantId] || variant.pricingTiers[0];
      const variantPrice = selectedTier?.pricePerUnit || variant.lowestPrice;
      return total + (variantPrice * variantQty);
    }, 0);
  };

  const fromPrice = getFromPrice();
  const discount = calculateDiscount(currentPrice, originalPrice);
  const hasMultipleOptions = priceVariants.length > 1 || (priceVariants[0]?.pricingTiers.length > 1);

  // Get the lowest price from all variants for display
  const getLowestPrice = () => {
    if (priceVariants.length === 0) return 0;
    return Math.min(...priceVariants.map(v => v.lowestPrice));
  };

  // Get the price to display - always ensure we have a valid price
  const getDisplayPrice = () => {
    if (currentPrice > 0) return currentPrice;
    return getLowestPrice();
  };

  const displayPrice = getDisplayPrice();
  const modalGalleryImages = [
    ...(selectedVariant?.images?.map((image) => getSafeImageSrc(image?.imageUrl)).filter(Boolean) || []),
    ...(productData?.images?.map((image) => getSafeImageSrc(image?.imageUrl)).filter(Boolean) || [])
  ].filter((image, index, arr) => arr.indexOf(image) === index);
  const brandName = productData?.brand?.name;
  const totalStock = priceVariants.reduce((total, variant) => total + (variant?.stockQuantity || 0), 0);
  const activeImage = getSafeImageSrc(selectedVariant?.images?.[0]?.imageUrl || priceVariants[0]?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl);
  const quickMeta = selectedVariant?.weight ? `${(parseFloat(selectedVariant.weight) / 1000).toFixed(1)}kg` : null;
  const optionLabel = hasMultipleOptions ? `${priceVariants.length} option${priceVariants.length > 1 ? 's' : ''}` : null;
  const primaryTag = discount > 0 ? `${discount}% OFF` : (hasMultipleOptions ? 'Multi option' : 'In stock');
  const secondaryMeta = totalStock > 0 ? `${totalStock} available` : 'Out of stock';

  return (
    <>
      <div className={`group relative h-full overflow-hidden rounded-[18px] border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${className}`}>
        <div className={viewAll ? "relative aspect-[0.94] w-full overflow-hidden bg-[#f7f7f5]" : "relative h-24 w-full overflow-hidden bg-[#f7f7f5]"}>
          <Link 
            href={`/product/${stringToSLug(productData?.name)}?id=${productData?.id}`}
            onClick={saveToRecentlyViewed}
          >
            <img
              src={activeImage}
              alt={productData?.name}
              className={`h-full w-full object-cover transition-transform duration-300 ${
                viewAll || !featured ? "group-hover:scale-105" : ""
              }`}
              loading="lazy"
              onError={handleImageError}
            />
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
            <div className="pointer-events-auto inline-flex max-w-[70%] items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
              {primaryTag}
            </div>

            <button 
              onClick={addToCartDirect}
              className="pointer-events-auto relative rounded-full border border-white/80 bg-white/95 p-2 text-gray-800 shadow-sm transition-all hover:bg-white"
              aria-label={isInCart ? 'Add more of this item to cart' : 'Add to cart'}
            >
              <FiShoppingCart className="text-base" />
              {isInCart && quantity > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold leading-none text-white">
                  {quantity}
                </span>
              )}
            </button>
          </div>

          <div className={`absolute inset-x-0 bottom-0 ${
            viewAll ? "translate-y-full group-hover:translate-y-0 h-16" : "translate-y-full group-hover:translate-y-0 h-12"
          } transition-transform duration-300 bg-gradient-to-t from-black/50 via-black/10 to-transparent`}>
            {isInCart && !hasMultipleOptions ? (
              <div className={`absolute ${
                viewAll ? "bottom-3 w-11/12" : "bottom-2 w-10/12"
              } left-1/2 -translate-x-1/2 flex items-center justify-center bg-white rounded-md overflow-hidden shadow-sm`}>
                <button 
                  onClick={() => updateCartQuantity(quantity - 1)}
                  className="px-3 py-2 text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  <FiMinus className="text-lg" />
                </button>
                <div className="flex-1 text-center font-medium text-gray-800 flex items-center justify-center space-x-1">
                  <FiShoppingCart className="text-green-500" size={14} />
                  <span>{quantity}</span>
                  <span className="text-xs text-gray-500">in cart</span>
                </div>
                <button 
                  onClick={() => updateCartQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-800 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  aria-label="Increase quantity"
                  disabled={quantity >= (selectedVariant?.stockQuantity || priceVariants[0]?.stockQuantity || 99)}
                >
                  <FiPlus className="text-lg" />
                </button>
              </div>
            ) : (
              <button 
                onClick={addToCartDirect}
                className={`absolute ${
                  viewAll ? "bottom-3 w-11/12 py-2" : "bottom-2 w-10/12 py-1.5"
                } left-1/2 -translate-x-1/2 px-4 rounded-md flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-gray-800 shadow-sm`}
                aria-label="Add to cart"
              >
                <FiShoppingCart className="text-lg" />
                <span className="font-medium text-sm whitespace-nowrap">
                  {hasMultipleOptions ? 'Quick Add' : 'Add to Cart'}
                </span>
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-2.5 p-3">
          <Link 
            href={`/product/${stringToSLug(productData?.name)}?id=${productData?.id}`}
            onClick={saveToRecentlyViewed}
          >
            <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 text-gray-800 sm:text-sm">
              {productData?.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
            {brandName && (
              <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
                {brandName}
              </span>
            )}
            {optionLabel && (
              <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
                {optionLabel}
              </span>
            )}
            {quickMeta && (
              <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
                {quickMeta}
              </span>
            )}
          </div>

          <div className="flex items-end gap-2">
            <span className="text-xl font-bold leading-none text-[#f97316]">
              {formatNumberToCurrency(displayPrice)}
            </span>
            {(viewAll || !featured) && discount > 0 && originalPrice > currentPrice && (
              <span className="pb-0.5 text-xs text-gray-400 line-through">
                {formatNumberToCurrency(originalPrice)}
              </span>
            )}
          </div>

          {!featured && hasMultipleOptions && fromPrice < displayPrice && (
            <div className="text-[11px] font-medium text-gray-500">
              From {formatNumberToCurrency(fromPrice)}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <FiStar className="text-[12px] text-[#f59e0b]" />
              <span className="font-medium text-gray-700">{discount > 0 ? 'Hot deal' : 'Popular item'}</span>
            </div>
            <div className="truncate">{secondaryMeta}</div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <FiPackage className="text-[12px]" />
              <span>{hasMultipleOptions ? 'Quick Add available' : 'Ready to add'}</span>
            </div>
            <button
              type="button"
              onClick={addToCartDirect}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
            >
              {hasMultipleOptions ? 'Quick Add' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-[72rem] overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="max-w-[85%]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Quick Add</p>
                <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-gray-900">{productData?.name}</h3>
                <p className="mt-1 text-xs text-gray-500">Choose your preferred option and quantity</p>
              </div>
              <button 
                onClick={() => setShowOptionsModal(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <FiX size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid max-h-[calc(88vh-84px)] gap-0 overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-gray-200 bg-[#fbfbfb] p-4 lg:border-b-0 lg:border-r">
                <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-gray-200">
                  <img
                    src={getSafeImageSrc(modalPreviewImage || selectedVariant?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl)}
                    alt={productData?.name}
                    className="h-[250px] w-full object-cover sm:h-[340px]"
                    onError={handleImageError}
                  />
                </div>

                {modalGalleryImages.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {modalGalleryImages.slice(0, 6).map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setModalPreviewImage(image)}
                        className={`overflow-hidden rounded-2xl border transition-all ${
                          modalPreviewImage === image
                            ? 'border-gray-900 ring-1 ring-gray-900'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={getSafeImageSrc(image)}
                          alt={`${productData?.name} preview ${index + 1}`}
                          className="h-16 w-12 object-cover"
                          onError={handleImageError}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 lg:p-5">
                <div className="mb-4 border-b border-gray-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Multi-option item
                    </span>
                    {discount > 0 && (
                      <span className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                        Save {discount}%
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1.5">
                    <span className="text-2xl font-semibold tracking-tight text-gray-950">
                      {formatNumberToCurrency(getTotalQuantity() > 0 ? getTotalPrice() : displayPrice)}
                    </span>
                    {originalPrice > displayPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatNumberToCurrency(originalPrice)}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {getTotalQuantity() > 0
                      ? `${getTotalQuantity()} item${getTotalQuantity() > 1 ? 's' : ''} selected across variants`
                      : `Starting from ${formatNumberToCurrency(fromPrice)} depending on selected option`}
                  </p>
                </div>

                <div className="space-y-3">
                  {priceVariants.map(variant => {
                  const variantQty = variantQuantities[variant.variantId] || 0;
                  const selectedTier = selectedTiers[variant.variantId] || variant.pricingTiers[0];
                  const variantPrice = selectedTier?.pricePerUnit || variant.lowestPrice;
                  const variantTotal = variantPrice * variantQty;
                  const hasMultipleTiers = variant.pricingTiers.length > 1;
                  const isActiveVariant = selectedVariant?.variantId === variant.variantId;
                  
                  return (
                    <div
                      key={variant.variantId}
                      className={`rounded-[20px] border p-3 transition-all ${
                        isActiveVariant ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVariant(variant);
                            setModalPreviewImage(
                              variant.images?.[0]?.imageUrl ||
                              productData?.images?.[0]?.imageUrl ||
                              AppImages.default
                            );
                          }}
                          className="overflow-hidden rounded-2xl border border-gray-200"
                        >
                          <img
                            src={getSafeImageSrc(variant.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl)}
                            alt={variant.variantName}
                            className="h-16 w-12 object-cover"
                            onError={handleImageError}
                          />
                        </button>

                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setModalPreviewImage(
                                variant.images?.[0]?.imageUrl ||
                                productData?.images?.[0]?.imageUrl ||
                                AppImages.default
                              );
                            }}
                            className="text-left"
                          >
                            <span className="block text-sm font-semibold text-gray-900">{variant.variantName}</span>
                          </button>
                          {variant.weight && (
                            <span className="mt-1 block text-xs text-gray-500">
                              {(parseFloat(variant.weight)/1000).toFixed(1) || 0.1}kg
                            </span>
                          )}

                          <div className="mt-2">
                            <span className="text-base font-semibold text-gray-900">
                              {formatNumberToCurrency(variantPrice)}
                            </span>
                            {selectedTier?.pricePerUnitGlobal && selectedTier.pricePerUnit < selectedTier.pricePerUnitGlobal && (
                              <span className="ml-2 text-xs text-gray-400 line-through">
                                {formatNumberToCurrency(selectedTier.pricePerUnitGlobal)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ml-auto flex items-center rounded-full border border-gray-200 bg-white px-1 py-1 shadow-sm">
                          <button
                            onClick={() => updateVariantQuantity(variant.variantId, variantQty - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                            aria-label="Decrease quantity"
                            disabled={variantQty <= 0}
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold text-gray-900">{variantQty}</span>
                          <button
                            onClick={() => updateVariantQuantity(variant.variantId, variantQty + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                            aria-label="Increase quantity"
                            disabled={variantQty >= (variant.stockQuantity || 99)}
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>

                      {hasMultipleTiers && (
                        <div className="mt-3">
                          <h5 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Pricing options</h5>
                          <div className="flex space-x-2 overflow-x-auto pb-2">
                            {variant.pricingTiers.map((tier, index) => {
                              const isSelected = selectedTier?.minQuantity === tier.minQuantity;
                              const tierDiscount = calculateDiscount(tier.pricePerUnit, tier.pricePerUnitGlobal || tier.pricePerUnit);
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => updateSelectedTier(variant.variantId, tier)}
                                  className={`w-38 flex-shrink-0 rounded-2xl border p-2.5 text-left transition-all ${
                                    isSelected
                                      ? 'border-gray-900 bg-white shadow-sm'
                                      : 'border-gray-200 bg-white hover:border-gray-400'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <span className="block text-xs font-medium text-gray-900">
                                        {tier.minQuantity && tier.maxQuantity 
                                          ? `${tier.minQuantity}-${tier.maxQuantity} units`
                                          : tier.minQuantity 
                                            ? `${tier.minQuantity}+ units`
                                            : 'Single unit'
                                        }
                                      </span>
                                      {tierDiscount > 0 && (
                                        <span className="text-[11px] font-medium text-gray-500">
                                          Save {tierDiscount}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-sm font-semibold text-gray-900">
                                        {formatNumberToCurrency(tier.pricePerUnit)}
                                      </span>
                                      {tier.pricePerUnitGlobal && tier.pricePerUnit < tier.pricePerUnitGlobal && (
                                        <span className="text-[11px] line-through text-gray-500">
                                          {formatNumberToCurrency(tier.pricePerUnitGlobal)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && variantQty > 0 && (
                                    <div className="mt-2 text-[11px] font-medium text-gray-700">
                                      Selected for {variantQty} units
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {variantQty > 0 && (
                        <div className="mt-3 border-t border-gray-200 pt-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Variant total</span>
                            <span className="text-base font-semibold text-gray-900">
                              {formatNumberToCurrency(variantTotal)}
                            </span>
                          </div>
                          {hasMultipleTiers && selectedTier && (
                            <div className="mt-1 text-[11px] text-gray-500">
                              Using {selectedTier.minQuantity && selectedTier.maxQuantity 
                                ? `${selectedTier.minQuantity}-${selectedTier.maxQuantity} units`
                                : selectedTier.minQuantity 
                                  ? `${selectedTier.minQuantity}+ units`
                                  : 'Single unit'} pricing
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>

                <div className="mt-4 rounded-[20px] border border-gray-200 bg-[#fafafa] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total quantity</span>
                    <span className="text-sm font-semibold text-gray-900">{getTotalQuantity()} units</span>
                  </div>
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Grand total</span>
                      <span className="text-xl font-semibold tracking-tight text-gray-950">
                        {formatNumberToCurrency(getTotalPrice())}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={addToCartWithOptions}
                    disabled={getTotalQuantity() === 0}
                    className="mt-3 flex w-full items-center justify-center space-x-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <FiShoppingCart size={18} />
                    <span>
                      Add {getTotalQuantity()} to Cart - {formatNumberToCurrency(getTotalPrice())}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
