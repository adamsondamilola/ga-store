import PageHeader from "@/components/layout/PageHeader";
import WebsiteContentSections from "@/components/layout/WebsiteContentSections";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";
import getWebsiteContent from "@/utils/getWebsiteContent";

export async function generateMetadata() {
  return {
    title: "Terms of Service" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Terms of Service" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default async function TermsOfService() {
  const websiteContent = await getWebsiteContent();

  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <PageHeader
          title="Terms of Service"
          subtitle="Understand the terms that govern your use of our services."
        />

        <WebsiteContentSections content={websiteContent.termsOfServiceContent} />

        <div className="mt-8 border-t pt-4">
          <p className="text-gray-700">
            If you have any questions or concerns regarding these Terms of
            Service, please contact our customer service team at{" "}
            <a
              href={`mailto:${websiteContent.supportEmail || websiteContent.infoEmail}`}
              className="text-blue-600 hover:underline"
            >
              {websiteContent.supportEmail || websiteContent.infoEmail}
            </a>{" "}
            or by phone at {websiteContent.phoneNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}
