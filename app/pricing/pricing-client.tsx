"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { PRICING_PLANS, FREE_PLAN } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing-navbar";
import { PricingCard } from "@/components/pricing-card";
import { PricingCardFree } from "@/components/pricing-card-free";
import { FadeIn } from "@/components/animations";

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
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const handleSubscribe = (planId: string, isAnnual: boolean) => {
    if (!session?.user) {
      router.push("/auth?redirect=/dashboard/billing?tab=plans");
      return;
    }
    router.push("/dashboard/billing?tab=plans");
  };

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

          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto mb-16 px-4">
            {/* Free Plan */}
            <PricingCardFree
              plan={FREE_PLAN}
              variant="landing"
              ctaLabel="Create free portal"
              onSubscribe={() => router.push("/auth")}
            />

            {/* Pro Plan */}
            <PricingCard
              billingCycle={billingCycle}
              ctaLabel="Upgrade to Pro"
              currentPlan={currentPlan}
              plan={PRICING_PLANS.pro}
              variant="landing"
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
