import { Metadata } from "next";

import { PricingClient } from "./pricing-client";

import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Simple, Transparent Pricing | Dysumcorp",
  description:
    "Pro plan for collecting files from clients. Up to 100 portals, custom branding, and priority support. 14-day money-back guarantee.",
  alternates: {
    canonical: "https://dysumcorp.pro/pricing",
  },
};

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      question: "How do I subscribe to Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Click the \"Upgrade to Pro\" button in your dashboard, choose your billing cycle (monthly or annual), and complete the secure checkout. Your Pro features are activated immediately.",
      },
    },
    {
      "@type": "Question",
      question: "What happens when I sign up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can create an account and explore the dashboard, but portal creation and file collection require an active Pro subscription.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer refunds?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we offer a 14-day money-back guarantee on the Pro plan. No questions asked.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial for Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer a 14-day money-back guarantee on the Pro plan. Create an account to explore, and subscribe when you're ready to start collecting files.",
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqData} />
      <PricingClient />
    </>
  );
}
