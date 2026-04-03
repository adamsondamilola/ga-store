'use client';

import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from './ProductCard';

export default function FrontFeaturedProducts({ products }) {
  const containerRef = useRef(null);
 const scrollLeft = (ref) => {
  if (ref.current) {
    ref.current.scrollBy({ left: -200, behavior: 'smooth' });
  }
};

const scrollRight = (ref) => {
  if (ref.current) {
    ref.current.scrollBy({ left: 200, behavior: 'smooth' });
  }
};
  return (
    <section className="px-4">
      <div className=''>
      <div
  className="relative"
  aria-label="Featured products carousel"
>
  <div
    className="overflow-x-auto scroll-smooth no-scrollbar py-4"
    ref={containerRef}
  >
    <div className="inline-flex space-x-4 px-4">
      {products.map((product, index) => (
        <div 
          key={index} 
          className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw]" 
          role="listitem"
          aria-label={`Product: ${product.name}`}
        >
          <ProductCard product={product} featured/>
        </div>
      ))}
    </div>
  </div>
  
  {/* Optional navigation buttons */}
  <button 
    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md z-10"
    onClick={() => scrollLeft(containerRef)}
    aria-label="Scroll products left"
  >
    <FiChevronLeft className="h-5 w-5" />
  </button>
  <button 
    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md z-10"
    onClick={() => scrollRight(containerRef)}
    aria-label="Scroll products right"
  >
    <FiChevronRight className="h-5 w-5" />
  </button>
</div>
      </div>
    </section>
  );
}
