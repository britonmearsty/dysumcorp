"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter } from "next/navigation";

import { PricingCard } from "@/components/pricing-card";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";

  const handleSubscribe = async (planId: string, isAnnual: boolean) => {
    if (!session?.user) {
      // Redirect to auth if not logged in
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
        alert(data.error || "Failed to create checkout session");
        router.push("/dashboard/billing");

        return;
      }

      // Redirect to Creem checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start checkout process");
      router.push("/dashboard/billing");
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold font-mono mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-default-500 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Upgrade, downgrade, or
            cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs
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
                  <span className="bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
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

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold font-mono text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I change plans later?
              </h3>
              <p className="text-default-500">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately, and we'll prorate any charges.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-default-500">
                You'll be notified when approaching your limits. To continue,
                you'll need to upgrade your plan or remove some content.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-default-500">
                Yes, we offer a 14-day money-back guarantee on all paid plans.
                No questions asked.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I add more team members?
              </h3>
              <p className="text-default-500">
                On the Business plan, you can add additional team members for
                $15/month each. Enterprise plans include unlimited team members.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-default-500">
                We accept all major credit cards, debit cards, and support
                various payment methods through our payment processor.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Is there a free trial?
              </h3>
              <p className="text-default-500">
                Our Free plan is available forever with no credit card required.
                You can upgrade to a paid plan anytime to unlock more features.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 p-12 bg-default-100 rounded-2xl">
          <h2 className="text-3xl font-bold font-mono mb-4">
            Still have questions?
          </h2>
          <p className="text-default-500 mb-6">
            Our team is here to help. Contact us for custom enterprise
            solutions.
          </p>
          <button
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            onClick={() => router.push("/dashboard/support")}
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
