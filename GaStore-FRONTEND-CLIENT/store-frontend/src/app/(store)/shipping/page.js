import PageHeader from "@/components/layout/PageHeader";
import WebsiteContentSections from "@/components/layout/WebsiteContentSections";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import getWebsiteContent from "@/utils/getWebsiteContent";

export async function generateMetadata() {
  return {
    title: "Shipping Policy" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Shipping Policy" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default async function ShippingPolicyPage() {
  const websiteContent = await getWebsiteContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <PageHeader
          title="Shipping Policy"
          subtitle="How we ship your orders and keep you informed from dispatch to delivery."
        />
        <WebsiteContentSections content={websiteContent.shippingPolicyContent} />
      </div>
    </div>
  );
}
