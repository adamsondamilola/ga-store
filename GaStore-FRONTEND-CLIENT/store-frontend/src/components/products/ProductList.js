'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

export default function ProductList({ products }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Reference for the element at the bottom of the list
  const observerTarget = useRef(null);

  const safeProducts = Array.isArray(products) ? products : [];

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

  return (
    <div className="container mx-auto md:px-4 px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
        {safeProducts.slice(0, visibleCount).map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            className="transition-transform duration-300 hover:scale-[1.02]"
          />
        ))}
      </div>

      {safeProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available</p>
        </div>
      )}

      {/* This div is the "Sentinel". 
        When the user scrolls here, handleViewMore is called.
      */}
      <div ref={observerTarget} className="h-10 w-full flex justify-center items-center mt-8">
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