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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        <PageHeader
          title="Privacy Policy"
          subtitle="How TOWG Limited collects, uses, and safeguards your personal information."
        />

        <p className="mb-6 text-lg">
          At <span className="font-semibold">TOWG Limited</span>, we are
          committed to protecting the privacy and security of our customers.
          This privacy policy outlines how we collect, use, and safeguard your
          personal information.
        </p>

        {/* Sections */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Information Collection</h2>
          <p className="mb-2">
            We collect personal information such as your name, email address,
            shipping address, and payment details when you place an order on our
            website or through our customer service channels.
          </p>
          <p>
            We may also collect non-personal information, such as your browsing
            history and preferences, to improve your shopping experience and
            tailor our marketing efforts.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Use of Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Process and fulfill your orders, handle customer service inquiries,
              and communicate with you about your account and orders.
            </li>
            <li>
              Send you promotional offers, product updates, and other marketing
              communications (you can opt-out at any time).
            </li>
            <li>
              We do <span className="font-semibold">not</span> sell or share
              your personal information with third parties for their own
              marketing purposes without your consent.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Data Security</h2>
          <p className="mb-2">
            We implement industry-standard security measures to protect your
            personal information from unauthorized access, disclosure, or
            misuse.
          </p>
          <p>
            Your payment information is processed through a secure,
            PCI-compliant payment gateway, and we do not store your full payment
            details on our servers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You have the right to access, update, or delete your personal
              information at any time by contacting our customer service team.
            </li>
            <li>
              You can also opt-out of receiving marketing communications from us
              by following the unsubscribe instructions in the emails or by
              contacting us directly.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
