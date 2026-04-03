'use client';

import endpointsPath from '@/constants/EndpointsPath';
import { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import Image from 'next/image';
import toast from 'react-hot-toast';
import AppImages from '@/constants/Images';

export default function Banners() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const type = "Banner";
  const limit = 4;

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.banner}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${limit}&type=${type}`,
        false
      );
      if (response.statusCode === 200 && response.result?.data) {
        setBanners(response?.result?.data);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 md:h-98">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 md:h-98 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile & Tablet: Horizontal Scroll Container */}
      <div className="block md:hidden">
        <div className="flex overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory scroll-smooth px-2">
          {banners.map((banner, index) => (
            <a
              key={index}
              href={banner.link ? banner.link : '#'}
              target={banner.link ? '_blank' : '_self'}
              className="flex-shrink-0 w-[85vw] max-w-[280px] snap-center"
            >
              <div className="relative h-[160px] w-full rounded-lg overflow-hidden shadow-md">
                <Image
                  src={banner.imageUrl}
                  alt={`Banner ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 85vw, 280px"
                  priority={index === 0}
                  unoptimized={banner.imageUrl?.includes('localhost')}
                  onError={(e) => {
                    e.target.src = AppImages.default;
                  }}
                />
              </div>
            </a>
          ))}
        </div>
        
        {/* Visual hint for scrolling */}
        {/*<div className="text-center mt-2">
          <span className="text-xs text-gray-500">← Scroll →</span>
        </div>*/}
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-4 mb-2 h-64 md:h-98">
          {banners.map((banner, index) => (
            <a
              key={index}
              href={banner.link ? banner.link : '#'}
              target={banner.link ? '_blank' : '_self'}
              className="block"
            >
              <div className="relative h-[170px] w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <Image
                  src={banner.imageUrl}
                  alt={`Banner ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 300px"
                  priority={index === 0}
                  unoptimized={banner.imageUrl?.includes('localhost')}
                  onError={(e) => {
                    e.target.src = AppImages.default;
                  }}
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}