import AppImages from '@/constants/Images';
import formatNumberToCurrency from '@/utils/numberToMoney';
import React from 'react';

const SelectedOptionsDisplay = ({
  selectedVariant,
  selectedColor,
  quantity,
  price,
  pricingTiers = [],
  defaultImage,
  onQuantityChange
}) => {
  if (!selectedVariant) return null;

  const handleIncrease = () => {
    if (quantity < selectedVariant.stockQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) onQuantityChange(quantity - 1);
  };

  // Find applicable tier price if available
  const applicableTier = pricingTiers
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find(tier => quantity >= tier.minQuantity);

  const displayPrice = applicableTier ? applicableTier.pricePerUnit : price;
  const total = displayPrice * quantity;
  const imageUrl = selectedVariant.images?.[0]?.imageUrl || defaultImage || AppImages.default;

  // Check if there's a better price available at higher quantity
  const nextTier = pricingTiers
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .find(tier => quantity < tier.minQuantity);

  // Check if quantity is at maximum stock
  const isMaxQuantity = quantity >= selectedVariant.stockQuantity;

  return (
    <div>
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Selected Options</h3>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {/* Image & Variant Name */}
          <div className="flex items-center space-x-4">
            <img
              src={imageUrl}
              alt={selectedVariant.name}
              className="w-10 h-10 object-cover rounded border"
            />
          </div>

          <div className='items-center flex'>
            <p className="text-sm text-gray-600">
              {selectedVariant.name || ' '}
            </p>
          </div>

          <div>
            <p className="text-lg text-gray-600">
              <strong>{formatNumberToCurrency(displayPrice)}</strong>
              {applicableTier && applicableTier.minQuantity > 1 && (
                <span className="text-xs text-green-600 ml-1">
                  (Bulk discount)
                </span>
              )}
            </p>
            {/*<p className="text-sm text-gray-500">
              In Stock: {selectedVariant.stockQuantity}
            </p>*/}
          </div>

          {/* Quantity Controls */}
          <div className="text-sm text-gray-600 flex items-center space-x-3">
            <button
              onClick={handleDecrease}
              className={`px-2 py-1 rounded ${quantity > 1 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 cursor-not-allowed'}`}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={handleIncrease}
              className={`px-2 py-1 rounded ${isMaxQuantity ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
              disabled={isMaxQuantity}
            >
              +
            </button>
          </div>
        </div>      
      </div>
      
      {/* Bulk discount notice */}
      {nextTier && (
        <div className="text-sm text-green-600 mt-2">
          Buy {nextTier.minQuantity} for {formatNumberToCurrency(nextTier.pricePerUnit)} each and save!
        </div>
      )}

      {/* Price Info */}
      <div className="text-xl text-gray-600 flex mt-3">
        <span className='text-lg mr-6'>Total {quantity} {quantity > 1 ? 'Items' : 'Item'}</span>
        <span className='text-lg'>Total Cost:</span> <strong>{formatNumberToCurrency(total)}</strong>
      </div>
    </div>
  );
};

export default SelectedOptionsDisplay;