'use client';

import { useState, useCallback } from 'react';
import ProductCard from '../ProductCard';

export default function FeaturedProductList({ products }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  const handleViewMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 30);
      setIsLoadingMore(false);
    }, 300);
  }, []);

  return (
    <div className="container mx-auto md:px-4 px-4 py-6">
      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {safeProducts.slice(0, visibleCount).map((product) => (
          <ProductCard 
            key={product.productId} 
            product={product}
            featured={true}
            viewAll={true}
            className="transition-transform duration-300 hover:scale-[1.02]"
          />
        ))}
      </div>

      {/* Empty State */}
      {safeProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available</p>
        </div>
      )}

      {/* Load More Button */}
      {safeProducts.length > visibleCount && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleViewMore}
            disabled={isLoadingMore}
            className={`px-8 py-3 rounded-full font-medium transition-colors ${
              isLoadingMore 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isLoadingMore ? 'Loading...' : 'View More'}
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {/*safeProducts.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {Math.min(visibleCount, safeProducts.length)} of {safeProducts.length} products
        </div>
      )*/}
    </div>
  );
}