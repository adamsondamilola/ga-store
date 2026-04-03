import OrderTrackingView from '@/components/Order/TrackOrder';
import AppImages from '@/constants/Images';
import AppStrings from '@/constants/Strings';
import { Suspense } from 'react';

export async function generateMetadata() {
  return {
    title: "Track Order" || AppStrings.title,
    description: AppStrings.description,
    openGraph: {
      title: "Track Order" || AppStrings.title,
      description: AppStrings.description,
      images: AppImages.meta,
    },
  };
}

export default function CheckoutPage() {
  return (
    <main className="">
      <div className="container mx-auto md:px-4 px-0">
        <Suspense fallback={<div>Loading...</div>}>
          <OrderTrackingView />
        </Suspense>
      </div>
    </main>
  );
}