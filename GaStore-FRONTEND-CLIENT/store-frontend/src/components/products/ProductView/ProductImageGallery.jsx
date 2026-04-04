import AppImages from '@/constants/Images';
import { useEffect, useState } from 'react';

const ProductImageGallery = ({ imagesToShow, product, selectedImage = 0, onImageSelect }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localSelectedImage, setLocalSelectedImage] = useState(selectedImage);
  const getSafeImageSrc = (imageUrl) => {
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl === AppImages.loading) {
      return AppImages.default;
    }

    return imageUrl;
  };
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = AppImages.default;
  };

  useEffect(() => {
    setLocalSelectedImage(selectedImage);
  }, [selectedImage]);

  const activeImageIndex = onImageSelect ? selectedImage : localSelectedImage;

  const selectImage = (index) => {
    if (onImageSelect) {
      onImageSelect(index);
      return;
    }

    setLocalSelectedImage(index);
  };

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);

  const navigateImage = (direction) => {
    const nextIndex = direction === 'prev'
      ? (activeImageIndex > 0 ? activeImageIndex - 1 : imagesToShow.length - 1)
      : (activeImageIndex < imagesToShow.length - 1 ? activeImageIndex + 1 : 0);

    selectImage(nextIndex);
  };

  if (!imagesToShow?.length) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white p-10 text-center text-gray-500">
        No image available
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="hidden max-h-[640px] w-20 flex-shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
          {imagesToShow?.map((image, index) => (
            <button
              key={image.id || `${image.imageUrl}-${index}`}
              onClick={() => selectImage(index)}
              className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                activeImageIndex === index ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={getSafeImageSrc(image.imageUrl)}
                alt={`Thumbnail ${index + 1}`}
                className="h-24 w-full object-cover"
                onError={handleImageError}
              />
            </button>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[28px] border border-gray-200 bg-[#fafafa]">
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            {activeImageIndex + 1} / {imagesToShow.length}
          </div>

          <img
            src={getSafeImageSrc(imagesToShow[activeImageIndex]?.imageUrl)}
            alt={product.name}
            className="h-[420px] w-full cursor-zoom-in object-contain sm:h-[520px] lg:h-[640px]"
            onClick={openFullscreen}
            onError={handleImageError}
          />

          {imagesToShow.length > 1 && (
            <>
              <button 
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              <button 
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {imagesToShow?.map((image, index) => (
          <button
            key={image.id || `${image.imageUrl}-${index}`}
            onClick={() => selectImage(index)}
            className={`flex-shrink-0 overflow-hidden rounded-2xl border transition-all ${
              activeImageIndex === index ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img
              src={getSafeImageSrc(image.imageUrl)}
              alt={`Thumbnail ${index + 1}`}
              className="h-16 w-14 object-cover"
              onError={handleImageError}
            />
          </button>
        ))}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button 
            onClick={closeFullscreen}
            className="absolute right-6 top-20 z-50 text-white transition hover:text-gray-300"
            aria-label="Close fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative z-40 flex h-full max-h-screen w-full max-w-6xl items-center justify-center">
            <img
              src={getSafeImageSrc(imagesToShow[activeImageIndex]?.imageUrl)}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onError={handleImageError}
            />

            {imagesToShow.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
