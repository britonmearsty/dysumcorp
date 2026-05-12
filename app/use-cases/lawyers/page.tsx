import { Metadata } from "next";

import { LawyersClient } from "./lawyers-client";

export const metadata: Metadata = {
  title: "Collect Legal Documents Securely from Clients | For Lawyers",
  description:
    "Attorneys and lawyers use Dysumcorp to collect case documents, contracts, and evidence. No client account needed. Direct to your cloud.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/lawyers",
  },
};

export default function LawyersPage() {
  return <LawyersClient />;
}
