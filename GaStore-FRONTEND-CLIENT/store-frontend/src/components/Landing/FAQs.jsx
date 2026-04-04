"use client";

import PageHeader from "@/components/layout/PageHeader";
import { useWebsiteContent } from "@/components/providers/WebsiteContentProvider";
import React, { useState } from "react";

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);
  const { websiteContent } = useWebsiteContent();
  const faqs = websiteContent.faqItems || [];

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
                  {openIndex === index ? "-" : "+"}
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
          If you have any other questions or concerns, please do not hesitate to
          reach out to our customer service team.
        </p>
      </div>
    </div>
  );
}
