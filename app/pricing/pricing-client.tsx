"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter } from "next/navigation";

import { PRICING_PLANS, FREE_PLAN } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { LandingNavbar } from "@/components/landing-navbar";
import { PricingCard } from "@/components/pricing-card";
import { PricingCardFree } from "@/components/pricing-card-free";
import { FadeIn } from "@/components/animations";
import { EarlyAccessAvailability } from "@/lib/early-access";

const faqItems = [
  {
    q: "Do my clients need to create an account to upload files?",
    a: "No. Your clients just click the link and upload. No account, no app, no login required on their end.",
  },
  {
    q: "What's included in the free portal?",
    a: "Your free portal lets you collect up to 10 files. It's a real portal — not a demo. When you're ready for more, Pro gives you unlimited portals and unlimited files.",
  },
  {
    q: "Which cloud storage is supported?",
    a: "Google Drive and Dropbox. Files go directly into your chosen storage — automatically organized when they arrive.",
  },
  {
    q: "Is there a file size limit?",
    a: "No enforced limit per file. Upload what you need.",
  },
  {
    q: "What happens to files in transit?",
    a: "Files go directly from your client to your cloud storage. Dysumcorp does not store your documents.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Yes. No long-term commitment.",
  },
];

export function PricingClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const currentPlan: string = user?.subscriptionPlan || "free";
  const currentStatus: string = user?.subscriptionStatus || "active";
  const hasEarlyAccess: boolean = user?.earlyAccess === true;
  const earlyAccessExpiresAt: Date | null = user?.earlyAccessExpiresAt
    ? new Date(user.earlyAccessExpiresAt)
    : null;
  const isLoggedIn = !!session?.user;
  const isPro = currentPlan === "pro";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [earlyAccessAvailability, setEarlyAccessAvailability] = useState<EarlyAccessAvailability | null>(null);

  useEffect(() => {
    fetch("/api/early-access/availability")
      .then((r) => r.json())
      .then((data) => setEarlyAccessAvailability(data))
      .catch(() => {});
  }, []);

  const handleSubscribe = (planId: string, isAnnual: boolean) => {
    if (!isLoggedIn) {
      router.push("/auth?redirect=/dashboard/billing?tab=plans");
      return;
    }
    router.push("/dashboard/billing?tab=plans");
  };

  const handleClaimSuccess = () => {
    // Refresh availability after a successful claim
    fetch("/api/early-access/availability")
      .then((r) => r.json())
      .then((data) => setEarlyAccessAvailability(data))
      .catch(() => {});
  };

  const isLaunchOfferActive =
    earlyAccessAvailability !== null &&
    earlyAccessAvailability.remaining > 0 &&
    !hasEarlyAccess &&
    !isPro;

  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <FadeIn delay={0.1}>
              <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                Pricing Plans
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold serif-font text-[#1c1917] mb-6 max-w-4xl mx-auto">
                One straightforward plan for professionals who just need it to
                work.
              </h1>
              <p className="text-lg md:text-xl text-stone-700 max-w-2xl mx-auto font-medium">
                Start free. Upgrade when you need more. No card required to
                start. Cancel Pro anytime.
              </p>
            </FadeIn>
          </div>

          {/* Launch offer banner — only shown while spots remain */}
          {isLaunchOfferActive && (
            <FadeIn delay={0.05}>
              <div className="max-w-3xl mx-auto mb-10 px-4">
                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border border-indigo-200 px-6 py-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1">
                    Founding Users Launch Offer
                  </p>
                  <p className="text-base font-bold text-indigo-900">
                    🚀 Get 2 months of Pro FREE — no credit card required.
                  </p>
                  <p className="text-sm text-indigo-700 mt-1 font-medium">
                    Limited to the first 20 users. We&apos;re asking for your feedback
                    while we build Dysumcorp.
                  </p>
                </div>
              </div>
            </FadeIn>
          )}

          <div className="flex justify-center mb-8">
            <Tabs
              classNames={{
                tabList: "bg-white border border-stone-200 rounded-full p-1",
                cursor: "bg-[#1c1917]",
                tab: "text-stone-600 data-[selected=true]:text-stone-50",
                tabContent: "group-data-[selected=true]:text-stone-50 font-bold",
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

          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto mb-16 px-4 items-start">
            {/* Free Plan */}
            <PricingCardFree
              plan={FREE_PLAN}
              variant="landing"
              ctaLabel="Get started free"
              onSubscribe={() => router.push("/auth")}
            />

            {/* Pro Plan */}
            <PricingCard
              billingCycle={billingCycle}
              ctaLabel="Upgrade to Pro"
              currentPlan={currentPlan}
              earlyAccessAvailability={earlyAccessAvailability}
              hasEarlyAccess={hasEarlyAccess}
              earlyAccessExpiresAt={earlyAccessExpiresAt}
              plan={PRICING_PLANS.pro}
              variant="landing"
              requiresAuth={!isLoggedIn}
              onClaimSuccess={handleClaimSuccess}
              onSubscribe={handleSubscribe}
            />
          </div>

          <FadeIn delay={0.2}>
            <p className="text-center text-sm text-stone-500 font-medium mb-16">
              Start free. Upgrade when you need more.
              <br className="sm:hidden" /> No card required to start. Cancel Pro
              anytime.
            </p>
          </FadeIn>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20 pt-20 border-t border-stone-200">
            <h2 className="text-3xl font-bold serif-font text-center mb-12 text-[#1c1917]">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {faqItems.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                    {faq.q}
                  </h3>
                  <p className="text-stone-600 leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
