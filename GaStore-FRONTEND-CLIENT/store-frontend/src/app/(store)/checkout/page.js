'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Checkout = dynamic(
  () => import('@/components/Checkout'),
  { 
    ssr: false,
    loading: () => <div>Loading checkout...</div>
  }
);

export default function CheckoutPage() {
  return (
    <main className="">
      <div className="container mx-auto md:px-4 px-4"> 
        <Suspense fallback={<div>Loading...</div>}>
          <Checkout />
        </Suspense>
        </div>
    </main>
  );
}