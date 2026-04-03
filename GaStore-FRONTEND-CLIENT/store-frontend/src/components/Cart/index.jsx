"use client"
import endpointsPath from '@/constants/EndpointsPath';
import formatNumberToCurrency from '@/utils/numberToMoney';
import requestHandler from '@/utils/requestHandler';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { 
  FiMinus, 
  FiPlus, 
  FiHelpCircle 
} from 'react-icons/fi';

// Cart operations utility
const useCart = () => {
  const [cart, setCart] = useState({ items: [], count: 0, subtotal: 0 });

  const checkIfProductExists = async (id) => {
    try {
      const response = await requestHandler.get(`${endpointsPath.product}/${id}`);
      return response.statusCode === 200;
    } catch (err) {
      console.error("checkIfProductExists error:", err);
      return false;
    }
  };

  const getTieredPrice = useCallback((tiers, quantity) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    return (
      sorted.find((t) => quantity >= t.minQuantity)?.pricePerUnit ||
      sorted[sorted.length - 1]?.pricePerUnit ||
      0
    );
  }, []);

  const updateCart = useCallback(async () => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      // Check existence for each item (in parallel)
      const availabilityList = await Promise.all(
        savedCart.map((item) => checkIfProductExists(item.id))
      );

      const items = savedCart.map((item, idx) => {
        const unitPrice = getTieredPrice(item.pricingTiers, item.quantity);

        return {
          ...item,
          unitPrice,
          unavailable: availabilityList[idx] === false, // mark unavailable if product no longer exists
        };
      });

      // subtotal should only count available items
      const subtotal = items.reduce((sum, item) => {
        if (item.unavailable) return sum;
        return sum + item.unitPrice * item.quantity;
      }, 0);

      setCart({
        items,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
      });
    } catch (error) {
      console.error("Error parsing cart data:", error);
      localStorage.removeItem("cart");
      setCart({ items: [], count: 0, subtotal: 0 });
    }
  }, [getTieredPrice]);

  const updateQuantity = useCallback(
    (id, newQty) => {
      setCart((prev) => {
        // if the product is unavailable, don't let them change quantity
        const updated = prev.items.reduce((acc, item) => {
          if (item.id === id) {
            if (newQty > 0 && !item.unavailable) {
              const finalQuantity = Math.min(
                newQty,
                item.stockQuantity || Infinity
              );
              acc.push({
                ...item,
                quantity: finalQuantity,
                unitPrice: getTieredPrice(
                  item.pricingTiers,
                  finalQuantity
                ),
              });
            }
            // if newQty is 0 -> remove from cart, even if unavailable
            else if (newQty === 0) {
              // just don't push it, effectively removing
            }
          } else {
            acc.push(item);
          }
          return acc;
        }, []);

        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cart-updated"));

        const subtotal = updated.reduce((sum, item) => {
          if (item.unavailable) return sum;
          return sum + item.unitPrice * item.quantity;
        }, 0);

        return {
          items: updated,
          count: updated.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
          subtotal,
        };
      });
    },
    [getTieredPrice]
  );

  return { cart, updateCart, updateQuantity };
};


export default function CartComponent() {
  const { cart, updateCart, updateQuantity } = useCart();
  
  useEffect(() => {
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, [updateCart]);

const CartItem = ({ item }) => {
  const isMaxQuantity = item.quantity >= (item.stockQuantity || Infinity);

  const wrapperClasses = `
    p-4 border-b flex gap-4
    ${item.unavailable ? "bg-red-50 border-red-400" : ""}
  `;

  return (
    <div>
      <li className={wrapperClasses}>
        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            className={`w-full h-full object-cover ${
              item.unavailable ? "opacity-40" : ""
            }`}
          />
        </div>

        <div className="flex-1">
          <h3 className={`font-medium ${item.unavailable ? "text-red-600" : ""}`}>
            {item.name}
          </h3>

          {item.unavailable ? (
            <>
              <p className="text-red-600 text-sm font-semibold">
                Item no longer available
              </p>
              <p className="text-gray-500 text-xs">
                Please remove this item to continue
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                {formatNumberToCurrency(item.unitPrice)}
              </p>
              {/*item.stockQuantity && (
                <p className="text-sm text-gray-500">
                  In Stock: {item.stockQuantity}
                </p>
              )*/}
              {item.variantName && (
                <p className="text-sm text-gray-500">
                  {item.variantName}
                </p>
              )}
            </>
          )}

          {/* Mobile price + remove */}
          <div className="text-right md:hidden block mt-2">
            <p className="font-medium">
              {item.unavailable
                ? "—"
                : formatNumberToCurrency(item.unitPrice * item.quantity)}
            </p>
            <button
              onClick={() => updateQuantity(item.id, 0)}
              className="text-red-500 text-sm hover:text-red-700 mt-1"
              aria-label="Remove item"
            >
              Remove
            </button>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center mt-2">
            <button
              onClick={() => !item.unavailable && updateQuantity(item.id, item.quantity - 1)}
              className={`p-1 rounded ${
                item.unavailable
                  ? "bg-red-200 cursor-not-allowed text-red-800"
                  : "bg-gray-200 hover:bg-gray-300"
              } disabled:opacity-50`}
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1 || item.unavailable}
            >
              <FiMinus size={14} />
            </button>

            <span className="mx-2 w-8 text-center">{item.quantity}</span>

            <button
              onClick={() =>
                !item.unavailable && updateQuantity(item.id, item.quantity + 1)
              }
              className={`p-1 rounded ${
                item.unavailable
                  ? "bg-red-200 cursor-not-allowed text-red-800"
                  : isMaxQuantity
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label="Increase quantity"
              disabled={item.unavailable || isMaxQuantity}
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>

        {/* Desktop price + remove */}
        <div className="text-right hidden md:block">
          <p className="font-medium">
            {item.unavailable
              ? "—"
              : formatNumberToCurrency(item.unitPrice * item.quantity)}
          </p>
          <button
            onClick={() => updateQuantity(item.id, 0)}
            className="text-red-500 text-sm hover:text-red-700 mt-1"
            aria-label="Remove item"
          >
            Remove
          </button>
        </div>
      </li>
    </div>
  );
};


  return (
    <div 
      className="bg-black/50 flex justify-end z-50" 
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white w-full h-screen flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          {cart.items.length > 0 ? (
            <ul>
              {cart.items.map(item => (
                <CartItem key={`${item.id}-${item.variantId}`} item={item} />
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          )}
        </div>

        {cart.items.length > 0 && (
  <div className="p-4 border-t">
    <div className="flex justify-between mb-4">
      <span>Subtotal:</span>
      <span className="font-bold">
        {formatNumberToCurrency(cart.subtotal)}
      </span>
    </div>

    {cart.items.some(i => i.unavailable) && (
      <p className="text-red-600 text-sm mb-2">
        Remove unavailable items to continue checkout.
      </p>
    )}

    <Link
      href={cart.items.some(i => i.unavailable) ? "#" : "/checkout"}
      className={`block w-full py-3 text-center rounded transition
        ${
          cart.items.some(i => i.unavailable)
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      aria-disabled={cart.items.some(i => i.unavailable)}
    >
      Proceed to Checkout
    </Link>
  </div>
)}

      </div>
    </div>
  );
}