"use client"
import Link from 'next/link';
import ImageSlider from './ImageSlider';
import FrontFeaturedProducts from '../products/FrontFeaturedProducts';
import endpointsPath from '@/constants/EndpointsPath';
import { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import { FiChevronRight } from 'react-icons/fi';
import Banners from '../Banner';
import FeaturedProducts from '@/app/(store)/product/featured/page';

const FeaturedProductsComponent = ({ product }) => {

  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const type = "Slider";
  const limit = 20;


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.featuredProduct}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${limit}`,
        false
      );
      if (response.statusCode === 200 && response.result?.data) {
        setProducts(response?.result?.data);
        setTotalPages(response?.result?.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    fetchProducts();
  },[])

  return (
   <div className="w-full">
  <div className='md:mt-5'></div>
   {products.length > 0 && (<div className="w-full px-4 sm:px-6 lg:px-8 p-5 bg-white">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
      Featured Products
    </h2>
    <Link 
      href="/product/featured" 
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 font-medium flex items-center"
      aria-label="View all featured products"
    >
      See more
      <FiChevronRight className="h-4 w-4 ml-1" />
    </Link>
  </div>
  
    <FrontFeaturedProducts products={products} />
    
  
</div>)}

</div>
  );
};

export default FeaturedProductsComponent;