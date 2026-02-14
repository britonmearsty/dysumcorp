import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Dysumcorp File Collection for Professionals",
  description:
    "Simple, transparent pricing for Dysumcorp. Start free with our Starter plan, or upgrade to Professional for advanced features. No credit card required to start.",
  keywords: [
    "file collection pricing",
    "client portal pricing",
    "document collection software cost",
    "file upload tool pricing",
  ],
  openGraph: {
    title: "Pricing - Dysumcorp File Collection for Professionals",
    description:
      "Simple, transparent pricing. Start free and upgrade as you grow.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
