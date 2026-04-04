import { Inter } from "next/font/google";
import "./globals.css";
import getWebsiteContent from "@/utils/getWebsiteContent";
import { WebsiteContentProvider } from "@/components/providers/WebsiteContentProvider";

export async function generateMetadata() {
  const websiteContent = await getWebsiteContent();
  const siteName = websiteContent.siteName || "GaStore";
  const description = websiteContent.siteDescription;

  return {
    title: {
      default: `${siteName} - Online Store`,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: ["GaStore", "online store", "ecommerce", "shopping", "everyday products", "lifestyle products", "Nigeria online store", "general merchandise"],
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
      minimumScale: 1,
      viewportFit: "cover",
    },
    authors: [{ name: siteName, url: "https://www.towg.com.ng" }],
    creator: siteName,
    publisher: `${siteName} Enterprises`,
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
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: "https://www.towg.com.ng",
      siteName,
      title: `${siteName} - Online Store for Different Types of Products`,
      description,
      images: [
        {
          url: "https://www.towg.com.ng/images/og-image.png",
          width: 1200,
          height: 630,
          alt: `${siteName} online store products`,
          type: "image/png",
        },
      ],
      countryName: "Nigeria",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - Online Store for Different Types of Products`,
      description,
      images: ["https://www.towg.com.ng/images/og-image.png"],
      creator: `@${siteName}`,
      site: `@${siteName}`,
    },
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
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: true,
      date: true,
      address: true,
      email: true,
      url: true,
    },
    category: "shopping",
    referrer: "origin-when-cross-origin",
    themeColor: "#2E7D32",
    colorScheme: "light",
    other: {
      "X-UA-Compatible": "IE=edge",
    },
    classification: "E-commerce, Online Store, General Merchandise",
    copyright: `${siteName}. All rights reserved.`,
    generator: "Next.js",
    applicationName: siteName,
    metadataBase: new URL("https://www.towg.com.ng"),
  };
}

const inter = Inter({ subsets: ["latin"] });
export default async function RootLayout({ children }) {
  const websiteContent = await getWebsiteContent();

  return (
    <html lang="en">
      <body className={`bg-white ${inter.className}`}>
        <WebsiteContentProvider initialContent={websiteContent}>
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
        </WebsiteContentProvider>
      </body>
    </html>
  );
}
