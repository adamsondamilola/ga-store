import AppImages from "@/constants/Images";
import AppStrings from "@/constants/Strings";

export const defaultWebsiteContent = {
  siteName: "Retina",
  siteDescription:
    "Shop different types of products at Retina, your online store for everyday essentials, lifestyle items, and more in Nigeria.",
  footerDescription:
    "Retina brings together different types of products in one reliable online store, making it easy to shop for everyday needs, lifestyle items, and more.",
  logoUrl: "",
  phoneNumber: AppStrings.phoneNumber,
  whatsAppNumber: AppStrings.whatsApp,
  infoEmail: AppStrings.infoEmail,
  supportEmail: AppStrings.supportEmail,
  officeAddress: AppStrings.officeAddress,
  businessHours: "Monday to Friday, 9:00 AM to 6:00 PM",
  faqItems: [
    {
      question: "What products can I buy on Retina?",
      answer:
        "Retina offers different types of products, including everyday essentials, lifestyle items, and other products available on our storefront.",
    },
    {
      question: "How can I place an order on Retina?",
      answer:
        "You can place an order directly on our website. Add products to your cart, proceed to checkout, and complete payment using the available payment options.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "You can reach us by email, phone, or WhatsApp using the contact details provided on the website.",
    },
    {
      question: "What is your shipping policy?",
      answer:
        "Shipping timelines and delivery options depend on your location and the products ordered. Please review our shipping policy page for full details.",
    },
    {
      question: "What is your refund policy?",
      answer:
        "Refund eligibility depends on the product and the condition of the item returned. Please review our refund policy page for full details.",
    },
  ],
  privacyPolicyContent:
    "## Introduction\nRetina respects your privacy and is committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our website.\n\n## Information We Collect\nWe may collect information such as your name, email address, phone number, delivery address, payment details, and order history when you shop with us or contact our support team.\n\n## How We Use Your Information\nWe use your information to process orders, provide customer support, improve our services, communicate important updates, and share relevant promotional offers where permitted.\n\n## Data Protection\nWe apply reasonable technical and organizational measures to protect your personal information against unauthorized access, misuse, or disclosure.\n\n## Your Rights\nYou may request access to, correction of, or deletion of your personal information by contacting our support team.",
  termsOfServiceContent:
    "## Acceptance of Terms\nBy accessing or using Retina, you agree to be bound by these terms and any additional policies referenced on the website.\n\n## Products and Pricing\nWe aim to keep product descriptions, prices, and availability accurate, but we may update them at any time without prior notice.\n\n## Orders and Fulfillment\nWhen you place an order, we will process and fulfill it subject to product availability, payment confirmation, and delivery coverage.\n\n## Payments\nPayments made on Retina must use valid and authorized payment methods. We may cancel or refuse any order where fraud or misuse is suspected.\n\n## Returns and Refunds\nReturns and refunds are subject to our refund policy. Please review that policy before placing an order.\n\n## Limitation of Liability\nRetina will not be liable for indirect, incidental, or consequential damages arising from the use of our website or services.\n\n## Governing Law\nThese terms are governed by the laws of Nigeria.",
  shippingPolicyContent:
    "## Delivery Coverage\nRetina delivers to supported locations using trusted logistics partners and may use different carriers depending on the destination and order type.\n\n## Delivery Timelines\nDelivery timelines depend on your location, the products ordered, order confirmation time, and operational conditions. Estimated delivery windows may change when necessary.\n\n## Order Tracking\nWhere tracking is available, customers will receive updates after an order has been processed or dispatched.\n\n## Delivery Issues\nIf your order is delayed, missing, or arrives damaged, please contact our support team as soon as possible so we can assist.",
  refundPolicyContent:
    "## Refund Eligibility\nRefunds and returns are considered based on the condition of the item, the type of product, and the reason for the request.\n\n## Return Requests\nTo request a return or refund, contact our support team with your order details and the reason for the request.\n\n## Review Process\nOnce your request is received and the item is inspected where necessary, we will confirm whether the refund or replacement has been approved.\n\n## Support\nIf you need help with a refund or return, please contact our support team using the phone, WhatsApp, or email details listed on the website.",
};

export const getWebsiteLogo = (content) =>
  content?.logoUrl?.trim() || AppImages.logo;

export const normalizeWebsiteContent = (content) => {
  const merged = {
    ...defaultWebsiteContent,
    ...(content || {}),
  };

  return {
    ...merged,
    faqItems:
      Array.isArray(content?.faqItems) && content.faqItems.length > 0
        ? content.faqItems
        : defaultWebsiteContent.faqItems,
  };
};
