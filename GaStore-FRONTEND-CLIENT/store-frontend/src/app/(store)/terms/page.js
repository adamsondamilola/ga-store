import PageHeader from "@/components/layout/PageHeader";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

export async function generateMetadata() {
  return {
    title: "Privacy Policy" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Privacy Policy" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default function TermsOfService() {
  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
   
        <PageHeader
          title="Terms of Service"
          subtitle="Understand the terms that govern your use of our services."
        />

        <p className="text-gray-700 mb-6">
          Welcome to the TOWG Natural and Wellness website and online store. By
          accessing or using our services, you agree to be bound by these Terms
          of Service and our Privacy Policy. Please read these terms carefully
          before using our platform.
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Acceptance of Terms
            </h2>
            <p className="text-gray-700">
              By using the TOWG Natural and Wellness website, mobile applications, or
              any of our services, you acknowledge and agree to be bound by
              these Terms of Service, as well as any additional terms and
              conditions that may apply to specific features or offerings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Product Information and Availability
            </h2>
            <p className="text-gray-700">
              We strive to provide accurate and up-to-date information about our
              products, including descriptions, pricing, and availability.
              However, we reserve the right to make changes to our product
              offerings, pricing, and availability at any time without prior
              notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Ordering and Fulfillment
            </h2>
            <p className="text-gray-700">
              When you place an order with TOWG Natural and Wellness, we will process
              and fulfill your order to the best of our ability. We rely on our
              divine logistics partner, God is Good Delivery, to ensure timely
              and reliable delivery. Delivery times may vary based on your
              location and the time of day.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Payment and Billing
            </h2>
            <p className="text-gray-700">
              All payments made through the TOWG Natural and Wellness platform are
              processed securely through our payment gateway. You are
              responsible for providing accurate payment information and
              ensuring that your payment method is valid and up-to-date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Returns and Refunds
            </h2>
            <p className="text-gray-700">
              If you are not satisfied with your purchase, you may return the
              product within 3 days of delivery for a full refund. Please refer
              to our Refund Policy for detailed instructions on the return
              process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Intellectual Property
            </h2>
            <p className="text-gray-700">
              The TOWG Natural and Wellness website, content, and all associated
              intellectual property are the property of TOWG Natural and Wellness or
              its licensors. You may not modify, copy, distribute, transmit,
              display, reproduce, or create derivative works from our website or
              content without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Limitation of Liability
            </h2>
            <p className="text-gray-700">
              TOWG Natural and Wellness shall not be liable for any indirect, special,
              incidental, or consequential damages arising out of or related to
              your use of our services. Our total liability shall not exceed the
              amount you paid for the product or service in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700">
              These Terms of Service shall be governed by and construed in
              accordance with the laws of Nigeria. Any disputes arising from
              these terms shall be resolved in the courts of Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Modifications to Terms of Service
            </h2>
            <p className="text-gray-700">
              TOWG Natural and Wellness reserves the right to modify these Terms of
              Service at any time. It is your responsibility to review these
              terms periodically for any changes. Continued use of our services
              after any modifications constitutes your acceptance of the revised
              terms.
            </p>
          </section>
        </div>

        <div className="mt-8 border-t pt-4">
          <p className="text-gray-700">
            If you have any questions or concerns regarding these Terms of
            Service, please contact our customer service team at{" "}
            <a
              href="mailto:customercare@towg.com.ng"
              className="text-blue-600 hover:underline"
            >
              customercare@towg.com.ng
            </a>{" "}
            or by phone at {AppStrings.phoneNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}
