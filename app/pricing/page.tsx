import { Metadata } from "next";

import { PricingClient } from "./pricing-client";

import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Simple, Transparent Pricing | Dysumcorp",
  description:
    "One straightforward plan for professionals who just need it to work. Free portal available — no credit card required.",
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
      name: "Do my clients need to create an account to upload files?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Your clients just click the link and upload. No account, no app, no login required on their end.",
      },
    },
    {
      "@type": "Question",
      name: "What's included in the free portal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your free portal lets you collect up to 10 files. It's a real portal — not a demo. When you're ready for more, Pro gives you unlimited portals and unlimited files.",
      },
    },
    {
      "@type": "Question",
      name: "Which cloud storage is supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Drive and Dropbox. Files go directly into your chosen storage — automatically organized when they arrive.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a file size limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No enforced limit per file. Upload what you need.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to files in transit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Files go directly from your client to your cloud storage. Dysumcorp does not store your documents.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel Pro anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No long-term commitment.",
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
