'use client';

import useCart from '@/hooks/useCart';
import formatNumberToCurrency from '@/utils/numberToMoney';
import Image from 'next/image';
import Link from 'next/link';
import { FiCheck, FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi';

const isNullish = (value) => value === null || value === undefined || value === '' || value === 'null';

export default function DesktopCartRail({ className = '' }) {
  const { cart, updateQuantity } = useCart();
  const items = cart?.items?.filter((item) => !isNullish(item?.id) && !isNullish(item?.image)) || [];

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className={`hidden self-start xl:block ${className}`}>
      <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-lg">
        <div className="bg-[#f7efe5] px-3 py-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
            <FiShoppingCart className="text-[#f97316]" />
            <span>Subtotal</span>
          </div>
          <p className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
            {formatNumberToCurrency(cart.subtotal)}
          </p>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div className="rounded-2xl bg-[#f9f4ec] px-3 py-2 text-center">
            <p className="text-[11px] font-semibold text-[#f97316]">
              {cart.count} item{cart.count > 1 ? 's' : ''} ready for checkout
            </p>
          </div>


          <Link
            href="/checkout"
            className="block rounded-full bg-[#f97316] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#ea580c]"
          >
            Checkout ({cart.count})
          </Link>

          <Link
            href="/cart"
            className="block rounded-full border border-gray-300 px-3 py-2.5 text-center text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Go to cart
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-t border-gray-200 px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800">Cart items</span>
            <span className="text-xs text-gray-500">{items.length}</span>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => {
              const quantity = Number(item.quantity) || 1;
              const unitPrice = Number(item.unitPrice) || 0;
              const stockQuantity = Number(item.stockQuantity) || Infinity;

              return (
                <div key={`${item.id}-${item.variantId || ''}`} className="rounded-2xl border border-gray-200 p-2">
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name || 'Cart item'}
                      width={160}
                      height={160}
                      className="h-[108px] w-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
                      {item.variantName || 'Option'}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition hover:bg-white hover:text-red-500"
                      aria-label="Remove item from cart"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-gray-700">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#f97316]">
                    {formatNumberToCurrency(unitPrice * quantity)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      disabled={quantity <= 1}
                      aria-label="Decrease item quantity"
                    >
                      <FiMinus size={13} />
                    </button>
                    <div className="flex-1 rounded-full bg-gray-100 px-2 py-1 text-center text-xs font-semibold text-gray-700">
                      {quantity}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      disabled={quantity >= stockQuantity}
                      aria-label="Increase item quantity"
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
