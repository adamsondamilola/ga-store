import ProductView from "@/components/products/ProductView";
import endpointsPath from "@/constants/EndpointsPath";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import { formatMetaImage } from "@/utils/formatMetaImage";
import requestHandler from "@/utils/requestHandler";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = params; 
  const id = searchParams.id; 

  if (!id) {
    return {
      title: slug.replace(/-/g, ' ') || AppStrings.title,
      description: AppStrings.description,
      openGraph: {
        title: slug.replace(/-/g, ' ') || AppStrings.title,
        description: AppStrings.description,
        images: AppImages.meta,
      },
    };
  }

  try {
    const response = await requestHandler.getServerSide(`${endpointsPath.product}/${id}`, false);
    const product = response.result.data;
    return {
      title: product?.name || slug.replace(/-/g, ' ') || AppStrings.title,
      description: product?.description || AppStrings.description,
      openGraph: {
        title: product?.name || slug.replace(/-/g, ' ') || AppStrings.title,
        description: product?.description || AppStrings.description,
        images: formatMetaImage(product?.images[0]?.imageUrl) || AppImages.meta,
      },
      twitter: {
        card: "summary_large_image",
        title: product?.name || slug.replace(/-/g, ' ') || AppStrings.title,
        description: product?.description || AppStrings.description,
        images: formatMetaImage(product?.images[0]?.imageUrl) || AppImages.meta,
      },
    };
  } catch (error) {
    console.log("Error generating metadata:", error);
    return {
      title: slug.replace(/-/g, ' ') || AppStrings.title,
      description: AppStrings.description,
      openGraph: {
        title: slug.replace(/-/g, ' ') || AppStrings.title,
        description: AppStrings.description,
        images: AppImages.meta,
      },
    };
  }
}

const ViewProductScreen = ({ params, searchParams }) => {
  const { slug } = params;
  const id = searchParams.id;

  return (
      <ProductView id={id} slug={slug} />
  );
};

export default ViewProductScreen;