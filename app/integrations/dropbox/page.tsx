import { Metadata } from "next";
import { DropboxClient } from "./dropbox-client";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Collect Client Files Straight to Dropbox | Dysumcorp",
  description:
    "Receive files from clients directly in your Dropbox. No client account required. Simple, secure, and automatic delivery with Dysumcorp integration.",
  alternates: {
    canonical: "https://dysumcorp.pro/integrations/dropbox",
  },
};

const faqs = [
  {
    question: "Does my client need a Dropbox account?",
    answer:
      "No. Your clients can upload files through your upload link without any account. They don't even need Dropbox installed.",
  },
  {
    question: "Can I select which Dropbox folder receives files?",
    answer:
      "Absolutely. You can configure any folder in your Dropbox to receive client uploads. Create separate folders for different clients or projects.",
  },
  {
    question: "What file types and sizes are supported?",
    answer:
      "Dysumcorp supports all file types. Professional plans allow files up to 10GB. The free plan supports files up to 100MB.",
  },
  {
    question: "Can I use both Google Drive and Dropbox?",
    answer:
      "Yes! On Professional plans, you can connect both Google Drive and Dropbox. Choose which storage destination for each upload link.",
  },
];

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function DropboxPage() {
  return (
    <>
      <JsonLd data={faqData} />
      <DropboxClient />
    </>
  );
}
