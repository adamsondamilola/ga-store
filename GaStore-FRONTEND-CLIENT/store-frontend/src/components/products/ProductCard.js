'use client';
import AppImages from '@/constants/Images';
import formatNumberToCurrency from '@/utils/numberToMoney';
import { stringToSLug } from '@/utils/stringToSlug';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiX, FiChevronDown } from 'react-icons/fi';

export default function ProductCard({ product, viewAll = true, featured = false }) {
  const [isInCart, setIsInCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedTiers, setSelectedTiers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [variantQuantities, setVariantQuantities] = useState({});

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
    }

    // Check initial cart status
    checkCartStatus();
  }, [getProductData().id, getProductData().variants]);

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
    setVariantQuantities(prev => ({
      ...prev,
      [variantId]: Math.max(0, newQuantity)
    }));
  };

  const updateSelectedTier = (variantId, tier) => {
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

  const priceVariants = getPriceVariants();
  const fromPrice = getFromPrice();
  const discount = calculateDiscount(currentPrice, originalPrice);
  const hasMultipleOptions = priceVariants.length > 1 || (priceVariants[0]?.pricingTiers.length > 1);
  const productData = getProductData();

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

  return (
    <>
      <div className={`group bg-white shadow rounded-md overflow-hidden hover:shadow-lg transition-all duration-200 relative border border-gray-100 ${
        viewAll ? 'h-full' : 'h-full'
      } ${!featured ? 'rounded-lg shadow-sm hover:shadow-md' : ''}`}>
        {/* Product Image Container */}
        <div className={viewAll ? "relative h-42 w-full aspect-square overflow-hidden" : "relative w-full h-24 overflow-hidden"}>
          <Link 
            href={`/product/${stringToSLug(productData?.name)}?id=${productData?.id}`}
            onClick={saveToRecentlyViewed}
          >
            <img
              src={selectedVariant?.images?.[0]?.imageUrl || priceVariants[0]?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl || AppImages.default}
              alt={productData?.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                viewAll || !featured ? "group-hover:scale-105" : ""
              }`}
              loading="lazy"
            />
          </Link>
          
          {/* Quick Add to Cart Button (shown on hover) */}
          <div className={`absolute inset-x-0 bottom-0 ${
            viewAll ? "translate-y-full group-hover:translate-y-0 h-16" : "translate-y-full group-hover:translate-y-0 h-12"
          } transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent`}>
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
          
          {/* Floating Cart Button */}
          <button 
            onClick={addToCartDirect}
            className={`absolute ${
              viewAll ? "top-2 right-2" : "top-2 right-2"
            } rounded-full p-2 shadow-md transition-all z-10 ${
              isInCart 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-white/90 hover:bg-white text-gray-800'
            }`}
            aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
          >
            <FiShoppingCart className="text-lg" />
          </button>
          
          {/* Discount Badge */}
          {(viewAll || !featured) && discount > 0 && !isInCart && (
            <span className={`absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 ${
              featured ? 'font-bold' : ''
            }`}>
              {featured ? `${discount}% OFF` : `- ${discount}%`}
            </span>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-3">
          <Link 
            href={`/product/${stringToSLug(productData?.name)}?id=${productData?.id}`}
            onClick={saveToRecentlyViewed}
          >
            <h3 className={`font-medium text-gray-900 line-clamp-2 mb-1 ${
              !featured ? 'truncate text-sm md:text-base' : ''
            }`}>
              {productData?.name}
            </h3>
            
            <div className="flex flex-col items-start">
              <span className="font-bold text-lg text-gray-800">
                {formatNumberToCurrency(displayPrice)}
              </span>
              {(viewAll || !featured) && discount > 0 && originalPrice > currentPrice && (
                <div className="flex items-center mt-0.5">
                  <span className="text-sm line-through text-gray-400 mr-2">
                    {formatNumberToCurrency(originalPrice)}
                  </span>
                </div>
              )}
              
              {/* Show "from price" for non-featured cards with multiple options */}
              {!featured && hasMultipleOptions && fromPrice < displayPrice && (
                <span className="text-xs text-blue-500 font-medium">
                  Starting from {formatNumberToCurrency(fromPrice)}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="max-w-[80%]">
                <h3 className="font-semibold text-lg text-gray-900 truncate">{productData?.name}</h3>
                <p className="text-sm text-gray-500">Select variants and quantities</p>
              </div>
              <button 
                onClick={() => setShowOptionsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Variant Selection with Quantity Controls and Bulk Pricing */}
              <div className="space-y-6">
                {priceVariants.map(variant => {
                  const variantQty = variantQuantities[variant.variantId] || 0;
                  const selectedTier = selectedTiers[variant.variantId] || variant.pricingTiers[0];
                  const variantPrice = selectedTier?.pricePerUnit || variant.lowestPrice;
                  const variantTotal = variantPrice * variantQty;
                  const hasMultipleTiers = variant.pricingTiers.length > 1;
                  
                  return (
                    <div key={variant.variantId} className="border border-gray-200 rounded-lg p-4">
                      {/* Variant Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 block text-lg">{variant.variantName}</span>
                          {variant.weight && (
                            <span className="text-xs text-gray-500">
                              {(parseFloat(variant.weight)/1000).toFixed(1) || 0.1}kg
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity Selector */}
                        <div className="flex items-center space-x-3 ml-4">
                          <button
                            onClick={() => updateVariantQuantity(variant.variantId, variantQty - 1)}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                            aria-label="Decrease quantity"
                            disabled={variantQty <= 0}
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium text-lg">{variantQty}</span>
                          <button
                            onClick={() => updateVariantQuantity(variant.variantId, variantQty + 1)}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                            aria-label="Increase quantity"
                            disabled={variantQty >= (variant.stockQuantity || 99)}
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Bulk Pricing - Horizontal Scrollable Cards */}
                      {hasMultipleTiers && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Bulk Pricing Options:</h5>
                          <div className="flex space-x-2 overflow-x-auto pb-2 scrollable scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {variant.pricingTiers.map((tier, index) => {
                              const isSelected = selectedTier?.minQuantity === tier.minQuantity;
                              const tierDiscount = calculateDiscount(tier.pricePerUnit, tier.pricePerUnitGlobal || tier.pricePerUnit);
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => updateSelectedTier(variant.variantId, tier)}
                                  className={`flex-shrink-0 w-48 p-3 rounded-lg border-2 text-left transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-medium text-gray-900 block text-sm">
                                        {tier.minQuantity && tier.maxQuantity 
                                          ? `${tier.minQuantity}-${tier.maxQuantity} units`
                                          : tier.minQuantity 
                                            ? `${tier.minQuantity}+ units`
                                            : 'Single unit'
                                        }
                                      </span>
                                      {tierDiscount > 0 && (
                                        <span className="text-xs text-red-500 font-medium">
                                          Save {tierDiscount}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <span className="font-semibold text-gray-900 block">
                                        {formatNumberToCurrency(tier.pricePerUnit)}
                                      </span>
                                      {tier.pricePerUnitGlobal && tier.pricePerUnit < tier.pricePerUnitGlobal && (
                                        <span className="text-xs line-through text-gray-500">
                                          {formatNumberToCurrency(tier.pricePerUnitGlobal)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && variantQty > 0 && (
                                    <div className="mt-2 text-xs text-blue-600 font-medium">
                                      Selected for {variantQty} units
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Variant Total */}
                      {variantQty > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Variant total:</span>
                            <span className="font-semibold text-green-600 text-lg">
                              {formatNumberToCurrency(variantTotal)}
                            </span>
                          </div>
                          {hasMultipleTiers && selectedTier && (
                            <div className="text-xs text-gray-500 mt-1">
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

              {/* Grand Total Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-semibold">{getTotalQuantity()} units</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Grand Total:</span>
                    <span className="text-green-600 text-xl">
                      {formatNumberToCurrency(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <button
                onClick={addToCartWithOptions}
                disabled={getTotalQuantity() === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <FiShoppingCart size={18} />
                <span>
                  Add {getTotalQuantity()} to Cart - {formatNumberToCurrency(getTotalPrice())}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}