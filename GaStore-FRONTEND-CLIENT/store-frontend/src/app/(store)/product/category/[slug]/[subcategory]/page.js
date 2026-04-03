import ProductListByCategory from "@/components/products/ProductsByCategory";
import endpointsPath from "@/constants/EndpointsPath";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import Styles from "@/constants/Styles";
import { ChevronRight } from "@mui/icons-material";
import Link from "next/link";

// Helper to convert slug to Title Case
function formatSlugToTitle(slug) {
  return slug
    ?.split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Metadata generation
export async function generateMetadata({ params, searchParams }) {
  const { slug, subcategory } = params;

  return {
    title: formatSlugToTitle(subcategory) || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: formatSlugToTitle(subcategory) || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

// Page component
export default async function ProductsSubCategoryPage({ params, searchParams }) {
  const search = searchParams?.id || '';
  const catId = searchParams?.catId || '';
  const { slug, subcategory } = params;
  const formattedTitle = formatSlugToTitle(subcategory);

  return (
    <main>
      <div className="container mx-auto md:px-4 px-4">
        <h4 className={Styles.pageTitle}>{formattedTitle}</h4>
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-600 space-x-2 mb-4">
          <Link href="/">Home</Link>
          <ChevronRight fontSize="small" />
          <Link href={`/product/category/${slug}?id=${catId}`}>{formatSlugToTitle(slug)}</Link>
          <ChevronRight fontSize="small" />
          <span>{formattedTitle}</span>
        </div>
      </div>

      {/* Product List */}
      <ProductListByCategory
        endpointsPath={endpointsPath.product}
        search={subcategory || search}
      />
    </main>
  );
}
