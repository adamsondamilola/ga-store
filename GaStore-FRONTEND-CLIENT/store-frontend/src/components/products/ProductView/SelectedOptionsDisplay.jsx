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

  const applicableTier = pricingTiers
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((tier) => quantity >= tier.minQuantity);

  const displayPrice = applicableTier ? applicableTier.pricePerUnit : price;
  const total = displayPrice * quantity;
  const imageUrl = selectedVariant.images?.[0]?.imageUrl || defaultImage || AppImages.default;

  const nextTier = pricingTiers
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .find((tier) => quantity < tier.minQuantity);

  const isMaxQuantity = quantity >= selectedVariant.stockQuantity;

  return (
    <div className="rounded-[24px] border border-gray-200 bg-[#fafafa] p-4">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Selected Option</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Subtotal</p>
          <p className="text-lg font-semibold text-gray-950">{formatNumberToCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src={imageUrl}
              alt={selectedVariant.name}
              className="h-16 w-14 object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{selectedVariant.name || 'Standard option'}</p>
            {selectedColor && selectedColor !== 'null' && (
              <p className="mt-1 text-xs text-gray-500">Color: {selectedColor}</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Unit price</p>
          <p className="mt-1 text-base font-semibold text-gray-950">
            {formatNumberToCurrency(displayPrice)}
          </p>
          {applicableTier && applicableTier.minQuantity > 1 && (
            <p className="mt-1 text-xs text-gray-500">
              Bulk pricing applied from {applicableTier.minQuantity} units
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 justify-self-start rounded-full border border-gray-200 bg-white px-2 py-2 sm:justify-self-end">
          <button
            onClick={handleDecrease}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              quantity > 1 ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="w-6 text-center text-sm font-semibold text-gray-900">{quantity}</span>
          <button
            onClick={handleIncrease}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isMaxQuantity ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            disabled={isMaxQuantity}
          >
            +
          </button>
        </div>
      </div>

      {nextTier && (
        <div className="mt-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
          Buy {nextTier.minQuantity} or more for {formatNumberToCurrency(nextTier.pricePerUnit)} each.
        </div>
      )}
    </div>
  );
};

export default SelectedOptionsDisplay;
