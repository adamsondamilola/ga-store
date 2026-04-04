"use client";

import Link from "next/link";
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiTwitter } from "react-icons/fi";
import { useWebsiteContent } from "@/components/providers/WebsiteContentProvider";
import { getWebsiteLogo } from "@/utils/websiteContentDefaults";

export default function FooterComponent({ className = "" }) {
  const { websiteContent } = useWebsiteContent();

  return (
    <footer className={`w-full bg-[#18261f] pb-8 pt-14 text-[#d7ddd4] ${className}`.trim()}>
      <div className="w-full max-w-none px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#1d2f26_0%,#22362c_55%,#2f473c_100%)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <img src={getWebsiteLogo(websiteContent)} alt={websiteContent.siteName} className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-semibold uppercase tracking-[0.26em] text-white">{websiteContent.siteName}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">Everyday products, polished shopping, and trusted delivery.</h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#b9c2b8]">
                {websiteContent.footerDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Instagram"><FiInstagram /></a>
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Facebook"><FiFacebook /></a>
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Twitter"><FiTwitter /></a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Customer Service</h3>
              <ul className="space-y-3 text-sm text-[#b9c2b8]">
                <li><Link href="/contact" className="transition hover:text-white">Contact Us</Link></li>
                <li><Link href="/faq" className="transition hover:text-white">FAQs</Link></li>
                <li><Link href="/shipping" className="transition hover:text-white">Shipping Policy</Link></li>
                <li><Link href="/order/track" className="transition hover:text-white">Track Order</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Quick Links</h3>
              <ul className="space-y-3 text-sm text-[#b9c2b8]">
                <li><Link href="/product" className="transition hover:text-white">Shop All</Link></li>
                <li><Link href="/product/featured" className="transition hover:text-white">Special Offers</Link></li>
                <li><Link href="/refund-policy" className="transition hover:text-white">Refund Policy</Link></li>
                <li><Link href="/terms" className="transition hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
              <div className="space-y-4 text-sm text-[#b9c2b8]">
                <div className="flex items-start gap-3"><FiMail className="mt-1 text-white/70" /><span>{websiteContent.infoEmail}</span></div>
                <div className="flex items-start gap-3"><FiPhone className="mt-1 text-white/70" /><span>{websiteContent.phoneNumber}</span></div>
                <div className="flex items-start gap-3"><FiMapPin className="mt-1 text-white/70" /><span>{websiteContent.officeAddress}</span></div>
              </div>
            </div>
          </div>

          {/*<div className="mt-8 rounded-[24px] bg-white/5 p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white">Payment and Delivery</h4>
            <div className="flex flex-wrap gap-4">
              <img src={AppImages.visa} alt="Visa" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.master} alt="Mastercard" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.verve} alt="Verve" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.interswitch} alt="Interswitch" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.abc} alt="ABC" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.gig} alt="GIG" className="h-8 rounded bg-white px-2 py-1" />
              <img src={AppImages.dhl} alt="DHL" className="h-8 rounded bg-white px-2 py-1" />
            </div>
          </div>*/}
        </div>

        <div className="mt-8 text-center text-sm text-[#8f9a8f]">
          <p>&copy; {new Date().getFullYear()} {websiteContent.siteName} Online Store. All rights reserved.</p>
          <div className="mt-3 flex justify-center space-x-4">
            <Link href="/policy" className="transition hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>

      <a href={websiteContent.whatsAppNumber ? `https://wa.me/${websiteContent.whatsAppNumber}` : "https://wa.me/2347052457688"} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 group" aria-label="Chat on WhatsApp">
        <div className="hidden items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#1da851] lg:flex">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" /></svg>
          <span className="font-medium">Chat with us</span>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[#1da851] lg:hidden">
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" /></svg>
        </div>
      </a>
    </footer>
  );
}
