"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { FadeIn, Stagger, StaggerItem } from "./animations";
import { PricingCard } from "./pricing-card";
import { PricingCardFree } from "./pricing-card-free";
import { PRICING_PLANS, FREE_PLAN } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import type { EarlyAccessAvailability } from "@/lib/early-access";

interface PricingSectionProps {
  /** Pre-fetched at server render time — no client fetch needed on load */
  initialAvailability?: EarlyAccessAvailability | null;
}

export default function PricingSection({ initialAvailability = null }: PricingSectionProps) {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  // Start with server-provided value — no loading flash
  const [earlyAccessAvailability, setEarlyAccessAvailability] =
    useState<EarlyAccessAvailability | null>(initialAvailability);

  // Derive user state from session
  const user = session?.user as any;
  const currentPlan: string = user?.subscriptionPlan || "free";
  const currentStatus: string = user?.subscriptionStatus || "active";
  const hasEarlyAccess: boolean = user?.earlyAccess === true;
  const earlyAccessExpiresAt: Date | null = user?.earlyAccessExpiresAt
    ? new Date(user.earlyAccessExpiresAt)
    : null;
  const isLoggedIn = !!session?.user;
  const isPro = currentPlan === "pro";

  // Only re-fetch after a successful claim to update the counter.
  // No useEffect on mount — initialAvailability covers that case.
  const refreshAvailability = () => {
    fetch("/api/early-access/availability")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setEarlyAccessAvailability(data))
      .catch(() => {});
  };

  // Banner logic:
  // - Pro users: no banner
  // - EA users: no banner (they already claimed)
  // - Free users + spots available: show launch offer banner
  // - Free users + no spots: no banner
  // - Visitors (not logged in) + spots available: show launch offer banner
  const spotsRemain = (earlyAccessAvailability?.remaining ?? 0) > 0;
  const showLaunchBanner = spotsRemain && !isPro && !hasEarlyAccess;

  const handleSubscribe = (planId: string, isAnnual: boolean) => {
    if (!isLoggedIn) {
      window.location.href = "/auth?redirect=/dashboard/billing?tab=plans";
    } else {
      window.location.href = "/dashboard/billing?tab=plans";
    }
  };

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

        {/* Launch offer banner — only for visitors and eligible free users */}
        {showLaunchBanner && (
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
              ctaLabel={
                !isLoggedIn
                  ? "Get started free"
                  : isPro || hasEarlyAccess
                    ? "Go to dashboard"
                    : "Your current plan"
              }
              onSubscribe={() => (window.location.href = isLoggedIn ? "/dashboard" : "/auth")}
            />
          </StaggerItem>

          {/* Pro Plan */}
          <StaggerItem>
            <PricingCard
              plan={PRICING_PLANS.pro}
              billingCycle={billingCycle}
              variant="landing"
              currentPlan={currentPlan}
              currentStatus={currentStatus}
              earlyAccessAvailability={earlyAccessAvailability}
              hasEarlyAccess={hasEarlyAccess}
              earlyAccessExpiresAt={earlyAccessExpiresAt}
              requiresAuth={!isLoggedIn}
              ctaLabel={isLoggedIn ? "Upgrade to Pro" : "Get Pro"}
              onSubscribe={handleSubscribe}
              onClaimSuccess={refreshAvailability}
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
