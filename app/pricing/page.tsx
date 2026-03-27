import { Metadata } from "next";

import { PricingClient } from "./pricing-client";

import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Simple, Transparent Pricing | Dysumcorp",
  description:
    "Choose the perfect plan for collecting files from clients. Unlimited portals, secure storage, and branded portals. Start for free.",
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
      name: "Can I upgrade or downgrade later?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! You can upgrade from Free to Pro or cancel your Pro subscription at any time. Changes take effect immediately, and we'll prorate any charges.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I exceed my limits on the Free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You'll be notified when you reach your portal or storage limit. To continue creating portals or uploading files, you'll need to upgrade to Pro or remove some content.",
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
        text: "Our Free plan is available forever with no credit card required. You can try the platform and upgrade to Pro anytime to unlock unlimited portals, unlimited storage, and all premium features.",
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
