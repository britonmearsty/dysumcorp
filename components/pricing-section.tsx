"use client";

import { Check, X } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";

import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/config/pricing";

const freePlan = {
  name: "Free",
  description: "Try it out — no risk, no card required",
  price: "0",
  period: "/month",
  cta: "Create free portal",
  features: [
    "1 portal",
    "Up to 10 file uploads",
    "Google Drive & Dropbox",
    "No client account required",
  ],
  limitations: [
    "No custom branding",
    "No multiple portals",
  ],
};

const proPlan = {
  ...PRICING_PLANS.pro,
  name: "Pro",
  description: "For professionals who need unlimited collection",
  price: "10",
  period: "/month",
  cta: "Upgrade to Pro — $10/month",
  popular: true,
};

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
              Simple pricing. One plan. No surprises.
            </h2>
            <p className="text-stone-700 mt-4 sm:mt-6 max-w-xl mx-auto text-base sm:text-lg leading-relaxed px-2 sm:px-0">
              Start free. Upgrade when you need more. No card required to
              start. Cancel Pro anytime.
            </p>
          </div>
        </FadeIn>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto"
          delay={0.15}
        >
          {/* Free Plan */}
          <StaggerItem>
            <div className="p-6 sm:p-8 lg:p-12 rounded-2xl lg:rounded-[2.5rem] flex flex-col border border-stone-200 premium-shadow-hover relative h-full bg-white">
              <div className="mb-8">
                <h3 className="text-2xl font-bold serif-font mb-2 text-[#1c1917]">
                  {freePlan.name}
                </h3>
                <p className="text-sm mb-4 text-stone-600">
                  {freePlan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#1c1917]">
                    ${freePlan.price}
                  </span>
                  <span className="text-sm font-medium text-stone-600">
                    {freePlan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-4 mb-4 flex-grow">
                {freePlan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-medium text-stone-700"
                  >
                    <Check className="w-4 h-4 flex-shrink-0 text-stone-500" />
                    {feature}
                  </li>
                ))}
                {freePlan.limitations.map((limitation, i) => (
                  <li
                    key={`lim-${i}`}
                    className="flex items-center gap-3 text-sm font-medium text-stone-400"
                  >
                    <X className="w-4 h-4 flex-shrink-0 text-stone-300" />
                    {limitation}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full py-4 rounded-xl font-bold text-sm bg-stone-100 text-[#1c1917] hover:bg-stone-200 transition-all"
                onClick={() => (window.location.href = "/auth")}
              >
                {freePlan.cta}
              </Button>
            </div>
          </StaggerItem>

          {/* Pro Plan */}
          <StaggerItem>
            <div className="p-6 sm:p-8 lg:p-12 rounded-2xl lg:rounded-[2.5rem] flex flex-col border-2 border-[#1c1917] premium-shadow-hover relative h-full bg-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1c1917] text-stone-50 text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full">
                Most Popular
              </div>
              <div className="mb-8 mt-4">
                <h3 className="text-2xl font-bold serif-font mb-2 text-[#1c1917]">
                  {proPlan.name}
                </h3>
                <p className="text-sm mb-4 text-stone-600">
                  {proPlan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#1c1917]">
                    ${proPlan.price}
                  </span>
                  <span className="text-sm font-medium text-stone-600">
                    {proPlan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                <li className="flex items-center gap-3 text-sm font-medium text-stone-700">
                  <Check className="w-4 h-4 flex-shrink-0 text-[#1c1917]" />
                  Unlimited portals. Unlimited files.
                </li>
                {proPlan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-medium text-stone-700"
                  >
                    <Check className="w-4 h-4 flex-shrink-0 text-[#1c1917]" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center gap-3 text-sm font-medium text-stone-700">
                  <Check className="w-4 h-4 flex-shrink-0 text-[#1c1917]" />
                  No client account required
                </li>
              </ul>
              <Button
                className="w-full py-4 rounded-xl font-bold text-sm bg-[#1c1917] text-stone-50 hover:bg-stone-800 transition-all"
                onClick={() => (window.location.href = "/auth")}
              >
                {proPlan.cta}
              </Button>
            </div>
          </StaggerItem>
        </Stagger>

        <FadeIn delay={0.3}>
          <p className="text-center text-sm text-stone-500 font-medium mt-8">
            Start free. Upgrade when you need more.
            <br className="sm:hidden" /> No card required to start. Cancel Pro
            anytime.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
