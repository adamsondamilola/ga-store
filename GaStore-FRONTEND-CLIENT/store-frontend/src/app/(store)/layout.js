import { Geist, Geist_Mono, Inter } from "next/font/google";
import "../globals.css";
import StoreNavBar from "@/components/layout/StoreNavBar";
import FooterComponent from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TOWG",
  description: "TOWG",
};

const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-white ${inter.className}`}>
        <ScrollToTop /> {/* Add this component */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <StoreNavBar />
        </div>
        <div className="mt-8 bg-[#f3f5f8] py-6 md:mt-16 md:py-8">
          <div className="w-full px-0 text-gray-900">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
        <FooterComponent/>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
