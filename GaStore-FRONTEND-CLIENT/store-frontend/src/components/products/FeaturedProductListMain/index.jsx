'use client'
import { useEffect, useState } from "react";
import ProductList from "../ProductList";
import requestHandler from "@/utils/requestHandler";
import Spinner from "@/utils/spinner";
import FeaturedProductList from "./list";

 /* const mockProducts = Array.from({ length: 50 }).map((_, index) => ({
  title: `Product ${index + 1}`,
  image: 'https://static.vecteezy.com/system/resources/thumbnails/006/091/020/small_2x/sample-stamp-in-rubber-style-red-round-grunge-sample-sign-rubber-stamp-on-white-illustration-free-vector.jpg',
  price: `NGN${(Math.random() * 10000 + 1000).toFixed(2)}`,
  sold: Math.floor(Math.random() * 100),
  discount: `NGN${(Math.random() * 2000).toFixed(2)}`,
  shipping: `NGN${(Math.random() * 20000).toFixed(0)}`,
  featured: index % 10 === 0,
}));
const featured = mockProducts.filter((p) => p.featured);
*/


export default function FeaturedProductListMain({endpointsPath, search}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    async function getProducts() {
  try {
    const res = await requestHandler.getServerSide(`${endpointsPath}?searchTerm=${search}&pageNumber=1&pageSize=100`, false);
    setProducts(res?.result?.data || []);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }finally{
   setLoading(false)
  }
}
getProducts();
  }, [])

  return (
      <div>
        <FeaturedProductList products={products} />
        <Spinner loading={loading} />
      </div>
  );
}
