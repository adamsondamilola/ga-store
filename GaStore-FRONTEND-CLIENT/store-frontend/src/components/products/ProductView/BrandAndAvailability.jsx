import formatNumberToCurrency from "@/utils/numberToMoney";

const BrandAndAvailability = ({ basePrice, product }) => {
return (
    <div className="text-start space-y-4 md:mt-10">
  {/* Brand and Availability Row */}
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center">
      <span className="text-gray-600 mr-2">Brand:</span>
      <span className="font-medium">
        {product?.brand?.name || 'No brand specified'}
      </span>
    </div>
    
    <div className="flex items-center gap-4">
      {product?.primaryColor && !product?.subCategory.hasColors && (
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Color:</span>
          <span className="font-medium">{product?.primaryColor}</span>
        </div>
      )}
      
      {product?.weight && (
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Weight:</span>
          <span className="font-medium">{product?.weight !== 'NILL' && product?.weight != null? <div>{product?.weight} kg</div> : ''}</span>
        </div>
      )}
      
      <span className={`inline-block text-sm px-3 py-1 rounded-full ${
        product?.isAvailable 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {product?.isAvailable ? 'In Stock' : 'Out of Stock'}
        {product?.stockQuantity > 0 && product?.isAvailable && (
          <span className="ml-1">({product?.stockQuantity} available)</span>
        )}
      </span>
    </div>
  </div>

  {/* Price */}
  {basePrice && (
    <div className="flex items-baseline gap-2">
      <div className="text-3xl font-bold text-blue-600">
        {formatNumberToCurrency(basePrice.pricePerUnit.toFixed(2))}
      </div>
      {basePrice.originalPrice && basePrice.originalPrice !== basePrice.pricePerUnit && (
        <div className="text-lg text-gray-500 line-through">
          {formatNumberToCurrency(basePrice.originalPrice.toFixed(2))}
        </div>
      )}
    </div>
  )}

  {/* Category */}
  {product?.subCategory?.name && (
    <div className="flex items-center">
      <span className="text-gray-600 mr-2">Category:</span>
      <span className="font-medium">{product?.subCategory.name}</span>
    </div>
  )}

  {/* Description */}
  <div className="mb-4">
    <h3 className="text-lg font-semibold mb-2">Product Description</h3>
    <div className="prose max-w-none text-gray-700 break-words">
      {product?.description ? (
        <p className="whitespace-pre-wrap">{product.description}</p>
      ) : (
        <p className="text-gray-400">No description available</p>
      )}
    </div>
  </div>

  {/* Highlights */}
  {product?.highlights && (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Key Features</h3>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        {product?.highlights.split('\n').map((highlight, index) => (
          highlight.trim() && <li key={index}>{highlight}</li>
        ))}
      </ul>
    </div>
  )}

  {/* Category Attributes */}
  {product?.category && (
    <div className="flex flex-wrap gap-4 text-sm">
      {product?.subCategory.hasColors && (
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          Color Options
        </span>
      )}
      {product?.subCategory.hasSizes && (
        <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
          Size Options
        </span>
      )}
      {product?.subCategory.hasStyles && (
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
          Style Options
        </span>
      )}
    </div>
  )}
</div>
);
}

export default BrandAndAvailability;