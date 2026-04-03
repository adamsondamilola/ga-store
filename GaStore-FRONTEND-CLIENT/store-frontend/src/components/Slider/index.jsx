"use client"
import Link from 'next/link';
import ImageSlider from './ImageSlider';
import FrontFeaturedProducts from '../products/FrontFeaturedProducts';
import endpointsPath from '@/constants/EndpointsPath';
import { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import { FiChevronRight } from 'react-icons/fi';
import Banners from '../Banner';
import FeaturedProductsComponent from './FeaturedProductsComponent';

const SliderCom = ({ product }) => {

  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const type = "Slider";
  const limit = 20;

    const fetchSliders = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.banner}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${limit}&type=${type}`,
        false
      );
      if (response.statusCode === 200 && response.result?.data) {
        setImages(response?.result?.data);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

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
    fetchSliders();
  },[])

  return (
   <div className="w-full">
  <div className="container mx-auto md:px-4 px-4">
    <div className="flex flex-col lg:flex-row gap-8 md:h-[750px] lg:h-[350px]">
      {/* Slider - takes 2/3 width on large screens, full width on mobile */}
      <div className="w-full lg:w-2/3">
        <ImageSlider images={images} />
      </div>

      {/* Featured Products - takes 1/3 width on large screens, full width on mobile */}
      <div className="w-full lg:w-1/3">
        <Banners/>
      </div>
    
    </div>
  </div>
  <div className='md:mt-5'></div>
    
    <FeaturedProductsComponent />    
 
</div>
  );
};

export default SliderCom