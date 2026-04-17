import dynamic from "next/dynamic";

import { LandingNavbar } from "@/components/landing-navbar";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";

// Dynamically import non-critical sections to reduce initial JS load
const FeaturesSection = dynamic(() => import("@/components/features-section"));
const PricingSection = dynamic(() => import("@/components/pricing-section"));
const SecuritySection = dynamic(() => import("@/components/security-section"));
const IntegrationsSection = dynamic(
  () => import("@/components/integrations-section"),
);
const CTASection = dynamic(() => import("@/components/cta-section"));

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-stone-200 bg-[#fafaf9]">
      <LandingNavbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <SecuritySection />
      <IntegrationsSection />
      <CTASection />
    </main>
  );
}
