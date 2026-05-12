"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { FadeIn, Stagger, StaggerItem } from "./animations";

import { PricingCard } from "./pricing-card";
import { PricingCardFree } from "./pricing-card-free";
import { PRICING_PLANS, FREE_PLAN } from "@/config/pricing";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const handleSubscribe = (planId: string, isAnnual: boolean) => {
    window.location.href = "/auth";
  };

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

        <FadeIn delay={0.1}>
          <div className="flex justify-center mb-8">
            <Tabs
              classNames={{
                tabList: "bg-white border border-stone-200 rounded-full p-1",
                cursor: "bg-[#1c1917]",
                tab: "text-stone-600 data-[selected=true]:text-stone-50",
                tabContent:
                  "group-data-[selected=true]:text-stone-50 font-bold",
              }}
              selectedKey={billingCycle}
              size="lg"
              onSelectionChange={(key) =>
                setBillingCycle(key as "monthly" | "annual")
              }
            >
              <Tab key="monthly" title="Monthly" />
              <Tab
                key="annual"
                title={
                  <div className="flex items-center gap-2">
                    Annual
                    <span className="bg-stone-100 text-[#1c1917] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Save 20%
                    </span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </FadeIn>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto"
          delay={0.15}
        >
          {/* Free Plan */}
          <StaggerItem>
            <PricingCardFree
              plan={FREE_PLAN}
              variant="landing"
              ctaLabel="Create free portal"
              onSubscribe={() => window.location.href = "/auth"}
            />
          </StaggerItem>

          {/* Pro Plan */}
          <StaggerItem>
            <PricingCard
              plan={PRICING_PLANS.pro}
              billingCycle={billingCycle}
              ctaLabel="Upgrade to Pro"
              variant="landing"
              onSubscribe={handleSubscribe}
            />
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
