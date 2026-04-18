import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import FooterComponent from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import { DashboardNavBarComponent } from "@/components/Dashboard/NavBar_/dashboardNav";
import AsideComponent from "@/components/Dashboard/NavBar_/aside";
import StoreNavBar from "@/components/layout/StoreNavBar";

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

export default function RootLayoutDashboard({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed top-0 left-0 right-0 z-50">
              <StoreNavBar />
              <div className="md:hidden block"><DashboardNavBarComponent/></div>
              </div>
         {/*<header className="fixed w-full z-10 shadow">
        <DashboardNavBarComponent/>
      </header>*/}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 mt-10 md:mt-2">
      
      <div className="flex">
      <div className="w-1/4 py-16 h-screen hidden md:block relative overflow-y-auto no-scrollbar">
      <AsideComponent/>
      </div>
      <div className="w-full p-5 relative h-full overflow-y-auto no-scrollbar">
        <div className='py-6'></div>
       {children}
      </div>
      </div>
<Toaster position="top-right" />
        <FooterComponent/>
        </div>
      </body>
    </html>
  );
}
