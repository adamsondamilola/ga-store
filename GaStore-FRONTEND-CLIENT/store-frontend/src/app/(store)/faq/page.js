import FAQs from "@/components/Landing/FAQs";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

export async function generateMetadata() {
  return {
    title: "FAQs" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "FAQs" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default function FAQsPage() {
  return (
    <FAQs />
  );
}
