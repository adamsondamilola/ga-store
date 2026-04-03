'use client';
import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';
import { stringToSLug } from '@/utils/stringToSlug';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CategoriesList() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await requestHandler.get(
          `${endpointsPath.category}?searchTerm=&pageNumber=1&pageSize=100`,
          true
        );
        if (response.statusCode === 200 && response.result?.data) {
          setCategories(response.result.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="relative mb-4">
      {/* Horizontal Scroll Wrapper */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-4 px-4 py-3 border-b bg-transparent">
        {categories.length === 0 ? (
          <p className="text-gray-400 text-sm">Loading categories...</p>
        ) : (
          categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/product/category/${cat.slug || encodeURIComponent(stringToSLug(cat.name))}?id=${cat.id}`}
              className="flex-shrink-0 group text-center px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 bg-gray-50 transition-all duration-200"
            >
              {/* Category Icon or Placeholder */}
              <div className="flex justify-center mb-1">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    width={40}
                    height={40}
                    className="object-contain h-8 rounded-full"
                    unoptimized={cat.imageUrl?.includes('localhost')}
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 text-xl">
                    🧴
                  </div>
                )}
              </div>

              {/* Category Name */}
              <span className="text-md uppercase font-medium text-gray-700 group-hover:text-primary truncate w-34 block">
                {cat.name}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
