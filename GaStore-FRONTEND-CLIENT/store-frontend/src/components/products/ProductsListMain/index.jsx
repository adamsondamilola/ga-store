'use client'
import DesktopCartRail from "@/components/layout/DesktopCartRail";
import { useEffect, useState } from "react";
import ProductList from "../ProductList";
import requestHandler from "@/utils/requestHandler";
import Spinner from "@/utils/spinner";

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


export default function ProductListMain({endpointsPath, search}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    async function getProducts() {
  try {
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    const res = await requestHandler.getServerSide(`${endpointsPath}?searchTerm=${encodeURIComponent(normalizedSearch)}&pageNumber=1&pageSize=1000`, false);
    setProducts(res?.result?.data || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }finally{
   setLoading(false)
  }
}
getProducts();
  }, [endpointsPath, search])

  return (
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_172px] xl:items-start">
          <div className="min-w-0">
            <ProductList products={products} />
            <Spinner loading={loading} />
          </div>
          <DesktopCartRail className="xl:sticky xl:top-24" />
        </div>
      </div>
  );
}
