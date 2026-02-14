"use client";

import HeroSection from "@/components/hero-section";
import FeaturesSection from "@/components/features-section";
import HowItWorks from "@/components/how-it-works";
import TestimonialsSection from "@/components/testimonials-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <TestimonialsSection />
    </main>
  );
}
