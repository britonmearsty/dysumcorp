"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Rocket } from "lucide-react";

import { FadeIn, Stagger, StaggerItem } from "./animations";
import { PricingCard } from "./pricing-card";
import { PricingCardFree } from "./pricing-card-free";
import { PRICING_PLANS, FREE_PLAN } from "@/config/pricing";
import type { EarlyAccessAvailability } from "@/lib/early-access";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [earlyAccessAvailability, setEarlyAccessAvailability] =
    useState<EarlyAccessAvailability | null>(null);

  useEffect(() => {
    fetch("/api/early-access/availability")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setEarlyAccessAvailability(data))
      .catch(() => {});
  }, []);

  const handleSubscribe = (_planId: string, _isAnnual: boolean) => {
    window.location.href = "/auth";
  };

  const isLaunchOfferActive =
    earlyAccessAvailability !== null && earlyAccessAvailability.remaining > 0;

  return (
    <section
      className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-[#fafaf9]"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
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

        {/* Launch offer banner — visible to all visitors while spots remain */}
        {isLaunchOfferActive && (
          <FadeIn delay={0.05}>
            <div className="max-w-3xl mx-auto mb-10">
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border border-indigo-200 px-6 py-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1">
                  Founding Users Launch Offer
                </p>
                <p className="text-base font-bold text-indigo-900">
                  🚀 Get 2 months of Pro FREE — no credit card required.
                </p>
                <p className="text-sm text-indigo-700 mt-1 font-medium">
                  Limited to the first 20 users. We&apos;re asking for your
                  feedback while we build Dysumcorp.
                </p>
              </div>
            </div>
          </FadeIn>
        )}

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
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto items-start"
          delay={0.15}
        >
          {/* Free Plan */}
          <StaggerItem>
            <PricingCardFree
              plan={FREE_PLAN}
              variant="landing"
              ctaLabel="Get started free"
              onSubscribe={() => (window.location.href = "/auth")}
            />
          </StaggerItem>

          {/* Pro Plan — shows launch offer callout + EA button when slots remain */}
          <StaggerItem>
            <PricingCard
              plan={PRICING_PLANS.pro}
              billingCycle={billingCycle}
              ctaLabel="Get Pro"
              variant="landing"
              earlyAccessAvailability={earlyAccessAvailability}
              requiresAuth
              onSubscribe={handleSubscribe}
              // Visitors aren't logged in; clicking EA button redirects to /auth
              onClaimSuccess={() => {
                window.location.href = "/auth";
              }}
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
