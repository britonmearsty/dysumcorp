import { Metadata } from "next";

import { FeaturesClient } from "./features-client";

export const metadata: Metadata = {
  title: "Features | Dysumcorp — Everything You Need to Collect Files",
  description:
    "Explore Dysumcorp's full feature set: cloud gravity sync, professional branding, smart checklists, password protection, expiring links, analytics, and more.",
  alternates: {
    canonical: "https://dysumcorp.pro/features",
  },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
