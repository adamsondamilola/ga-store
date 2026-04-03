import Contact from "@/components/Landing/Contact";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

export async function generateMetadata() {
  return {
    title: "Contact" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Contact" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default function ContactPage() {
  return (
    <Contact />
  );
}
