import { Metadata } from "next";

import { WealthAdvisorsClient } from "./wealth-advisors-client";

export const metadata: Metadata = {
  title: "Collect Financial Documents Securely from Clients | For Wealth Advisors",
  description:
    "Financial advisors use Dysumcorp to collect portfolio statements, identification, and compliance documents. No client account needed. Bank-level encryption.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/wealth-advisors",
  },
};

export default function WealthAdvisorsPage() {
  return <WealthAdvisorsClient />;
}
