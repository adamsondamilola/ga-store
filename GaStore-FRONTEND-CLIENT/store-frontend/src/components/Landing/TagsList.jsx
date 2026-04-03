'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { stringToSLug } from '@/utils/stringToSlug';
import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';

export default function TagsList() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const page = 1;
  const limit = 20;

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await requestHandler.get(
          `${endpointsPath.tag}?page=${page}&limit=${limit}`,
          true
        );

        if (res?.statusCode === 200) {
          setTags(res.result.data || []);
        }
      } catch (error) {
        console.error("Tags fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return (
    <section className="py-14 md:mt-5">
      {/* Header */}
      <div className="max-w-xl mx-auto text-center mb-10 px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight uppercase">
          Explore Our Collections
        </h2>
        <p className="text-gray-600 mt-3 text-sm md:text-base leading-relaxed">
          Discover collections tailored to your wellness goals.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tags.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm md:text-base">
            No collections available at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/product/collections/${encodeURIComponent(
                  stringToSLug(tag.name)
                )}`}
                className="
                  group flex items-center justify-center 
                  bg-white text-gray-800 font-medium 
                  py-3 px-5 rounded-xl 
                  shadow-[0_2px_6px_rgba(0,0,0,0.06)]
                  border border-gray-200
                  hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700
                  transition-all duration-200
                "
              >
                <span className="group-hover:scale-110 transition-transform">
                  {tag.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
