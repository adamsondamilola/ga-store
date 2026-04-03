import { useState, useRef } from 'react';
import { FiCircle } from 'react-icons/fi';

const ProductDetailsSection = ({ productData, selectedVariant }) => {
  const [activeSection, setActiveSection] = useState('description');
  const sectionRefs = {
    description: useRef(null),
    highlights: useRef(null),
    specifications: useRef(null),
    whatsInBox: useRef(null)
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    sectionRefs[section].current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="mt-5 bg-white p-5 rounded-lg border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Product Details</h2>
      
      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-2 mb-8 sticky top-0 bg-white py-2 z-10">
        <button
          onClick={() => scrollToSection('description')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'description'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Description
        </button>
        <button
          onClick={() => scrollToSection('highlights')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'highlights'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Highlights
        </button>
        {productData.specifications && (
          <button
            onClick={() => scrollToSection('specifications')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSection === 'specifications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Specifications
          </button>
        )}
        {/*<button
          onClick={() => scrollToSection('reviews')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'reviews'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Reviews
        </button>*/}
        {productData.specifications?.whatIsInTheBox && (
          <button
            onClick={() => scrollToSection('whatsInBox')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSection === 'whatsInBox'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            What's Included
          </button>
        )}
      </div>

      {/* Description */}
      <div 
  ref={sectionRefs.description}
  className="mb-10 scroll-mt-20"
>
  <h3 className="text-xl font-semibold mb-3 text-gray-800">Description</h3>
  <div className="prose max-w-none text-gray-700 whitespace-break-spaces">
    {productData.description}
  </div>
</div>

      {/* Highlights */}
      <div 
  ref={sectionRefs.highlights}
  className="mb-10 scroll-mt-20"
>
  <h3 className="text-xl font-semibold mb-3 text-gray-800">Highlights</h3>
  <ul className="space-y-2 text-gray-700 list-disc pl-5">
    {productData.highlights.split('\n').filter(item => item.trim()).map((item, index) => (
      <li key={index} className="text-gray-700">
        {item.trim()}
      </li>
    ))}
  </ul>
</div>

      {/* Specifications */}
      {productData.specifications && (
        <div 
  ref={sectionRefs.specifications}
  className="mb-10 scroll-mt-20"
>
  <h3 className="text-xl font-semibold mb-3 text-gray-800">Specifications</h3>
  <div className="grid md:grid-cols-2 gap-6">
    <div className="space-y-3">
      {selectedVariant?.weight && (
        <div>
          <h4 className="text-gray-600 font-bold">Weight</h4>
          <p className="text-gray-800">{(selectedVariant?.weight/1000).toFixed(1) ?? 0.0}kg</p>
        </div>
      )}
      {selectedVariant?.sellerSKU && (
        <div>
          <h4 className="text-gray-600 font-bold">SKU</h4>
          <p className="text-gray-800">{selectedVariant.sellerSKU}</p>
        </div>
      )}
      {productData.specifications.mainMaterial && (
        <div>
          <h4 className="font-bold text-gray-600">Material</h4>
          <p className="text-gray-800">{productData.specifications.mainMaterial}</p>
        </div>
      )}
      {productData.specifications.model && (
        <div>
          <h4 className="font-bold text-gray-600">Model</h4>
          <p className="text-gray-800">{productData.specifications.model}</p>
        </div>
      )}
      {productData.specifications.productionCountry && (
        <div>
          <h4 className="font-bold text-gray-600">Production Country</h4>
          <p className="text-gray-800">{productData.specifications.productionCountry}</p>
        </div>
      )}
    </div>
    <div className="space-y-3">
      {productData.specifications.warrantyDuration && (
        <div>
          <h4 className="font-bold text-gray-600">Warranty</h4>
          <p className="text-gray-800">{productData.specifications.warrantyDuration}</p>
        </div>
      )}
      {productData.specifications.certification && (
        <div>
          <h4 className="font-bold text-gray-600">Certification</h4>
          <p className="text-gray-800">{productData.specifications.certification}</p>
        </div>
      )}
      {productData.specifications.nafdac && (
        <div>
          <h4 className="font-bold text-gray-600">NAFDAC</h4>
          <p className="text-gray-800">{productData.specifications.nafdac}</p>
        </div>
      )}
      {productData.specifications.fdaApproved && (
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-800">FDA Approved</span>
        </div>
      )}

      
    </div>
  </div>
  {productData.specifications.disclaimer && (
        <div className='w-full mt-5'>
          <h4 className="font-bold text-gray-600">Disclaimer</h4>
          <p className="text-gray-800">{productData.specifications.disclaimer}</p>
        </div>
      )}
  {/* Show message if no specifications are available */}
  {!selectedVariant?.sellerSKU && 
   !productData.weight && 
   !productData.specifications.mainMaterial && 
   !productData.specifications.model && 
   !productData.specifications.productionCountry && 
   !productData.specifications.warrantyDuration && 
   !productData.specifications.certification && 
   !productData.specifications.fdaApproved && (
    <p className="text-gray-500 italic">No specifications available for this product</p>
  )}
</div>
      )}

      {/* What's in the box */}
      {productData.specifications?.whatIsInTheBox && (
        <div 
          ref={sectionRefs.whatsInBox}
          className="mb-10 scroll-mt-20"
        >
          <h3 className="text-xl font-semibold mb-3 text-gray-800">What's Included</h3>
          <div className="prose max-w-none text-gray-700">
            {productData.specifications.whatIsInTheBox}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsSection;