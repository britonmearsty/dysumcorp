import dynamicImport from "next/dynamic";
import { unstable_cache } from "next/cache";

import { LandingNavbar } from "@/components/landing-navbar";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import { getTestimonials } from "@/lib/getTestimonials";
import { getEarlyAccessAvailability } from "@/lib/early-access";

export const dynamic = "force-dynamic";

// Dynamically import non-critical sections to reduce initial JS load
const FeaturesSection = dynamicImport(() => import("@/components/features-section"));
const PricingSection = dynamicImport(() => import("@/components/pricing-section"));
const SecuritySection = dynamicImport(() => import("@/components/security-section"));
const IntegrationsSection = dynamicImport(
  () => import("@/components/integrations-section"),
);
const TestimonialsSection = dynamicImport(
  () => import("@/components/testimonials-section"),
);
const CTASection = dynamicImport(() => import("@/components/cta-section"));

// Cache the DB COUNT for 60 seconds so it doesn't fire on every page request.
// When a slot is claimed the /api/early-access/claim route can revalidate this
// tag if needed, but 60 s staleness is fine for a launch counter.
const getCachedEAAvailability = unstable_cache(
  getEarlyAccessAvailability,
  ["ea-availability"],
  { revalidate: 60, tags: ["ea-availability"] },
);

export default async function Home() {
  const testimonials = getTestimonials(true);

  // Fetch EA availability at runtime — fall back gracefully if DB is unavailable
  // during static prerender (e.g. build time without DB access).
  let eaAvailability = null;
  try {
    eaAvailability = await getCachedEAAvailability();
  } catch {
    eaAvailability = null;
  }

  return (
    <main className="min-h-screen selection:bg-stone-200 bg-[#fafaf9]">
      <LandingNavbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection initialAvailability={eaAvailability} />
      <SecuritySection />
      <IntegrationsSection />
      <TestimonialsSection testimonials={testimonials} />
      <CTASection />
    </main>
  );
}
