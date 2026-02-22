import { Metadata } from "next";

import { SecurityClient } from "./security-client";

export const metadata: Metadata = {
  title: "Security | Dysumcorp — Bank-Grade Protection for Your Documents",
  description:
    "Dysumcorp uses 256-bit AES encryption, zero-knowledge architecture, SOC 2 Type II, GDPR, and HIPAA compliance to keep your files and client data safe.",
  alternates: {
    canonical: "https://dysumcorp.pro/security",
  },
};

export default function SecurityPage() {
  return <SecurityClient />;
}
