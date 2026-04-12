"use client";

import AppImages from "@/constants/Images";
import endpointsPath from "@/constants/EndpointsPath";
import StoreProductCard from "@/components/products/ProductCard";
import requestHandler from "@/utils/requestHandler";
import { stringToSLug } from "@/utils/stringToSlug";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiChevronDown, FiMail, FiArrowRight } from "react-icons/fi";

const heroImage =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80";

function SectionHeading({ title, subtitle, actionLabel, actionHref }) {
  return (
    <div className="mb-6 flex flex-col gap-4 text-center md:mb-8 md:flex-row md:items-end md:justify-between md:text-left">
      <div className="flex-1">
        <h2 className="text-[1.85rem] font-extrabold tracking-tight text-[#1f2937] md:text-[2.15rem]">{title}</h2>
        <p className="mt-1 text-sm text-[#6b7280] md:text-base">{subtitle}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-[#d9e2ec] bg-[#f8fafc] px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:border-[#c4d3e3] hover:bg-white md:self-auto"
        >
          {actionLabel}
          <FiArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}

export default function PremiumLandingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [heroBanner, setHeroBanner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [limitedOffer, setLimitedOffer] = useState(null);
  const [clock, setClock] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const hasHeroBanner = Boolean(
    heroBanner && (heroBanner.imageUrl || heroBanner.title || (heroBanner.hasLink && heroBanner.link))
  );
  const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://res.cloudinary.com/")) {
      return url.replace("http://", "https://");
    }
    return url;
  };
  const isVideoBanner = (url) => /\.(mp4|webm|mov|avi|m4v)(\?.*)?$/i.test(getMediaUrl(url));

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const [sliderResponse, categoryResponse, featuredResponse, arrivalsResponse, limitedOfferResponse] = await Promise.all([
          requestHandler.get(`${endpointsPath.banner}?pageNumber=1&pageSize=1&type=Slider`),
          requestHandler.get(`${endpointsPath.category}/active?pageNumber=1&pageSize=30`),
          requestHandler.get(`${endpointsPath.featuredProduct}?pageNumber=1&pageSize=8`),
          requestHandler.get(`${endpointsPath.product}?pageNumber=1&pageSize=8`),
          requestHandler.get(`${endpointsPath.limitedOffer}/active-homepage`),
        ]);

        setHeroBanner(sliderResponse?.statusCode === 200 ? sliderResponse?.result?.data?.[0] || null : null);
        setCategories(categoryResponse?.statusCode === 200 ? categoryResponse?.result?.data || [] : []);
        setFeaturedProducts(featuredResponse?.statusCode === 200 ? featuredResponse?.result?.data || [] : []);
        setArrivals(arrivalsResponse?.statusCode === 200 ? arrivalsResponse?.result?.data || [] : []);
        setLimitedOffer(limitedOfferResponse?.statusCode === 200 ? limitedOfferResponse?.result?.data || null : null);
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
        setHeroBanner(null);
        setCategories([]);
        setFeaturedProducts([]);
        setArrivals([]);
        setLimitedOffer(null);
      }
    };

    fetchHomepageData();
  }, []);

  useEffect(() => {
    if (!limitedOffer?.endDate) {
      setClock({ hours: "00", minutes: "00", seconds: "00" });
      return undefined;
    }

    const timer = setInterval(() => {
      const distance = new Date(limitedOffer.endDate).getTime() - Date.now();
      if (distance <= 0) {
        setLimitedOffer(null);
        setClock({ hours: "00", minutes: "00", seconds: "00" });
        clearInterval(timer);
        return;
      }

      setClock({
        hours: String(Math.floor(distance / 3600000)).padStart(2, "0"),
        minutes: String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0"),
        seconds: String(Math.floor((distance % 60000) / 1000)).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [limitedOffer]);

  const subscribe = async (event) => {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestHandler.post(
        `${endpointsPath.subscriber}/subscribe`,
        { email, subscriptionSource: "homepage-newsletter" },
        false
      );

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.success(response?.result?.message || "You are subscribed");
        setEmail("");
      } else {
        toast.error(response?.result?.message || "Subscription failed");
      }
    } catch (error) {
      if (error?.response?.status === 400) toast("This email is already subscribed", { icon: "i" });
      else toast.error("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full space-y-8 px-3 pb-12 pt-2 md:px-6 md:space-y-10 xl:px-8">
      {hasHeroBanner ? (
        <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
          <div className="relative min-h-[310px] md:min-h-[430px]">
            {heroBanner?.imageUrl ? (
              isVideoBanner(heroBanner.imageUrl) ? (
                <video
                  key={heroBanner.imageUrl}
                  src={getMediaUrl(heroBanner.imageUrl)}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getMediaUrl(heroBanner.imageUrl)})`,
                  }}
                />
              )
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,113,196,0.92)_0%,rgba(31,113,196,0.70)_48%,rgba(31,113,196,0.35)_100%)]" />
            )}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[rgba(31,113,196,0.82)] via-[rgba(31,113,196,0.38)] to-[rgba(255,255,255,0.05)]" />
            <div className="relative z-20 flex min-h-[310px] max-w-[520px] flex-col justify-center px-6 py-8 text-white md:min-h-[430px] md:px-10">
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={heroBanner?.hasLink && heroBanner?.link ? heroBanner.link : "/product"}
                  className="inline-flex items-center justify-center rounded-xl bg-[#f15a24] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#d94d1d]"
                >
                  Shop Now
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/55 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Explore Categories
                  <FiChevronDown size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="categories" className="rounded-[24px] bg-white px-4 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:px-6 md:py-8">
        <SectionHeading title="Shop by Category" subtitle="Browse Our Top Categories" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/product/category/${stringToSLug(category.name)}`}
              className="group relative overflow-hidden rounded-[16px] shadow-[0_8px_20px_rgba(15,23,42,0.10)]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <img src={category.imageUrl || AppImages.default} alt={category.name} className="h-[135px] w-full object-cover transition duration-300 group-hover:scale-105 md:h-[320px]" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white md:p-4">
                <h3 className="text-sm font-bold md:text-lg">{category.name}</h3>
                <p className="mt-1 hidden text-xs text-white/85 md:block">
                  {category.subCategoriesCount > 0 ? `${category.subCategoriesCount} sub-categories` : "Browse products in this collection"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-white px-4 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:px-6 md:py-8">
        <SectionHeading
          title="Featured Products"
          subtitle="Popular Picks for You"
          actionLabel="See more"
          actionHref="/product/featured"
        />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {featuredProducts.map((item) => (
            <StoreProductCard key={item?.product?.id || item?.id} product={item} featured />
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-white px-4 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:px-6 md:py-8">
        <SectionHeading
          title="New Arrivals"
          subtitle="Fresh products added this week"
          actionLabel="See more"
          actionHref="/product"
        />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {arrivals.map((item) => (
            <StoreProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

     
      {limitedOffer ? (
        <section className="rounded-[24px] bg-white px-4 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:px-6 md:py-8">
          <SectionHeading title={limitedOffer.title || "Limited Time Offer"} subtitle={`Ends in ${clock.hours}:${clock.minutes}:${clock.seconds}`} />
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_0.92fr]">
            {limitedOffer.products?.slice(0, 3).map((product) => (
              <StoreProductCard key={product.id} product={product} />
            ))}
            <div
              className="flex flex-col justify-between rounded-[18px] p-5 text-white ring-1 ring-black/5"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(17,24,39,0.68) 0%, rgba(17,24,39,0.78) 100%), url(${limitedOffer.backgroundImageUrl || heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div>
                <span className="inline-flex rounded-md bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  {limitedOffer.badgeText || "Limited offer"}
                </span>
                <p className="mt-4 text-3xl font-black leading-tight">{limitedOffer.title}</p>
                <p className="mt-4 text-sm leading-7 text-white/85">
                  {limitedOffer.subtitle || "Shop the active promotion curated by the GaStore team before the timer runs out."}
                </p>
                <p className="mt-4 text-sm text-white/70">Offer ends {new Date(limitedOffer.endDate).toLocaleString()}</p>
              </div>
              <div className="mt-6 space-y-3">
                <Link
                  href={limitedOffer.ctaLink || "/product"}
                  className="flex items-center justify-center rounded-xl bg-[#f15a24] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d94d1d]"
                >
                  {limitedOffer.ctaText || "Shop Now"}
                </Link>
                <div className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/90 backdrop-blur-sm">
                  {limitedOffer.products?.length || 0} products in this offer
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

       <section className="rounded-[24px] bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:px-6 md:py-8">
        <SectionHeading title="Newsletter" subtitle="Get new arrivals, offers, and wellness updates" />
        <form onSubmit={subscribe} className="mx-auto max-w-3xl rounded-[20px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-[#dbe3ee] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#0f172a] outline-none transition focus:border-[#0f7ac6] focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#f15a24] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d94d1d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
        </form>
      </section>

    </main>
  );
}
