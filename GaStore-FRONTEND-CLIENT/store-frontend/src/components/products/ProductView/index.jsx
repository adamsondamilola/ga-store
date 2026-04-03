'use client';
import ProductViewComponent from "./ProductViewComponent";
import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import Spinner from "@/utils/spinner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductView() {
  const [product, setProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await requestHandler.getServerSide(
          `${endpointsPath.product}/${id}`, 
          false
        );
        if (response?.statusCode <= 201) {
          setProduct(response.result?.data);
        } else {
          setError('Failed to load product');
        }
      } catch (err) {
        console.error('Product fetch error:', err);
        setError('An error occurred while loading the product');
      } finally {
        setLoading(false);
      }
    }

    async function fetchProductReviews() {
      try {
        //setLoading(true);
        setError(null);
        
        const response = await requestHandler.getServerSide(
          `${endpointsPath.productReview}?productId=${id}`, 
          false
        );
        if (response?.statusCode <= 201) {
          setProductReviews(response.result);
        } else {

        }
      } catch (err) {
//        console.error('Product fetch error:', err);
  //      setError('An error occurred while loading the product');
      } finally {
        //setLoading(false);
      }
    }
    fetchProductReviews();
    fetchProduct();
  }, [id]);

  if (loading) return <Spinner loading={loading} />;
  
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Error Loading Product</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button
        onClick={() => router.back()}
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Go Back
      </button>
    </div>
  );

  if (!product && !loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
      <p className="text-gray-600 mb-6">The requested product could not be found.</p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Continue Shopping
      </button>
    </div>
  );

  return <ProductViewComponent productData={product} productReviews={productReviews} />;
}