'use client';

import AppImages from '@/constants/Images';
import Link from 'next/link';
import { FiShoppingCart } from 'react-icons/fi';

export default function ProductCardSmall({ product }) {
  return (
    <div className="bg-white shadow rounded-md overflow-hidden hover:shadow-lg transition">
      <Link href={``} className="relative">
        <img
          src={product.image || AppImages.default}
          alt={product.title}
          className="w-full h-24 object-cover"
        />
        <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100">
          <FiShoppingCart className="text-lg" />
        </button>
      </Link>
      <div className="p-3">
        <p className="text-sm text-gray-800 truncate">{product.title}</p>
        <p className="font-bold text-sm text-black mt-1">{product.price}</p>
        </div>
    </div>
  );
}
