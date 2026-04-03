// app/shipping-policy/page.js

import PageHeader from "@/components/layout/PageHeader";
import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

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

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <PageHeader
          title="Shipping Policy"
          subtitle="How we ship your orders and keep you informed from dispatch to delivery."
        />

        <p className="mb-6 text-lg">
          At <span className="font-semibold">TOWG Natural & Wellness</span>, we
          understand the importance of timely and reliable delivery. We partner
          with <span className="font-semibold">God Is Good Delivery (GIG)</span>
          , a trusted logistics provider, to ensure your orders reach you as
          quickly and efficiently as possible.
        </p>

        {/* Shipping Methods */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Shipping Methods</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-semibold">God Is Good Delivery (GIG):</span>{" "}
              Our primary delivery partner for most orders.
            </li>
            <li>
              Where necessary, we may engage additional reliable carriers to
              support timely fulfillment based on your location.
            </li>
          </ul>
        </section>

        {/* Shipping Timelines */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Shipping Timelines</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Orders placed <span className="font-semibold">before 12:00 PM</span> (local time) are typically
              delivered the <span className="font-semibold">same day</span>.
            </li>
            <li>
              Orders placed <span className="font-semibold">after 12:00 PM</span> (local time) may be delivered the{" "}
              <span className="font-semibold">next business day</span>.
            </li>
            <li>
              Actual delivery times may vary based on destination, order volume,
              and unforeseen circumstances such as weather or traffic conditions.
            </li>
          </ul>
        </section>

        {/* Tracking & Delivery Confirmation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            Tracking & Delivery Confirmation
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You will receive a <span className="font-semibold">tracking number</span> via email/SMS once your
              order is dispatched.
            </li>
            <li>
              Track your order status on our website or by contacting our
              customer service team with your tracking details.
            </li>
            <li>
              A delivery confirmation message will be sent once your order is
              successfully delivered.
            </li>
          </ul>
        </section>

        {/* Damaged or Missing Items */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Damaged or Missing Items</h2>
          <p className="mb-2">
            If your order arrives damaged or any items are missing, please
            contact our customer service team within{" "}
            <span className="font-semibold">3 business days</span> of delivery.
          </p>
          <p>
            We will investigate the issue with our logistics partners and, where
            appropriate, arrange a <span className="font-semibold">replacement</span> or{" "}
            <span className="font-semibold">refund</span>.
          </p>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Customer Support</h2>
          <p>
            For shipping questions or assistance, contact us at{" "}
            <a
              href="mailto:customercare@towg.com.ng"
              className="text-blue-600 dark:text-blue-400 underline"
            >
              customercare@towg.com.ng
            </a>. We’re here to help ensure a
            smooth delivery experience.
          </p>
        </section>
      </div>
    </div>
  );
}
