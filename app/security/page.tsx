import { Metadata } from "next";

import { SecurityClient } from "./security-client";

export const metadata: Metadata = {
  title: "Security | Dysumcorp — Your Files Don't Stay on Our Servers",
  description:
    "Files are temporarily held on Cloudflare's infrastructure during transfer, then automatically deleted within 24 hours. They are never stored permanently — only in your Google Drive or Dropbox. AES-256 encryption in transit and at rest.",
  alternates: {
    canonical: "https://dysumcorp.pro/security",
  },
};

export default function SecurityPage() {
  return <SecurityClient />;
}
