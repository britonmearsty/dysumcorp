import { Metadata } from "next";

import { SecurityClient } from "./security-client";

export const metadata: Metadata = {
  title: "Security | Dysumcorp — Your Files Never Live on Our Servers",
  description:
    "Your files go directly from your client to your Drive or Dropbox. Dysumcorp never stores your documents. AES-256 encryption in transit and at rest.",
  alternates: {
    canonical: "https://dysumcorp.pro/security",
  },
};

export default function SecurityPage() {
  return <SecurityClient />;
}
