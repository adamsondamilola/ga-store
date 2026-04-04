'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from './ProductCard';

export default function ProductList({ products, layout = 'grid' }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Reference for the element at the bottom of the list
  const observerTarget = useRef(null);
  const horizontalScrollRef = useRef(null);

  const safeProducts = Array.isArray(products) ? products : [];
  const isHorizontal = layout === 'horizontal';

  const handleViewMore = useCallback(() => {
    // Prevent multiple triggers if already loading or if all products are shown
    if (isLoadingMore || visibleCount >= safeProducts.length) return;

    setIsLoadingMore(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      setVisibleCount((prev) => prev + 30);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, visibleCount, safeProducts.length]);

  // Intersection Observer Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the sentinel enters the screen, load more
        if (entries[0].isIntersecting) {
          handleViewMore();
        }
      },
      { threshold: 1.0 } // Trigger only when the element is 100% visible
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleViewMore]);

  const scrollHorizontal = (direction) => {
    if (!horizontalScrollRef.current) return;

    const scrollAmount = Math.max(horizontalScrollRef.current.clientWidth * 0.8, 240);
    horizontalScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`container mx-auto px-4 ${isHorizontal ? 'py-2 md:px-0' : 'py-6 md:px-4'}`}>
      {isHorizontal ? (
        <div className="relative">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => scrollHorizontal('left')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
              aria-label="Scroll related products left"
            >
              <FiChevronLeft className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => scrollHorizontal('right')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
              aria-label="Scroll related products right"
            >
              <FiChevronRight className="text-lg" />
            </button>
          </div>

          <div ref={horizontalScrollRef} className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
            {safeProducts.slice(0, visibleCount).map((product) => (
              <div key={product.id} className="w-[190px] min-w-[190px] flex-shrink-0 sm:w-[210px] sm:min-w-[210px]">
                <ProductCard
                  product={product}
                  className="transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
          {safeProducts.slice(0, visibleCount).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              className="transition-transform duration-300 hover:scale-[1.02]"
            />
          ))}
        </div>
      )}

      {safeProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available</p>
        </div>
      )}

      {/* This div is the "Sentinel". 
        When the user scrolls here, handleViewMore is called.
      */}
      <div ref={observerTarget} className={`flex w-full items-center justify-center ${isHorizontal ? 'mt-3 h-7' : 'mt-8 h-10'}`}>
        {isLoadingMore && (
           <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <span>Loading more products...</span>
           </div>
        )}
      </div>
    </div>
  );
}
