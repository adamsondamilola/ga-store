"use client";

import Link from "next/link";
import {
  FiClock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhoneCall,
  FiArrowRight,
} from "react-icons/fi";
import { useWebsiteContent } from "@/components/providers/WebsiteContentProvider";

const quickHelp = [
  {
    title: "Track an order",
    description: "Check your delivery status and recent shipping updates.",
    href: "/order/track",
    label: "Track order",
  },
  {
    title: "Read FAQs",
    description: "Find quick answers to common product, shipping, and policy questions.",
    href: "/faq",
    label: "Browse FAQs",
  },
  {
    title: "Review shipping policy",
    description: "Understand delivery windows, options, and support expectations.",
    href: "/shipping",
    label: "View shipping",
  },
];

export default function Contact() {
  const { websiteContent } = useWebsiteContent();
  const contactCards = [
    {
      title: "Email Support",
      value: websiteContent.infoEmail,
      description: "Best for order questions, product details, and general enquiries.",
      href: `mailto:${websiteContent.infoEmail}`,
      cta: "Send an email",
      icon: FiMail,
    },
    {
      title: "WhatsApp",
      value: websiteContent.phoneNumber,
      description: "Fastest route for urgent complaints and quick support follow-ups.",
      href: `https://wa.me/${websiteContent.whatsAppNumber}`,
      cta: "Start chat",
      icon: FiMessageCircle,
    },
    {
      title: "Call Us",
      value: websiteContent.phoneNumber,
      description: "Speak with our team during business hours for direct assistance.",
      href: `tel:${websiteContent.phoneNumber}`,
      cta: "Call now",
      icon: FiPhoneCall,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f1] text-slate-900">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              Contact Us
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              We’re here if you need help with an order, delivery, or product question.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Choose the channel that suits you best and we’ll point you in the right direction as quickly as possible.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {contactCards.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target={item.href.startsWith("https://") ? "_blank" : undefined}
                  rel={item.href.startsWith("https://") ? "noopener noreferrer" : undefined}
                  className="rounded-2xl border border-stone-200 bg-[#fcfbf8] p-6 transition hover:border-orange-200 hover:bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Icon className="text-xl" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 break-words text-base font-medium text-slate-800">{item.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                    {item.cta}
                    <FiArrowRight />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-7 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">Before you reach out</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <p>Include your order number if your message is about a purchase or delivery. That helps us answer faster.</p>
              <p>Use WhatsApp for urgent complaints or follow-ups that need a quick response from the support team.</p>
              <p>Email is best for product questions, account support, and anything that needs a more detailed reply.</p>
            </div>

            <div className="mt-8 rounded-2xl bg-[#f8f6f1] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <FiClock className="text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Business Hours</h3>
                  <p className="mt-2 text-base font-medium text-slate-900">{websiteContent.businessHours}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Most enquiries are answered within one business day.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-7 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">Visit or write to us</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-stone-200 bg-[#fcfbf8] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <FiMapPin className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Office Address</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{websiteContent.officeAddress}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fcfbf8] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Help</h3>
                <div className="mt-4 space-y-3">
                  {quickHelp.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center justify-between rounded-xl border border-transparent px-1 py-2 text-sm text-slate-700 transition hover:border-stone-200 hover:bg-white"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-slate-600">{item.description}</p>
                      </div>
                      <FiArrowRight className="ml-4 flex-shrink-0 text-orange-500" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
