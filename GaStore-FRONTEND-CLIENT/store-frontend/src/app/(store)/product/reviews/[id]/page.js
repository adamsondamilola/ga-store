import ProductReviews from "@/components/products/ProductReviews";
import ProductReviewList from "@/components/products/ProductReviews/list";
import ProductView from "@/components/products/ProductView";
import endpointsPath from "@/constants/EndpointsPath";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import { formatMetaImage } from "@/utils/formatMetaImage";
import requestHandler from "@/utils/requestHandler";

export async function generateMetadata({ params }) {
  const { id } = params;

  try {
    const response = await requestHandler.getServerSide(`${endpointsPath.product}/${id}`, false);
    const product = response.result.data;

    return {
      title: product?.name || AppStrings.title,
      description: product?.description || AppStrings.description,
      openGraph: {
        title: product?.name || AppStrings.title,
        description: product?.description || AppStrings.description,
        images: formatMetaImage(product?.image) || AppImages.meta,
      },
      twitter: {
        card: "summary_large_image", // Twitter card type
        title: product?.title || AppStrings.title,
        description: product?.description || AppStrings.description,
        images: formatMetaImage(product?.image) || AppImages.meta,
      }
    };
  } catch (error) {
    console.log("Error generating metadata:", error);
    return {
      title: AppStrings.title,
      description: AppStrings.description,
      openGraph: {
        title: AppStrings.title,
        description: AppStrings.description,
        images: AppImages.meta,
      },
    };
  }
}

const ViewProductReviewsScreen = ({params}) => {

    
  return (
      <ProductReviewList />   
  )
};

export default ViewProductReviewsScreen;