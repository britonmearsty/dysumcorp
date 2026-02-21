import { Metadata } from "next";
import { MarketingAgenciesClient } from "./marketing-agencies-client";

export const metadata: Metadata = {
  title: "Collect Client Creative Assets | For Marketing Agencies",
  description:
    "Marketing and creative agencies use Dysumcorp to collect logos, images, videos, and campaign materials from clients. Streamline your creative workflow.",
  alternates: {
    canonical: "https://dysumcorp.pro/use-cases/marketing-agencies",
  },
};

export default function MarketingAgenciesPage() {
  return <MarketingAgenciesClient />;
}
