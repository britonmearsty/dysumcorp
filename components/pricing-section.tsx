"use client";

import { Check } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/config/pricing";

const pricingPlans = [
  {
    ...PRICING_PLANS.free,
    price: "0",
    period: "/month",
    cta: "Get Started",
    popular: false,
  },
  {
    ...PRICING_PLANS.pro,
    price: "29",
    period: "/month",
    cta: "Start Free Trial",
    popular: true,
  },
];

export default function PricingSection() {
  return (
    <section
      className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-[#fafaf9]"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
              Pricing Plans
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 serif-font text-[#1c1917]">
              Transparent investment
            </h2>
            <p className="text-stone-700 mt-4 sm:mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed px-2 sm:px-0">
              Scale your collection process with plans designed for individuals,
              growing teams, and large institutions.
            </p>
          </div>
        </FadeIn>

        <Stagger
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto"
          delay={0.15}
        >
          {pricingPlans.map((plan, index) => (
            <StaggerItem key={index}>
              <div
                className={`p-6 sm:p-8 lg:p-12 rounded-2xl lg:rounded-[2.5rem] flex flex-col border premium-shadow-hover relative h-full ${
                  plan.popular
                    ? "bg-white border-2 border-[#1c1917]"
                    : "bg-white border-stone-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1c1917] text-stone-50 text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold serif-font mb-2 text-[#1c1917]">
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-4 text-stone-600">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#1c1917]">
                      {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                    </span>
                    <span className="text-sm font-medium text-stone-600">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm font-medium text-stone-700"
                    >
                      <Check className="w-4 h-4 flex-shrink-0 text-[#1c1917]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                    plan.popular
                      ? "bg-[#1c1917] text-stone-50 hover:bg-stone-800"
                      : "bg-[#1c1917] border border-stone-200 text-stone-50 hover:bg-stone-800"
                  }`}
                  onClick={() => (window.location.href = "/auth")}
                >
                  {plan.cta}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
