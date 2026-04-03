'use client';

import ProductCard from './ProductCard';
import { useRef } from 'react';

export default function FeaturedProducts({ products }) {
  const containerRef = useRef(null);

  return (
    <section className="px-4 py-8">
      <div className=''>
        <div className='bg-purple-500 rounded-t-lg'>
        <h4 className="text-2xl p-2 mb-4 text-white">Featured Products</h4>
        </div>
      <div
        className="overflow-x-auto scroll-smooth no-scrollbar"
        ref={containerRef}
        aria-label="Featured products carousel"
      >
        <div className="flex gap-4 min-w-full mb-2">
          {products.map((product, index) => (
            <div key={index} className="flex-shrink-0 w-[250px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
