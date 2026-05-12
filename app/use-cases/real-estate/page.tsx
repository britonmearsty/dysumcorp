import { Metadata } from "next";

import { RealEstateClient } from "./real-estate-client";

export const metadata: Metadata = {
  title: "Centralize Real Estate Transaction Documents | For Real Estate Professionals",
  description:
    "Real estate agents and brokers use Dysumcorp to collect appraisals, inspections, title documents, and signed disclosures in one organized portal. Clients upload directly to your cloud.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/real-estate",
  },
};

export default function RealEstatePage() {
  return <RealEstateClient />;
}
