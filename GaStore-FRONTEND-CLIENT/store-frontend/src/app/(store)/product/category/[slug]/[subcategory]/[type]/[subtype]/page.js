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
  const { slug, subcategory, type, subtype } = params;

  return {
    title: formatSlugToTitle(subtype) || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: formatSlugToTitle(subtype) || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

// Page component
export default async function ProductTypePage({ params, searchParams }) {
  const search = searchParams?.id || '';
  const catId = searchParams?.catId || '';
  const typeId = searchParams?.typeId || '';
  const subTypeId = searchParams?.subTypeId || '';
  const { slug, subcategory, type, subtype } = params;
  const formattedTitle = formatSlugToTitle(subtype);

  return (
    <main>
      <div className="container mx-auto md:px-4 px-4">
        <h4 className={Styles.pageTitle}>{formattedTitle}</h4>
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-600 space-x-2 mb-4">
          <Link href="/">Home</Link>
          <ChevronRight fontSize="small" />
          <Link href={`/product/category/${slug}`}>{formatSlugToTitle(slug)}</Link>
          <ChevronRight fontSize="small" />
          <Link href={`/product/category/${slug}/${subcategory}`}>{formatSlugToTitle(subcategory)}</Link>
          <ChevronRight fontSize="small" />
          <Link href={`/product/category/${slug}/${subcategory}/${type}`}>{formatSlugToTitle(type)}</Link>
          <ChevronRight fontSize="small" />
          <span>{formattedTitle}</span>
        </div>
      </div>

      {/* Product List */}
      <ProductListByCategory
        endpointsPath={endpointsPath.product}
        search={subtype || search}
      />
    </main>
  );
}
