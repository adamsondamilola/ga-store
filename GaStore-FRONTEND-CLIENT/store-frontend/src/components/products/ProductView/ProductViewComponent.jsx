'use client';
import { useMemo, useState } from 'react';
import { FiShoppingCart, FiTruck, FiShield, FiChevronLeft, FiChevronRight, FiZap, FiLock } from 'react-icons/fi';
import ProductImageGallery from './ProductImageGallery';
import SelectedOptionsDisplay from './SelectedOptionsDisplay';
import ProductDetailsSection from './ProductDetailsSelection';
import ProductReviews from '../ProductReviews';
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
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return productData?.variants?.find((v) => v.stockQuantity > 0) || productData?.variants?.[0] || null;
  });
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [hasSelectedItem, setHasSelectedItem] = useState(false);
  const navigate = useRouter();

  const selectedColor = useMemo(() => selectedVariant?.color || null, [selectedVariant]);
  const imagesToShow = useMemo(
    () => (selectedVariant?.images?.length > 0 ? selectedVariant.images : productData?.images || []),
    [selectedVariant, productData]
  );

  const { price, originalPrice } = useMemo(() => {
    if (!selectedVariant?.pricingTiers?.length) return { price: 0, originalPrice: 0 };
    const sorted = [...selectedVariant.pricingTiers].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    return {
      price: sorted[0].pricePerUnit,
      originalPrice: sorted[0].pricePerUnitGlobal || sorted[0].pricePerUnit
    };
  }, [selectedVariant]);

  const discount = useMemo(
    () => (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
    [price, originalPrice]
  );

  const getTieredPrice = (tiers, qty) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sorted.find((t) => qty >= t.minQuantity);
    return tier?.pricePerUnit || sorted[sorted.length - 1]?.pricePerUnit || 0;
  };

  const handleTierSelect = (tier) => {
    const matchingVariant = productData?.variants.find((v) => v.id === tier.variantId);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      setSelectedTier(tier);
      setQuantity(tier.minQuantity);
      setSelectedImage(0);
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
    const existingIndex = cart.findIndex((item) => item.variantId === selectedVariant.id);

    if (existingIndex !== -1) {
      setHasSelectedItem(true);
      cart[existingIndex].quantity = quantity;
    } else {
      setHasSelectedItem(true);
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

  const PricingTierCard = ({ tier, isSelected, onSelect, selectedVariant: currentVariant }) => {
    const isDisabled = currentVariant?.stockQuantity < tier.minQuantity;

    return (
      <div
        className={`w-36 flex-shrink-0 rounded-2xl border p-3 transition-all ${
          isDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60'
            : isSelected
              ? 'cursor-pointer border-gray-900 bg-white shadow-sm'
              : 'cursor-pointer border-gray-200 bg-white hover:border-gray-400'
        }`}
        onClick={() => !isDisabled && onSelect(tier)}
        aria-disabled={isDisabled}
        aria-label={`Select ${tier.minQuantity}+ quantity at ${formatNumberToCurrency(tier.pricePerUnit.toFixed(2))} each`}
      >
        <div className="text-[11px] uppercase tracking-wide text-gray-500">Min qty</div>
        <div className="mt-1 text-lg font-semibold text-gray-900">{tier.minQuantity}+</div>
        <div className="mt-1 text-sm font-semibold text-gray-800">{formatNumberToCurrency(tier.pricePerUnit.toFixed(2))}</div>
        {isSelected && !isDisabled && <div className="mt-2 text-[11px] font-medium text-gray-700">Selected</div>}
        {isDisabled && <div className="mt-2 text-[11px] text-gray-400">Qty too low</div>}
      </div>
    );
  };

  if (!productData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }

  const currentDisplayPrice = selectedTier?.pricePerUnit || price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:py-6">
      <button
        onClick={() => window.history.back()}
        className="mb-4 flex items-center text-gray-600 transition hover:text-black md:hidden"
        aria-label="Go back"
      >
        <FiChevronLeft className="mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-start">
        <div className="lg:sticky lg:top-4">
          <ProductImageGallery
            imagesToShow={imagesToShow}
            product={productData}
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
          />
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>

            {productData.brand?.name && (
              <>
                <FiChevronRight className="mx-1" aria-hidden="true" />
                <Link href={`/product?search=${productData.brand.name}`} className="max-w-[80px] truncate hover:text-gray-900">
                  {productData.brand.name}
                </Link>
              </>
            )}

            {productData.category?.name && (
              <>
                <FiChevronRight className="mx-1" aria-hidden="true" />
                <Link href={`/product/category/${stringToSLug(productData.category.name)}`} className="max-w-[80px] truncate hover:text-gray-900">
                  {productData.category.name}
                </Link>
              </>
            )}

            {productData.subCategory?.name && (
              <>
                <FiChevronRight className="mx-1" aria-hidden="true" />
                <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}`} className="max-w-[80px] truncate hover:text-gray-900">
                  {productData.subCategory.name}
                </Link>
              </>
            )}

            {productData.productType?.name && (
              <>
                <FiChevronRight className="mx-1" aria-hidden="true" />
                <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}/${stringToSLug(productData.productType.name)}`} className="max-w-[80px] truncate hover:text-gray-900">
                  {productData.productType.name}
                </Link>
              </>
            )}

            {productData.productSubType?.name && (
              <>
                <FiChevronRight className="mx-1" aria-hidden="true" />
                <Link href={`/product/category/${stringToSLug(productData.category.name)}/${stringToSLug(productData.subCategory.name)}/${stringToSLug(productData.productType.name)}/${stringToSLug(productData.productSubType.name)}`} className="hover:text-gray-900">
                  {productData.productSubType.name}
                </Link>
              </>
            )}
          </nav>

          <div className="border-b border-gray-100 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                <FiTruck className="text-xs" />
                Fast delivery
              </span>
              {discount > 0 && (
                <span className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Save {discount}%
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-semibold leading-tight text-gray-950 sm:text-3xl">
              {productData.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <RatingStars rating={productReviews?.metadata?.AverageRating} />
                <span className="font-medium text-gray-700">{productReviews?.metadata?.AverageRating?.toFixed?.(1) || '0.0'}</span>
              </div>
              <span>{productReviews?.totalRecords || '0'} reviews</span>
              {productData.brand?.name && <span>Brand: {productData.brand.name}</span>}
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-3xl font-semibold tracking-tight text-gray-950">
                {formatNumberToCurrency(currentDisplayPrice)}
              </span>
              {originalPrice > currentDisplayPrice && (
                <span className="text-lg text-gray-400 line-through">{formatNumberToCurrency(originalPrice)}</span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {selectedVariant?.stockQuantity > 0 ? `In stock: ${selectedVariant.stockQuantity} available` : 'Currently out of stock'}
            </p>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-[#fafafa] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <FiTruck className="mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery estimate</p>
                    <p className="text-xs text-gray-500">Ships quickly with secure handling</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiShield className="mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Protected purchase</p>
                    <p className="text-xs text-gray-500">Quality-checked and backed by store support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedVariant?.pricingTiers?.length > 0 && (
            <section aria-labelledby="bulk-pricing-heading" className="mt-5">
              <h3 id="bulk-pricing-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Pricing Tiers
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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
                  ))}
              </div>
            </section>
          )}

          {productData?.variants?.length > 0 && (
            <div className="mt-5 space-y-5">
              {productData?.subCategory?.hasSizes && selectedVariant?.size && selectedVariant?.size !== 'null' && (
                <section aria-labelledby="size-selector">
                  <h3 id="size-selector" className="mb-2 text-sm font-semibold text-gray-800">
                    Size: <span className="font-bold">{selectedVariant?.size}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map((v) => v.size))].filter(Boolean).map((size) => {
                      const variant = productData.variants.find((v) => v.size === size);
                      return (
                        <button
                          key={size}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedVariant?.size === size ? 'border-gray-900 bg-gray-900 font-medium text-white' : 'border-gray-300 hover:bg-gray-50'
                          } ${variant?.stockQuantity < 1 && 'cursor-not-allowed opacity-50'}`}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select size ${size}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {productData?.subCategory?.hasStyles && selectedVariant?.style && selectedVariant?.style !== 'null' && (
                <section aria-labelledby="style-selector">
                  <h3 id="style-selector" className="mb-2 text-sm font-semibold text-gray-800">
                    Style: <span className="font-bold">{selectedVariant?.style}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map((v) => v.style))].filter(Boolean).map((style) => {
                      const variant = productData.variants.find((v) => v.style === style);
                      return (
                        <button
                          key={style}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedVariant?.style === style ? 'border-gray-900 bg-gray-900 font-medium text-white' : 'border-gray-300 hover:bg-gray-50'
                          } ${variant?.stockQuantity < 1 && 'cursor-not-allowed opacity-50'}`}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select style ${style}`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {productData?.subCategory?.hasColors && (
                <section aria-labelledby="color-selector">
                  <h3 id="color-selector" className="mb-3 flex text-sm font-semibold text-gray-800">
                    Color:
                    <div style={{ backgroundColor: `${selectedColor?.toLowerCase()}` }} className="ml-1 h-4 w-4 rounded-full border border-gray-200"></div>
                    <span className="ml-1 font-bold">{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[...new Set(productData.variants.map((v) => v.color))].filter(Boolean).map((color) => {
                      const variant = productData.variants.find((v) => v.color === color);
                      return (
                        <button
                          key={color}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`rounded-2xl border p-1 ${
                            selectedColor === color ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'
                          } ${!variant?.stockQuantity && 'cursor-not-allowed opacity-50'}`}
                          disabled={!variant?.stockQuantity}
                          aria-label={`Select color ${color}`}
                        >
                          <img
                            src={variant?.images?.[0]?.imageUrl || productData?.images?.[0]?.imageUrl}
                            alt={color}
                            className="h-16 w-14 rounded-xl object-cover"
                            width={64}
                            height={64}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {selectedVariant.name && selectedVariant?.name !== 'null' && (
                <section aria-labelledby="option-selector">
                  <h3 id="option-selector" className="mb-2 text-sm font-semibold text-gray-800">
                    {productData?.variants?.length > 1 ? 'Options:' : 'Option:'} <span className="font-bold">{selectedVariant?.name}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productData.variants.map((v) => v.name))].filter(Boolean).map((name) => {
                      const variant = productData.variants.find((v) => v.name === name);
                      return (
                        <button
                          key={name}
                          onClick={() => variant && handleVariantChange(variant)}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedVariant?.name === name ? 'border-gray-900 bg-gray-900 font-medium text-white' : 'border-gray-300 hover:bg-gray-50'
                          } ${variant?.stockQuantity < 1 && 'cursor-not-allowed opacity-50'}`}
                          disabled={variant?.stockQuantity < 1}
                          aria-label={`Select option ${name}`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {productData.weight && !isNaN(productData.weight) && (
              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Weight</p>
                <p className="mt-1 text-sm font-medium">{productData.weight} g</p>
              </div>
            )}

            {selectedColor && selectedColor !== 'null' && (
              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Color</p>
                <p className="mt-1 text-sm font-medium">{selectedColor}</p>
              </div>
            )}

            {selectedVariant?.size && selectedVariant?.size !== 'null' && (
              <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Size</p>
                <p className="mt-1 text-sm font-medium">{selectedVariant.size}</p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <SelectedOptionsDisplay
              selectedVariant={selectedVariant}
              selectedColor={selectedColor}
              quantity={quantity}
              price={currentDisplayPrice}
              pricingTiers={selectedVariant?.pricingTiers}
              onQuantityChange={(newQty) => {
                setQuantity(newQty);
                if (selectedTier && newQty < selectedTier.minQuantity) {
                  setSelectedTier(null);
                }
              }}
              defaultImage={imagesToShow?.[0]?.imageUrl}
            />

            <div className="grid gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant?.stockQuantity}
                className={`flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-semibold transition ${
                  selectedVariant?.stockQuantity ? 'bg-gray-950 text-white hover:bg-black' : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
                aria-label="Add to cart"
              >
                <FiShoppingCart className="mr-2" />
                {selectedVariant?.stockQuantity ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant?.stockQuantity}
                className={`flex w-full items-center justify-center rounded-full border px-5 py-4 text-sm font-semibold transition ${
                  selectedVariant?.stockQuantity ? 'border-gray-900 bg-white text-gray-900 hover:bg-gray-50' : 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                }`}
                aria-label="Buy now"
              >
                <FiZap className="mr-2" />
                Buy Now
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center text-xs text-gray-500 sm:text-sm">
            <FiLock className="mr-1.5" aria-hidden="true" />
            Secure Checkout
          </div>

          {productData.highlights && (
            <div className="mt-5 rounded-[24px] border border-gray-200 bg-[#fafafa] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Key Benefits</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {productData.highlights.split('\r\n').filter(Boolean).slice(0, 5).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <FiShield className="mt-0.5 text-gray-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {productData.specifications?.warrantyDuration && (
            <section aria-labelledby="warranty-info" className="mt-5">
              <div className="rounded-[24px] border border-gray-200 p-4">
                <div className="mb-2 flex items-center">
                  <FiShield className="mr-2 text-gray-500" aria-hidden="true" />
                  <h3 id="warranty-info" className="font-medium">
                    {productData.specifications.warrantyDuration} Warranty
                  </h3>
                </div>
                {productData.specifications.productWarranty && (
                  <p className="text-sm text-gray-600">{productData.specifications.productWarranty}</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5">
        <ProductDetailsSection
          productData={productData}
          selectedVariant={selectedVariant}
          description={productData.description}
        />

        <ProductReviews productId={productData.id} initialReviews={productReviews} />
      </div>

      <section aria-labelledby="related-products" className="mt-8 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <h2 id="related-products" className={Styles.pageTitle}>Related Products</h2>
        <ProductListByCategory
          endpointsPath={endpointsPath.product}
          search={productData?.category?.name}
          pageSize={10}
          layout="horizontal"
        />
      </section>
    </div>
  );
}
