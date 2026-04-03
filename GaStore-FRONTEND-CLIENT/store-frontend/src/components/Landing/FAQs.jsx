"use client"
import PageHeader from "@/components/layout/PageHeader";
import AppStrings from "@/constants/Strings";
import React, { useState } from "react";

const faqs = [
  {
    question: "What products does TOWG Natural and Wellness offer?",
    answer: `TOWG Natural and Wellness specializes in a wide range of organic health and wellness products, including:
    • 100% Organic Whey Protein Concentrate Powder
    • Performance Enhancers
    • Bodybuilding Supplements
    • Weight Gain and Weight Loss Products
    • Other high-quality organic health foods and supplements.`,
  },
  {
    question: "How can I place an order with TOWG Natural and Wellness?",
    answer:
      "You can place an order through our website, by phone, or by email. Our customer service team is available to assist you with the ordering process.",
  },
  {
    question: "What is TOWG Natural and Wellness's shipping policy?",
    answer:
      "We have partnered with God Is Good Delivery to provide reliable shipping services. Orders placed before noon are typically delivered the same day. You will also receive a divine tracking number to monitor your delivery status.",
  },
  {
    question: "What is TOWG Natural and Wellness's return and refund policy?",
    answer:
      "If you are not satisfied with your purchase, you may return the product within 3 days of delivery for a full refund. Contact customer service to initiate a return.",
  },
  {
    question: "How can I contact TOWG Natural and Wellness's customer service?",
    answer:
      `You can reach us by email at ${AppStrings.infoEmail} or by phone at ${AppStrings.phoneNumber}. Our team is ready to assist you.`,
  },
  {
    question: "Does TOWG Natural and Wellness offer any discounts or promotions?",
    answer:
      "Yes, we regularly offer various discounts and promotions. Check our website or sign up for our newsletter to stay informed.",
  },
  {
    question: "How does TOWG Natural and Wellness ensure the quality and safety of its products?",
    answer:
      "All our products are rigorously tested and certified to meet the strictest safety and quality standards.",
  },
  {
    question: "What payment methods does TOWG Natural and Wellness accept?",
    answer:
      "We accept Visa, Mastercard, American Express, Discover, and PayPal. All payments are processed securely through a PCI-compliant gateway.",
  },
  {
    question: "Does TOWG Natural and Wellness offer any subscription or auto-ship programs?",
    answer:
      "Yes, we offer a subscription program for popular products, allowing you to receive them regularly without reordering each time.",
  },
  {
    question: "How does TOWG Natural and Wellness handle customer privacy and data security?",
    answer:
      "We implement industry-standard security measures to safeguard your data. Please review our Privacy Policy for full details.",
  },
  {
    question: "What is TOWG Natural and Wellness's policy on product expiration and freshness?",
    answer:
      "All products are labeled with expiration dates, and only fresh products are shipped. If you receive an expired item, contact customer service for a replacement or refund.",
  },
  {
    question: "Does TOWG Natural and Wellness offer any product samples or trial sizes?",
    answer:
      "Yes, we provide sample sizes and trial packs for many products. You can find them on our website or contact customer service.",
  },
  {
    question: "How can I stay informed about TOWG Natural and Wellness's new products and promotions?",
    answer:
      "Sign up for our newsletter, follow us on social media, or check our website for the latest updates.",
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
      <PageHeader
                title="FAQs"
                subtitle="Frequently asked questions about our products and services."
              />
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg shadow-sm"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full text-left px-4 py-3 flex justify-between items-center focus:outline-none"
            >
              <span className="font-medium text-gray-700">
                {faq.question}
              </span>
              <span className="text-gray-500">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-600 whitespace-pre-line">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-gray-600">
        If you have any other questions or concerns, please don’t hesitate to
        reach out to our dedicated customer service team.
      </p>
    </div>
    </div>
  );
}
