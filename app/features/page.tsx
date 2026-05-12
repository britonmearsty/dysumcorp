import { Metadata } from "next";

import { FeaturesClient } from "./features-client";

export const metadata: Metadata = {
  title: "Features | Dysumcorp — Everything You Need to Collect Files",
  description:
    "Direct cloud sync, professional branding, smart checklists, and more. Dysumcorp gets client files into your cloud storage without the back-and-forth.",
  alternates: {
    canonical: "https://dysumcorp.pro/features",
  },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
