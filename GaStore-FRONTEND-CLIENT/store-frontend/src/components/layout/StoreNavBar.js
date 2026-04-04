'use client';

import AppImages from '@/constants/Images';
import endpointsPath from '@/constants/EndpointsPath';
import formatNumberToCurrency from '@/utils/numberToMoney';
import { formatImagePath } from '@/utils/formatImagePath';
import requestHandler from '@/utils/requestHandler';
import { stringToSLug } from '@/utils/stringToSlug';
import useCart from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  FiMenu,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import { IoMdArrowDropdown } from 'react-icons/io';
import NavigationButtons from './NavigationButtons';
import { useWebsiteContent } from '@/components/providers/WebsiteContentProvider';
import { getWebsiteLogo } from '@/utils/websiteContentDefaults';

export default function StoreNavBar() {
  const [isMouseInDropdown, setIsMouseInDropdown] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({});
  const [categories, setCategories] = useState([]);
  const { websiteContent } = useWebsiteContent();

  const { updateCart } = useCart();

  useEffect(() => {
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, [updateCart]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await requestHandler.get(
          `${endpointsPath.category}/full-hierarchy`,
          true
        );
        if (response.statusCode === 200 && response.result.data) {
          setCategories(response.result.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoryOpen && !hoveredCategory && categories.length > 0) {
      setHoveredCategory(categories[0]);
    }
  }, [categoryOpen, hoveredCategory, categories]);

  const toggleMobileCategory = (categoryId) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    async function getProducts() {
      try {
        const res = await requestHandler.getServerSide(
          `${endpointsPath.product}?searchTerm=${search}&pageNumber=1&pageSize=20`,
          false
        );
        setProducts(res?.result?.data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }
    }

    if (search) {
      getProducts();
    }
  }, [search]);

  const handleClickOutside = (event) => {
    if (
      mobileSearchRef.current &&
      !mobileSearchRef.current.contains(event.target) &&
      !event.target.closest('a')
    ) {
      setMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateCategoryUrl = (
    item,
    parent = null,
    grandParent = null,
    greatGrandParent = null
  ) => {
    const itemSlug = item.slug || encodeURIComponent(stringToSLug(item.name));
    const pathSegments = [];

    if (greatGrandParent) {
      pathSegments.push(
        greatGrandParent.slug || encodeURIComponent(stringToSLug(greatGrandParent.name))
      );
    }

    if (grandParent) {
      pathSegments.push(
        grandParent.slug || encodeURIComponent(stringToSLug(grandParent.name))
      );
    }

    if (parent) {
      pathSegments.push(parent.slug || encodeURIComponent(stringToSLug(parent.name)));
    }

    pathSegments.push(itemSlug);
    return `/product/category/${pathSegments.join('/')}`;
  };

  const renderProductTypes = (productTypes, subCategory, mainCategory) => {
    if (!productTypes || productTypes.length === 0) return null;

    return (
      <div className="space-y-2">
        {productTypes.map((productType) => (
          <div key={productType.id} className="group">
            <Link
              href={generateCategoryUrl(productType, subCategory, mainCategory)}
              className="group flex items-center justify-between rounded-2xl border border-transparent bg-[#fffaf6] p-2.5 transition-all duration-200 hover:border-[#f3c69f] hover:bg-[#fff1e4]"
            >
              <span className="text-sm font-semibold text-[#4b2d1d] transition-colors group-hover:text-[#b45309]">
                {productType.name}
              </span>
              {productType.productSubTypes && productType.productSubTypes.length > 0 && (
                <FiChevronRight className="h-3 w-3 text-[#ca8a56] transition-transform group-hover:translate-x-0.5 group-hover:text-[#9a541e]" />
              )}
            </Link>

            {productType.productSubTypes && productType.productSubTypes.length > 0 && (
              <div className="ml-3 mt-2 border-l-2 border-[#f3dac7] pl-3">
                <div className="space-y-1.5">
                  {productType.productSubTypes.map((subType) => (
                    <div key={subType.id}>
                      {subType.hasProducts ? (
                        <Link
                          href={generateCategoryUrl(subType, productType, subCategory, mainCategory)}
                          className="group/subtype flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs transition-all duration-150 hover:bg-[#fff8f1]"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-[#d6aa86] transition-colors group-hover/subtype:bg-[#d97706]" />
                          <span className="text-[#7a5a44] transition-colors group-hover/subtype:text-[#4b2d1d]">
                            {subType.name}
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getDisplayImage = (item) => {
    if (!item?.imageUrl) return null;
    return formatImagePath(item.imageUrl);
  };

  const getItemInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GS';

  const renderVisualBadge = (item, sizeClass = 'h-14 w-14', textClass = 'text-sm') => {
    const imageSrc = getDisplayImage(item);

    if (imageSrc) {
      return (
        <div
          className={`${sizeClass} relative overflow-hidden rounded-full bg-[#fff3e8] ring-1 ring-black/5`}
        >
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-full bg-gradient-to-br from-[#ffe2c1] via-[#ffd2a1] to-[#f59e0b] text-[#7c2d12] ring-1 ring-black/5`}
      >
        <span className={`${textClass} font-semibold tracking-[0.18em]`}>
          {getItemInitials(item?.name)}
        </span>
      </div>
    );
  };

  const categoryPreviewItems = hoveredCategory?.subCategories?.slice(0, 10) || [];
  const categoryQuickLinks = hoveredCategory?.subCategories?.slice(0, 6) || [];
  const categoryMeta = hoveredCategory
    ? {
        subCategories: hoveredCategory.subCategories?.length || 0,
        productTypes:
          hoveredCategory.subCategories?.reduce(
            (count, subCategory) => count + (subCategory.productTypes?.length || 0),
            0
          ) || 0,
      }
    : null;

  return (
    <>
      <nav className="relative z-50 flex w-full items-center justify-between border-b bg-[#f97316] px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <button className="text-white lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <FiMenu className="text-2xl" />
          </button>
          <Link href="/" className="cursor-pointer text-2xl font-bold">
            <img
              src={getWebsiteLogo(websiteContent)}
              alt={websiteContent.siteName || 'App Logo'}
              className="h-auto w-32"
              width={128}
              height={64}
            />
          </Link>

          <div className="relative hidden lg:block">
            <div
              className="relative"
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => {
                if (!hoverTimeout) {
                  const timeout = setTimeout(() => {
                    if (!isMouseInDropdown) {
                      setCategoryOpen(false);
                      setHoveredCategory(null);
                    }
                  }, 200);
                  setHoverTimeout(timeout);
                }
              }}
            >
              <button
                className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white transition-colors duration-200 hover:bg-white/25"
                aria-expanded={categoryOpen}
                aria-haspopup="true"
                aria-label="Browse categories"
              >
                <FiMenu className="text-lg" />
                <span className="font-medium">All Categories</span>
                <IoMdArrowDropdown className={`transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-3 flex w-[980px] overflow-hidden rounded-[28px] border border-[#f0d3bd] bg-[#fffaf5] shadow-[0_28px_80px_rgba(115,61,16,0.18)]"
                  onMouseEnter={() => {
                    setIsMouseInDropdown(true);
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      setHoverTimeout(null);
                    }
                  }}
                  onMouseLeave={() => {
                    setIsMouseInDropdown(false);
                    setCategoryOpen(false);
                    setHoveredCategory(null);
                  }}
                >
                  <div className="max-h-[560px] w-[270px] overflow-y-auto border-r border-[#f3dfd0] bg-white/80">
                    <div className="border-b border-[#f7e7db] px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c26b2f]">
                        Shop By Department
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-[#3b2416]">
                        All Categories
                      </h3>
                    </div>
                    <ul className="px-2 py-3">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <div
                            className={`group mb-1 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                              hoveredCategory?.id === cat.id
                                ? 'bg-[#fff1e4] shadow-[0_10px_30px_rgba(234,120,38,0.14)]'
                                : 'hover:bg-[#fff8f1]'
                            }`}
                            onMouseEnter={() => setHoveredCategory(cat)}
                            onFocus={() => {
                              setHoveredCategory(cat);
                              setCategoryOpen(true);
                            }}
                          >
                            <Link href={generateCategoryUrl(cat)} className="flex flex-1 items-center gap-3">
                              <div className="flex-shrink-0">
                                {renderVisualBadge(cat, 'h-10 w-10', 'text-xs')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[#402718] transition-colors group-hover:text-[#1f130d]">
                                  {cat.name}
                                </span>
                                <span className="block truncate text-xs text-[#b27d5c]">
                                  {cat.subCategories?.length || 0} sections
                                </span>
                              </div>
                            </Link>
                            {cat.subCategories?.length > 0 && (
                              <FiChevronRight className="h-4 w-4 text-[#ca8a56] transition-transform group-hover:translate-x-0.5 group-hover:text-[#9a541e]" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {hoveredCategory && hoveredCategory.subCategories && hoveredCategory.subCategories.length > 0 && (
                    <div className="max-h-[560px] flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)] p-6">
                      <div className="rounded-[26px] border border-[#f8ddc6] bg-white/90 p-5 shadow-[0_16px_50px_rgba(120,68,20,0.08)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cb6c2e]">
                              Explore Collection
                            </p>
                            <Link
                              href={generateCategoryUrl(hoveredCategory)}
                              className="group/title mt-2 inline-flex items-center gap-2 text-[28px] font-bold leading-tight text-[#25160f] transition-colors hover:text-[#b45309]"
                            >
                              {hoveredCategory.name}
                              <FiChevronRight className="h-5 w-5 text-[#d38a4d] transition-transform group-hover/title:translate-x-1" />
                            </Link>
                            <p className="mt-2 max-w-xl text-sm text-[#8a5b40]">
                              Discover standout picks, browse curated subcategories, and jump straight into the sections shoppers use most.
                            </p>
                          </div>
                          <div className="hidden items-center gap-2 rounded-full bg-[#fff3e6] px-3 py-2 text-xs font-medium text-[#9a4f19] md:flex">
                            <span>{categoryMeta?.subCategories || 0} subcategories</span>
                            <span className="h-1 w-1 rounded-full bg-[#e2a36d]" />
                            <span>{categoryMeta?.productTypes || 0} product types</span>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-5 gap-4">
                          {categoryPreviewItems.map((subCategory) => (
                            <Link
                              key={subCategory.id}
                              href={generateCategoryUrl(subCategory, hoveredCategory)}
                              className="group/tile text-center"
                            >
                              <div className="flex justify-center">
                                <div className="relative">
                                  {renderVisualBadge(subCategory, 'h-[76px] w-[76px]', 'text-sm')}
                                  {subCategory.hasProducts && (
                                    <span className="absolute -right-1 top-1 rounded-full bg-[#ff7a00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                                      Hot
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="mt-3 block line-clamp-2 text-sm font-medium leading-5 text-[#4b2d1d] transition-colors group-hover/tile:text-[#b45309]">
                                {subCategory.name}
                              </span>
                            </Link>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {categoryQuickLinks.map((subCategory) => (
                            <Link
                              key={subCategory.id}
                              href={generateCategoryUrl(subCategory, hoveredCategory)}
                              className="rounded-full border border-[#f0d7c2] bg-[#fffaf6] px-3 py-2 text-xs font-medium text-[#7c4a2c] transition-colors hover:border-[#f2bb8e] hover:bg-[#fff1e4] hover:text-[#9a4f19]"
                            >
                              {subCategory.name}
                            </Link>
                          ))}
                          <Link
                            href={generateCategoryUrl(hoveredCategory)}
                            className="rounded-full bg-[#2f1c12] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4a2814]"
                          >
                            View all
                          </Link>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-6">
                        {hoveredCategory.subCategories.map((subCategory) => (
                          <div
                            key={subCategory.id}
                            className="rounded-[24px] border border-[#f5dfcf] bg-white/90 p-5 shadow-[0_12px_35px_rgba(120,68,20,0.06)]"
                          >
                            <div className="flex items-start gap-3 border-b border-[#f6e7da] pb-3">
                              {renderVisualBadge(subCategory, 'h-12 w-12', 'text-xs')}
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cb6c2e]">
                                  Subcategory
                                </p>
                                <Link
                                  href={generateCategoryUrl(subCategory, hoveredCategory)}
                                  className="group/subcat mt-1 flex items-center justify-between gap-2 text-base font-semibold text-[#2f1b11] transition-colors hover:text-[#b45309]"
                                >
                                  <span className="truncate">{subCategory.name}</span>
                                  <FiChevronRight className="h-4 w-4 text-[#d38a4d] transition-transform group-hover/subcat:translate-x-1" />
                                </Link>
                                <p className="mt-1 text-xs text-[#97684b]">
                                  {subCategory.productTypes?.length || 0} product types available
                                </p>
                              </div>
                            </div>

                            {subCategory.productTypes && subCategory.productTypes.length > 0 && (
                              <div className="mt-4 space-y-3">
                                {renderProductTypes(subCategory.productTypes, subCategory, hoveredCategory)}
                              </div>
                            )}

                            {(!subCategory.productTypes || subCategory.productTypes.length === 0) && (
                              <Link
                                href={generateCategoryUrl(subCategory, hoveredCategory)}
                                className="mt-4 inline-flex items-center text-sm font-medium text-[#b45309] transition-colors hover:text-[#92400e]"
                              >
                                View all products
                                <FiChevronRight className="ml-1 h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 border-t border-[#f3dfd0] pt-4">
                        <Link
                          href={generateCategoryUrl(hoveredCategory)}
                          className="inline-flex items-center text-sm font-medium text-[#5f3a25] transition-colors hover:text-[#b45309]"
                        >
                          View all products in {hoveredCategory.name}
                          <FiChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {hoveredCategory && (!hoveredCategory.subCategories || hoveredCategory.subCategories.length === 0) && (
                    <div className="flex flex-1 items-center justify-center bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)] p-8">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e4]">
                          <FiMenu className="h-8 w-8 text-[#d97706]" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-[#2f1b11]">No Subcategories</h3>
                        <p className="mb-4 text-[#8a5b40]">This category doesn't have any subcategories yet.</p>
                        <Link
                          href={generateCategoryUrl(hoveredCategory)}
                          className="inline-flex items-center rounded-full bg-[#2f1c12] px-4 py-2 text-white transition-colors hover:bg-[#4a2814]"
                        >
                          Browse {hoveredCategory.name}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative mx-4 hidden max-w-xl flex-1 sm:flex" ref={searchRef}>
          <div className="w-full overflow-hidden rounded-full border border-gray-300">
            <input
              type="text"
              placeholder="Search Products"
              className="w-full flex-1 border-0 px-4 py-2 text-gray-700 focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
              value={search || ''}
            />
            <button
              onClick={() => (search ? (window.location = `/product?search=${search}`) : {})}
              className="absolute right-0 top-0 h-full rounded-r-full bg-black px-4 text-white"
            >
              <FiSearch className="text-xl" />
            </button>
          </div>

          {search && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {products.length > 0 ? (
                <ul>
                  {products.map((product) => (
                    <li key={product.id} className="hover:bg-gray-100">
                      <Link
                        onClick={() => {
                          setProducts([]);
                          setSearch(null);
                        }}
                        href={`/product/${stringToSLug(product.name)}?id=${product.id}`}
                        className="flex items-center p-3"
                      >
                        <img
                          src={product.images?.[0]?.imageUrl || AppImages.default}
                          alt={product.name}
                          className="mr-3 h-10 w-10 object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatNumberToCurrency(
                              product.variantsDto?.[0]?.pricingTiersDto?.[0]?.pricePerUnit || 0
                            )}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-gray-500">No products found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-2 text-white hover:bg-white/15 sm:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <FiSearch className="text-xl" />
          </button>

          <NavigationButtons />
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center border-b p-4">
            <button onClick={() => setMobileSearchOpen(false)} className="mr-3 p-1">
              <FiX className="text-2xl" />
            </button>

            <div className="relative flex-1" ref={mobileSearchRef}>
              <div className="w-full overflow-hidden rounded-full border border-gray-300">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full flex-1 border-0 px-4 py-2 focus:outline-none"
                  onChange={(e) => setSearch(e.target.value)}
                  value={search || ''}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (search) {
                      window.location.href = `/product?search=${search}`;
                    }
                  }}
                  className="absolute right-0 top-0 h-full rounded-r-full bg-black px-4 text-white"
                >
                  <FiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>

          {search && (
            <div className="z-50 max-h-[calc(100vh-80px)] overflow-y-auto px-4 py-2">
              {products.length > 0 ? (
                <ul className="space-y-2">
                  {products.map((product) => (
                    <li key={product.id}>
                      <a
                        href={`/product/${stringToSLug(product.name)}?id=${product.id}`}
                        className="flex items-center rounded-lg p-3 hover:bg-gray-50"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        <img
                          src={product.images?.[0]?.imageUrl || AppImages.default}
                          alt={product.name}
                          className="mr-3 h-12 w-12 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatNumberToCurrency(
                              product.variantsDto?.[0]?.pricingTiersDto?.[0]?.pricePerUnit || 0
                            )}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">No products found</div>
              )}
            </div>
          )}
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div
        className={`fixed inset-0 z-50 overflow-hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`relative flex h-full w-80 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-xl font-bold text-gray-800">All Categories</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Close menu"
            >
              <FiX className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <div key={cat.id} className="group">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <Link
                        href={generateCategoryUrl(cat)}
                        className="flex flex-1 items-center gap-3 rounded-md px-3 py-3 text-gray-700 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.imageUrl ? (
                          <Image
                            src={cat.imageUrl}
                            alt=""
                            width={20}
                            height={20}
                            className="flex-shrink-0"
                            unoptimized={cat.imageUrl?.includes('localhost')}
                          />
                        ) : (
                          <span className="text-lg">+</span>
                        )}
                        <span className="text-left font-medium">{cat.name}</span>
                      </Link>

                      {cat.subCategories?.length > 0 && (
                        <button
                          onClick={() => toggleMobileCategory(cat.id)}
                          className="mr-1 rounded-md p-2 hover:bg-gray-100"
                        >
                          <FiChevronDown
                            className={`h-5 w-5 transition-transform ${
                              expandedMobileCategories[cat.id] ? 'rotate-180 transform' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {cat.subCategories?.length > 0 && (
                      <div
                        className={`ml-4 space-y-2 overflow-hidden transition-all ${
                          expandedMobileCategories[cat.id]
                            ? 'max-h-[1000px] py-2 opacity-100'
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        {cat.subCategories.map((subCat) => (
                          <div key={subCat.id} className="border-l-2 border-gray-200 pl-3">
                            <Link
                              onClick={() => setMobileMenuOpen(false)}
                              href={generateCategoryUrl(subCat, cat)}
                              className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                              {subCat.name}
                            </Link>

                            {subCat.productTypes && subCat.productTypes.length > 0 && (
                              <div className="ml-3 mt-1 space-y-1">
                                {subCat.productTypes.map((productType) => (
                                  <div key={productType.id}>
                                    <Link
                                      onClick={() => setMobileMenuOpen(false)}
                                      href={generateCategoryUrl(productType, subCat, cat)}
                                      className="block py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                                    >
                                      {productType.name}
                                    </Link>

                                    {productType.productSubTypes && productType.productSubTypes.length > 0 && (
                                      <div className="ml-3 space-y-1">
                                        {productType.productSubTypes.map((subType) => (
                                          <div key={subType.id}>
                                            {subType.hasProducts ? (
                                              <Link
                                                onClick={() => setMobileMenuOpen(false)}
                                                href={generateCategoryUrl(subType, productType, subCat, cat)}
                                                className="block py-1 text-sm text-gray-500 hover:text-gray-700"
                                              >
                                                {subType.name}
                                              </Link>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
