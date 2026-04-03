'use client';

import endpointsPath from '@/constants/EndpointsPath';
import formatNumberToCurrency from '@/utils/numberToMoney';
import requestHandler from '@/utils/requestHandler';
import { stringToSLug } from '@/utils/stringToSlug';
import useCart from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  FiMenu,
  FiSearch,
  FiUser,
  FiShoppingCart,
  FiX,
  FiChevronDown,
  FiMinus,
  FiPlus,
  FiHelpCircle,
  FiChevronRight,
} from 'react-icons/fi';
import { IoMdArrowDropdown } from 'react-icons/io';
import NavigationButtons from './NavigationButtons';
import AppImages from '@/constants/Images';

export default function StoreNavBar() {
  const [isMouseInDropdown, setIsMouseInDropdown] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({});
  const [categories, setCategories] = useState([]);

  const { cart, updateCart, updateQuantity } = useCart();

  // Calculate price based on quantity tiers
  const getTieredPrice = (tiers, quantity) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = sorted.find(t => quantity >= t.minQuantity);
    return tier?.pricePerUnit || sorted[sorted.length-1]?.pricePerUnit || 0;
  };

  // Initialize and listen for changes
  useEffect(() => {
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, []);

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
        const res = await requestHandler.getServerSide(`${endpointsPath.product}?searchTerm=${search}&pageNumber=1&pageSize=20`, false);
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

  // Updated generateCategoryUrl function to handle all levels properly
const generateCategoryUrl = (item, parent = null, grandParent = null, greatGrandParent = null) => {
  const itemSlug = item.slug || encodeURIComponent(stringToSLug(item.name));
  
  let pathSegments = [];
  let queryParams = `id=${item.id}`;

  // Build path segments in order: main category -> subcategory -> product type -> product subtype
  if (greatGrandParent) {
    pathSegments.push(greatGrandParent.slug || encodeURIComponent(stringToSLug(greatGrandParent.name)));
    //queryParams += `&catId=${greatGrandParent.id}`;
  }
  
  if (grandParent) {
    pathSegments.push(grandParent.slug || encodeURIComponent(stringToSLug(grandParent.name)));
    //queryParams += `&subCatId=${grandParent.id}`;
  }
  
  if (parent) {
    pathSegments.push(parent.slug || encodeURIComponent(stringToSLug(parent.name)));
    //queryParams += `&typeId=${parent.id}`;
  }
  
  pathSegments.push(itemSlug);

  //return `/product/category/${pathSegments.join('/')}?${queryParams}`;
  return `/product/category/${pathSegments.join('/')}`;
};

// Updated renderProductTypes function with proper hierarchy
const renderProductTypes = (productTypes, subCategory, mainCategory) => {
  if (!productTypes || productTypes.length === 0) return null;

  return (
    <div className="space-y-2">
      {productTypes.map((productType) => (
        <div key={productType.id} className="group">
          {/* Product Type Header */}
          <Link
            href={generateCategoryUrl(productType, subCategory, mainCategory)}
            className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:shadow-sm border border-transparent hover:border-blue-100 group"
          >
            <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {productType.name}
            </span>
            {productType.productSubTypes && productType.productSubTypes.length > 0 && (
              <FiChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
            )}
          </Link>

          {/* Product Sub Types */}
          {productType.productSubTypes && productType.productSubTypes.length > 0 && (
            <div className="ml-3 mt-1 pl-3 border-l-2 border-blue-100">
              <div className="space-y-1">
                {productType.productSubTypes.map((subType) => (
                  <div>
                    {subType.hasProducts? <Link
                    key={subType.id}
                    href={generateCategoryUrl(subType, productType, subCategory, mainCategory)}
                    className="flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-all duration-150 hover:bg-gray-50 hover:shadow-xs group/subtype"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/subtype:bg-blue-400 transition-colors"></div>
                    <span className="text-gray-600 group-hover/subtype:text-gray-800 transition-all">
                      {subType.name}
                    </span>
                  </Link> : ''}
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

  return (
    <>
      {/* Navbar */}
      <nav className="w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between relative z-50 text-gray-900">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <FiMenu className="text-2xl" />
          </button>
          <Link href={'/'} className="text-2xl font-bold cursor-pointer">
            <img 
              src={AppImages.logo} 
              alt="App Logo"
              className="w-32 h-auto"
              width={128}
              height={64}
            />
          </Link>

          {/* Desktop All Categories */}
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
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
                  className="absolute left-0 top-full mt-2 flex bg-white shadow-xl rounded-lg overflow-hidden w-[900px] z-50 border border-gray-200"
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
                  {/* Sidebar - Main Categories */}
                  <div className="w-64 border-r border-gray-100 overflow-y-auto max-h-[500px] bg-gray-50">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Categories</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <div
                            className={`px-4 py-3 flex items-center gap-3 transition-all duration-200 cursor-pointer group ${
                              hoveredCategory?.id === cat.id 
                                ? 'bg-white shadow-sm border-r-2 border-blue-500' 
                                : 'hover:bg-white hover:shadow-sm'
                            }`}
                            onMouseEnter={() => setHoveredCategory(cat)}
                            onFocus={() => {
                              setHoveredCategory(cat);
                              setCategoryOpen(true);
                            }}
                          >
                            <Link 
                              href={generateCategoryUrl(cat)}
                              className="flex items-center gap-3 flex-1"
                            >
                              <div className="flex-shrink-0">
                                {cat.imageUrl ? (
                                  <Image 
                                    src={cat.imageUrl} 
                                    alt={cat.name} 
                                    width={24} 
                                    height={24} 
                                    className="object-contain rounded"
                                    unoptimized={cat.imageUrl?.includes('localhost')}
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                                    <span className="text-xs text-gray-500">📦</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                                {cat.name}
                              </span>
                            </Link>
                            {cat.subCategories?.length > 0 && (
                              <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Flyout - Subcategories & Product Types */}
                  {hoveredCategory && hoveredCategory.subCategories && hoveredCategory.subCategories.length > 0 && (
                    <div className="flex-1 p-6 overflow-y-auto max-h-[500px] bg-white">
                      <div className="mb-6">
                        <Link
                          href={generateCategoryUrl(hoveredCategory)}
                          className="inline-flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors group/title"
                        >
                          {hoveredCategory.name}
                          <FiChevronRight className="w-4 h-4 text-gray-400 group-hover/title:text-blue-500 transition-transform group-hover/title:translate-x-1" />
                        </Link>
                        {hoveredCategory.imageUrl && (
                          <p className="text-sm text-gray-500 mt-1">Browse all products in this category</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        {hoveredCategory.subCategories.map((subCategory) => (
                          <div key={subCategory.id} className="space-y-4">
                            {/* SubCategory Header */}
                            <div className="border-b border-gray-100 pb-2">
                              <Link
                                href={generateCategoryUrl(subCategory, hoveredCategory)}
                                className="flex items-center justify-between text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors group/subcat"
                              >
                                <span>{subCategory.name}</span>
                                <FiChevronRight className="w-4 h-4 text-gray-400 group-hover/subcat:text-blue-500 transition-transform group-hover/subcat:translate-x-1" />
                              </Link>
                            </div>

                            {/* Product Types */}
                            {subCategory.productTypes && subCategory.productTypes.length > 0 && (
                              <div className="space-y-3">
                                {renderProductTypes(subCategory.productTypes, subCategory, hoveredCategory)}
                              </div>
                            )}

                            {/* Show direct link if no product types but has subcategories */}
                            {(!subCategory.productTypes || subCategory.productTypes.length === 0) && (
                              <Link
                                href={generateCategoryUrl(subCategory, hoveredCategory)}
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                              >
                                View all products
                                <FiChevronRight className="w-3 h-3 ml-1" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* View All Link */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <Link
                          href={generateCategoryUrl(hoveredCategory)}
                          className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          View all products in {hoveredCategory.name}
                          <FiChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Empty State for categories without subcategories */}
                  {hoveredCategory && (!hoveredCategory.subCategories || hoveredCategory.subCategories.length === 0) && (
                    <div className="flex-1 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiMenu className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subcategories</h3>
                        <p className="text-gray-500 mb-4">This category doesn't have any subcategories.</p>
                        <Link
                          href={generateCategoryUrl(hoveredCategory)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

        {/* Desktop Search Component */}
        <div className="flex-1 mx-4 hidden sm:flex max-w-xl relative" ref={searchRef}>
          <div className="w-full border border-gray-300 rounded-full overflow-hidden">
            <input
              type="text"
              placeholder="Search Products"
              className="flex-1 border-0 px-4 py-2 focus:outline-none w-full"
              onChange={(e) => setSearch(e.target.value)}
              value={search || ''}
            />
            <button onClick={() => search ? window.location=`/product?search=${search}` : {} } className="absolute right-0 top-0 px-4 h-full bg-black text-white rounded-r-full">
              <FiSearch className="text-xl" />
            </button>
          </div>
          
          {/* Desktop Search Dropdown */}
          {search && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {products.length > 0 ? (
                <ul>
                  {products.map((product) => (
                    <li key={product.id} className="hover:bg-gray-100">
                      <Link 
                      onClick={() => {setProducts([]); setSearch(null);}}
                        href={`/product/${stringToSLug(product.name)}?id=${product.id}`}
                        className="flex items-center p-3"
                      >
                        <img 
                          src={product.images?.[0]?.imageUrl || AppImages.default} 
                          alt={product.name}
                          className="w-10 h-10 object-cover mr-3"
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

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button 
            className="sm:hidden p-2 hover:bg-gray-100 rounded-full"
            onClick={() => setMobileSearchOpen(true)}
          >
            <FiSearch className="text-xl" />
          </button>
          
          <NavigationButtons />
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center p-4 border-b">
            <button 
              onClick={() => setMobileSearchOpen(false)}
              className="mr-3 p-1"
            >
              <FiX className="text-2xl" />
            </button>
            
            <div className="flex-1 relative" ref={mobileSearchRef}>
              <div className="w-full border border-gray-300 rounded-full overflow-hidden">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 border-0 px-4 py-2 focus:outline-none w-full"
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
                  className="absolute right-0 top-0 px-4 h-full bg-black text-white rounded-r-full"
                >
                  <FiSearch className="text-xl" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Search Results */}
          {search && (
            <div className="px-4 z-50 py-2 max-h-[calc(100vh-80px)] overflow-y-auto">
              {products.length > 0 ? (
                <ul className="space-y-2">
                  {products.map((product) => (
                    <li key={product.id}>
                      <a 
                        href={`/product/${stringToSLug(product.name)}?id=${product.id}`}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        <img 
                          src={product.images?.[0]?.imageUrl || AppImages.default} 
                          alt={product.name}
                          className="w-12 h-12 object-cover mr-3 rounded"
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
                <div className="p-4 text-gray-500 text-center">No products found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Enhanced Mobile Side Menu */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        aria-modal="true"
        role="dialog"
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div
          className={`relative flex flex-col w-80 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">All Categories</h2>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Close menu"
            >
              <FiX className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto py-2 px-3">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <div key={cat.id} className="group">
                  {/* Category Item */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <Link
                        href={generateCategoryUrl(cat)}
                        className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-100 text-gray-700 flex-1"
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
                          <span className="text-lg">📦</span>
                        )}
                        <span className="text-left font-medium">{cat.name}</span>
                      </Link>
                      
                      {cat.subCategories?.length > 0 && (
                        <button
                          onClick={() => toggleMobileCategory(cat.id)}
                          className="p-2 mr-1 rounded-md hover:bg-gray-100"
                        >
                          <FiChevronDown 
                            className={`w-5 h-5 transition-transform ${
                              expandedMobileCategories[cat.id] ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories */}
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
                            
                            {/* Product Types in Mobile */}
                            {subCat.productTypes && subCat.productTypes.length > 0 && (
                              <div className="ml-3 space-y-1 mt-1">
                                {subCat.productTypes.map((productType) => (
                                  <div key={productType.id}>
                                    <Link
                                      onClick={() => setMobileMenuOpen(false)}
                                      href={generateCategoryUrl(productType, subCat, cat)}
                                      className="block py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                                    >
                                      {productType.name}
                                    </Link>
                                    
                                    {/* Product Sub Types */}
{productType.productSubTypes && productType.productSubTypes.length > 0 && (
  <div className="ml-3 space-y-1">
    {productType.productSubTypes.map((subType) => (
      <div>
                    {subType.hasProducts?  <Link
        key={subType.id}
        onClick={() => setMobileMenuOpen(false)}
        href={generateCategoryUrl(subType, productType, subCat, cat)}
        className="block py-1 text-sm text-gray-500 hover:text-gray-700"
      >
        {subType.name}
      </Link> : ''}
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
