'use client'
import { useEffect, useState } from "react";
import ProductList from "../ProductList";
import requestHandler from "@/utils/requestHandler";
import Spinner from "@/utils/spinner";

export default function ProductListByCategory({endpointsPath, search, pageSize = 100, layout = 'grid'}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    async function getProducts() {
  try {
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    const res = await requestHandler.getServerSide(
      `${endpointsPath}?searchTerm=${encodeURIComponent(normalizedSearch)}&pageNumber=1&pageSize=${pageSize}`,
      false
    );
    setProducts(res?.result?.data || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }finally{
   setLoading(false)
  }
}
getProducts();
  }, [endpointsPath, pageSize, search])

  return (
      <div>
        <ProductList products={products} layout={layout} />
        <Spinner loading={loading} />
      </div>
  );
}
