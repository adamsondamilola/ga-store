'use client';
//import ProductViewComponent from "./ProductViewComponent";
import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import Spinner from "@/utils/spinner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductReviews from ".";

export default function ProductReviewList() {
  const [productReviews, setProductReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  //const params = useSearchParams();
  //const id = params.get('id');
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!id) return;
    async function fetchProductReviews() {
      try {
        setLoading(true);
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
        setLoading(false);
//        console.error('Product fetch error:', err);
  //      setError('An error occurred while loading the product');
      } finally {
        setLoading(false);
      }
    }
    fetchProductReviews();
  }, [id]);

  if (loading) return <Spinner loading={loading} />;
  
  return <div className="max-w-7xl mx-auto px-4"><ProductReviews reviewsPerPage={10} productId={id} initialReviews={productReviews} /></div>
}