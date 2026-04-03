import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import StoreNavBar from "@/components/layout/StoreNavBar";
import FooterComponent from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

export const metadata = {
  // Basic metadata
  title: {
    default: "TOWG - Natural & Wellness Products",
    template: "%s | TOWG Natural & Wellness",
  },
  description: "Discover premium natural and wellness products at TOWG. Our carefully curated selection promotes holistic health and natural living in Nigeria.",
  keywords: ["TOWG", "natural products", "wellness", "organic", "herbal supplements", "healthy living", "eco-friendly", "Nigeria wellness store", "African natural products"],

  // Viewport for mobile optimization
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    minimumScale: 1,
    viewportFit: "cover",
  },

  // Authors and creators
  authors: [
    { name: "TOWG Natural & Wellness", url: "https://www.towg.com.ng" },
  ],
  creator: "TOWG Natural & Wellness",
  publisher: "TOWG Enterprises",

  // Icons and theme
  icons: {
    icon: [
      { url: "/images/favicon.ico" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/images/safari-pinned-tab.svg",
        color: "#2E7D32",
      },
    ],
  },

  // Manifest for PWA
  //manifest: "/site.webmanifest",

  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://www.towg.com.ng",
    siteName: "TOWG Natural & Wellness",
    title: "TOWG - Premium Natural & Wellness Products",
    description: "Discover premium natural and wellness products at TOWG Nigeria. Curated selection for holistic health and natural living.",
    images: [
      {
        url: "https://www.towg.com.ng/images/og-image.png", // Use absolute URL
        width: 1200,
        height: 630,
        alt: "TOWG Natural & Wellness Products",
        type: "image/png",
      },
    ],
    countryName: "Nigeria",
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "TOWG - Premium Natural & Wellness Products",
    description: "Discover premium natural and wellness products at TOWG Nigeria.",
    images: ["https://www.towg.com.ng/images/og-image.png"], // Use absolute URL
    creator: "@TOWG_Natural",
    site: "@TOWG_Natural",
  },

  // Robots for SEO
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Apple-specific
  appleWebApp: {
    capable: true,
    title: "TOWG Natural & Wellness",
    statusBarStyle: "default",
  },

  // Format detection
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },

  // Category
  category: "health",

  // SEO and performance
  referrer: "origin-when-cross-origin",
  themeColor: "#2E7D32",
  colorScheme: "light",
  other: {
    "X-UA-Compatible": "IE=edge",
  },

  // Classification
  classification: "E-commerce, Health & Wellness, Natural Products",

  // Copyright (static)
  copyright: "TOWG Natural & Wellness. All rights reserved.",
  
  // Additional useful metadata
  generator: "Next.js",
  applicationName: "TOWG Natural & Wellness",
  metadataBase: new URL("https://www.towg.com.ng"), // Important for absolute URLs
};

const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-white ${inter.className}`}>
      {/*<div className="fixed top-0 left-0 right-0 z-50">
      <StoreNavBar />
      </div>*/}
<div className="bg-gray-100">
  <div className="container mx-auto px-0">
          {children}
        </div>
        </div>
        {/*<FooterComponent/>
        <Toaster position="top-right" />*/}
      </body>
    </html>
  );
}
