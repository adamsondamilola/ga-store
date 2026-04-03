import { useState } from 'react';

const ProductImageGallery = ({ imagesToShow, product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);

  const navigateImage = (direction) => {
    if (direction === 'prev') {
      setSelectedImage(prev => (prev > 0 ? prev - 1 : imagesToShow.length - 1));
    } else {
      setSelectedImage(prev => (prev < imagesToShow.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="relative">
      {/* Main Gallery */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Desktop Thumbnails */}
        <div className="hidden md:flex flex-col gap-2 w-10 md:w-20 flex-shrink-0 overflow-y-auto h-96">
          {imagesToShow?.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={`w-full aspect-square border-2 rounded-md overflow-hidden transition-all ${
                selectedImage === index ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image.imageUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        
        {/* Main Image */}
        <div className="flex-1 relative bg-white rounded-lg overflow-hidden h-96 cursor-zoom-in">
          {imagesToShow?.length > 0 ? (
            <>
              <img
                src={imagesToShow[selectedImage]?.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain transition-opacity duration-300"
                onClick={openFullscreen}
              />
              
              <button 
                onClick={() => navigateImage('prev')}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                onClick={() => navigateImage('next')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {selectedImage + 1} / {imagesToShow.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Thumbnails */}
      <div className="flex md:hidden gap-2 overflow-x-auto py-2 mt-2 scrollbar-hide">
        {imagesToShow?.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(index)}
            className={`w-16 h-16 flex-shrink-0 border-2 rounded-md transition-all ${
              selectedImage === index ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img
              src={image.imageUrl}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen Viewer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button 
      onClick={closeFullscreen}
      className="absolute top-20 right-6 text-white hover:text-gray-300 z-50" // Changed z-10 to z-50
      aria-label="Close fullscreen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
          
          <div className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center z-40">
            <img
              src={imagesToShow[selectedImage]?.imageUrl}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {selectedImage + 1} / {imagesToShow.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;