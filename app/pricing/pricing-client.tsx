"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter } from "next/navigation";

import { PricingCard } from "@/components/pricing-card";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing-navbar";
import { useToast } from "@/lib/toast";

export function PricingClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";
  const { showToast } = useToast();

  const handleSubscribe = async (planId: string, isAnnual: boolean) => {
    if (!session?.user) {
      router.push("/auth?redirect=/pricing");

      return;
    }
    if (planId === "free") {
      router.push("/dashboard");

      return;
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: isAnnual ? "annual" : "monthly",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Failed to create checkout session", "error");
        router.push("/dashboard/billing");

        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      showToast("Failed to start checkout process", "error");
      router.push("/dashboard/billing");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] selection:bg-stone-200">
      <LandingNavbar />
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
              Pricing Plans
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold serif-font text-[#1c1917] mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-stone-700 max-w-2xl mx-auto font-medium">
              Choose the perfect plan for your needs. Upgrade, downgrade, or
              cancel anytime.
            </p>
          </div>

          <div className="flex justify-center mb-12">
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

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-16 px-4">
            {Object.values(PRICING_PLANS).map((plan) => (
              <PricingCard
                key={plan.id}
                billingCycle={billingCycle}
                currentPlan={currentPlan}
                plan={plan}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-20 pt-20 border-t border-stone-200">
            <h2 className="text-3xl font-bold serif-font text-center mb-12 text-[#1c1917]">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  Can I upgrade or downgrade later?
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Yes! You can upgrade from Free to Pro or cancel your Pro
                  subscription at any time. Changes take effect immediately, and
                  we&apos;ll prorate any charges.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  What happens if I exceed my limits?
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  You&apos;ll be notified when you reach your portal or storage
                  limit. To continue creating portals or uploading files,
                  you&apos;ll need to upgrade to Pro or remove some content.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  Do you offer refunds?
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Yes, we offer a 14-day money-back guarantee on the Pro plan.
                  No questions asked.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  Payment methods
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  We accept all major credit cards, debit cards, and support
                  various payment methods through our secure payment processor.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  Is there a free trial for Pro?
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Our Free plan is available forever with no credit card
                  required. You can try the platform and upgrade to Pro anytime
                  to unlock unlimited portals and all premium features.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-[#1c1917] serif-font">
                  Cancel anytime?
                </h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Absolutely! You can cancel your Pro subscription at any time.
                  You&apos;ll retain access to Pro features until the end of
                  your billing period.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-24 p-10 sm:p-16 glass-surface rounded-3xl premium-shadow text-center">
            <h2 className="text-3xl sm:text-4xl font-bold serif-font mb-6 text-[#1c1917]">
              Still have questions?
            </h2>
            <p className="text-lg text-stone-700 mb-10 max-w-xl mx-auto font-medium">
              Our team is here to help. Reach out for any questions or support
              regarding our plans.
            </p>
            <Button
              className="px-10 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold lg:text-lg hover:bg-stone-800 transition-all premium-shadow"
              onClick={() => router.push("/dashboard/support")}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
