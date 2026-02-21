import { Metadata } from "next";
import { GoogleDriveClient } from "./google-drive-client";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Collect Client Files Directly to Google Drive | Dysumcorp",
  description:
    "Let clients upload files straight to your Google Drive folder. No account required. Simple, secure, and automatic file collection with Dysumcorp.",
  alternates: {
    canonical: "https://dysumcorp.pro/integrations/google-drive",
  },
};

const faqs = [
  {
    question: "Does my client need a Google account?",
    answer:
      "No! Your clients can upload files through your unique upload link without creating any account or logging in. They don't need Google Drive either.",
  },
  {
    question: "Can I choose which folder files go to?",
    answer:
      "Yes, you can specify exactly which Google Drive folder you want files to be uploaded to. You can also create dynamic folder structures based on client information.",
  },
  {
    question: "What happens if I'm not signed into Google Drive?",
    answer:
      "No problem! Files are uploaded to your Google Drive automatically in the background. You can check them whenever you're ready.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Dysumcorp supports files up to 10GB on Professional plans. The free plan supports files up to 100MB.",
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

export default function GoogleDrivePage() {
  return (
    <>
      <JsonLd data={faqData} />
      <GoogleDriveClient />
    </>
  );
}
