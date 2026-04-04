import DesktopCartRail from "@/components/layout/DesktopCartRail";
import ProductListByCategory from "@/components/products/ProductsByCategory";
import endpointsPath from "@/constants/EndpointsPath";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import Styles from "@/constants/Styles";
import { slugToString } from "@/utils/stringToSlug";
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
  const { slug } = params;

  return {
    title: formatSlugToTitle(slug) || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: formatSlugToTitle(slug) || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

// Page component
export default async function ProductsPage({ params, searchParams }) {
  const search = searchParams?.id || '';
  const { slug } = params;
  const formattedTitle = formatSlugToTitle(slug);
  const searchTerm = slugToString(slug) || search;

  return (
    <main>
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_172px] xl:items-start">
          <div className="min-w-0">
            <div className="md:px-0 px-0">
              <h4 className={Styles.pageTitle}>{formattedTitle}</h4>

              <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/">Home</Link>
                <ChevronRight fontSize="small" />
                <span>{formattedTitle}</span>
              </div>
            </div>

            <ProductListByCategory
              endpointsPath={endpointsPath.product}
              search={searchTerm}
            />
          </div>

          <DesktopCartRail className="xl:sticky xl:top-20" />
        </div>
      </div>
    </main>
  );
}
