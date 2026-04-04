import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import FooterComponent from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import Image from "next/image";
import getWebsiteContent from "@/utils/getWebsiteContent";
import { getWebsiteLogo } from "@/utils/websiteContentDefaults";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Account | GaStore",
  description: "Account | GaStore",
};

export default async function RootLayout({ children }) {
  const websiteContent = await getWebsiteContent();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Split-screen container */}
          <div className="flex flex-1">
            {/* Left column with image */}
            <div className="hidden lg:block relative w-1/2 h-screen">
              <Image
                src="/images/auth_bg.png" // Replace with your image path
                alt={websiteContent.siteName}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white p-8 max-w-md">
                  <h2 className="text-4xl font-bold mb-4">Welcome to <br/>{websiteContent.siteName}</h2>
                  {/*<p className="text-lg">
                    Discover delicious meals and manage your account with ease.
                  </p>*/}
                </div>
              </div>
            </div>

            {/* Right column with login form */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex-grow flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                  <div className="justify-center flex mb-4">
                    <img 
  src={getWebsiteLogo(websiteContent)}
  alt={websiteContent.siteName}
  className="w-32 h-auto"
  width={128}
  height={64}
/>
                  </div>
                  {children}
                </div>
              </div>
            </div>
          </div>

          <Toaster position="top-right" />
          <FooterComponent className="bg-white border-t border-gray-100" />
        </div>
      </body>
    </html>
  );
}
