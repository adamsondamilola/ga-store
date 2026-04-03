import PageHeader from "@/components/layout/PageHeader";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

export async function generateMetadata() {
  return {
    title: "Refund Policy" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Refund Policy" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        <PageHeader
          title="Refund Policy"
          subtitle="Our commitment to your satisfaction and hassle-free returns process."
        />

        <p className="mb-6 text-lg">
          At <span className="font-semibold">TOWG Natural and Wellness</span>, we stand
          behind the quality and effectiveness of our organic health products.
          However, we understand that sometimes a product may not meet your
          expectations. That's why we offer a hassle-free refund policy.
        </p>

        {/* Sections */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Returns and Refunds</h2>
          <p className="mb-2">
            If you are not satisfied with your purchase, you may return the
            product within <span className="font-semibold">3 days of
            delivery</span> for a full refund.
          </p>
          <p className="mb-2">
            To initiate a return, please contact our customer service team with
            your order information and the reason for the return. We will
            provide you with a return authorization and instructions.
          </p>
          <p>
            Once we receive the returned item in its original condition, we will
            process your refund within <span className="font-semibold">5-7
            business days</span>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Exceptions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Custom-made or personalized items are{" "}
              <span className="font-semibold">not eligible</span> for returns or
              refunds.
            </li>
            <li>
              Products that have been opened, used, or damaged are{" "}
              <span className="font-semibold">not eligible</span> for a refund.
            </li>
            <li>
              We reserve the right to refuse a refund if we suspect the product
              has been misused or tampered with.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Customer Satisfaction</h2>
          <p className="mb-2">
            At <span className="font-semibold">TOWG Natural and Wellness</span>, your
            satisfaction is our top priority. If you have any concerns or issues
            with your purchase, please don't hesitate to reach out to our
            customer service team. We are committed to working with you to
            ensure your complete satisfaction.
          </p>
          <p>
            If you have any further questions or need assistance, please contact
            us at{" "}
            <a
              href="mailto:customercare@towg.com.ng"
              className="text-blue-600 dark:text-blue-400 underline"
            >
              customercare@towg.com.ng
            </a>{" "}
            or call us at{" "}
            <span className="font-semibold">{AppStrings.phoneNumber}</span>. We're
            here to help you achieve your health and wellness goals.
          </p>
        </section>
      </div>
    </div>
  );
}
