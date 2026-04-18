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
  title: "Account | Retina",
  description: "Account | Retina",
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
            
            {/* Right column with login form */}
            <div className="w-full lg:w-wull flex flex-col">
              <div className="flex-grow flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                  <div className="justify-center flex mb-4">
                    <img 
  src={'/images/logo.png'}
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
