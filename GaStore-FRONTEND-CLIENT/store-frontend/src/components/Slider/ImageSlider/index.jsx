'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import AppImages from '@/constants/Images';

export default function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const videoRefs = useRef({});

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || !images?.length) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after pause
  };

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://res.cloudinary.com/')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const hasActionLink = (image) => Boolean(image?.hasLink && image?.link);
  const getSlideHref = (image) => hasActionLink(image) ? image.link : '#';
  const isVideoSlide = (image) => /\.(mp4|webm|mov|avi|m4v)(\?.*)?$/i.test(getMediaUrl(image?.imageUrl));

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      if (!video) return;

      if (Number(index) === currentIndex) {
        const playPromise = video.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, images]);

  if (!images?.length) return (
    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
      {/*<span className="text-gray-500">No images available</span>*/}
      <span className="text-gray-500">Loading...</span>
    </div>
  );

  return (
    <div className="relative w-full h-64 md:h-[358px] overflow-hidden rounded-lg shadow-lg bg-gray-100">
      <div className="relative h-full w-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <a
              href={getSlideHref(image)}
              target={hasActionLink(image) ? '_blank' : '_self'}
              rel={hasActionLink(image) ? 'noopener noreferrer' : undefined}
              className="block h-full w-full"
            >
              {isVideoSlide(image) ? (
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  src={getMediaUrl(image.imageUrl)}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={getMediaUrl(image.imageUrl)}
                  alt={image?.title || `Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  unoptimized={getMediaUrl(image.imageUrl)?.includes('localhost')}
                  onError={(e) => {
                    e.target.src = AppImages.default;
                  }}
                />
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                <div className="flex max-w-2xl flex-col items-center gap-4">
                  <h2 className="text-xl font-semibold text-white md:text-3xl">
                    {image?.title || 'Order Now'}
                  </h2>
                  <span className={`rounded-full px-6 py-3 text-sm font-semibold md:text-base ${
                    hasActionLink(image)
                      ? 'bg-white text-black transition hover:bg-gray-100'
                      : 'bg-white/70 text-black'
                  }`}>
                    Order Now
                  </span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      <button
        onClick={() => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentIndex(prev => (prev + 1) % images.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
