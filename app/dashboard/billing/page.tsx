"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

import { SubscriptionStatus } from "@/components/subscription-status";
import { SubscriptionManager } from "@/components/subscription-manager";
import { PricingCard } from "@/components/pricing-card";
import { UsageDashboard } from "@/components/usage-dashboard";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

export default function BillingPage() {
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";

  // Handle successful/canceled checkout returns
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success) {
      setShowSuccess(true);
      // Refresh session to get updated subscription data
      refetch();

      // Clean up URL after showing message
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.replace("/dashboard/billing");
      }, 3000);

      return () => clearTimeout(timer);
    }

    if (canceled) {
      setShowCanceled(true);
      // Clean up URL after showing message
      const timer = setTimeout(() => {
        setShowCanceled(false);
        router.replace("/dashboard/billing");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch, router]);

  const handleSubscribe = async (planId: string, isAnnual: boolean) => {
    if (planId === "free") {
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

        return;
      }

      // Redirect to Creem checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start checkout process");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Billing & Usage
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your subscription, view usage, and upgrade your plan
        </p>
      </div>

      <div className="space-y-8">
        {/* Success/Canceled Messages */}
        {showSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl">
            <p className="font-bold">Payment successful! 🎉</p>
            <p className="text-sm mt-1">
              Your subscription has been activated.
            </p>
          </div>
        )}
        {showCanceled && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 px-6 py-4 rounded-xl">
            <p className="font-bold">Payment canceled</p>
            <p className="text-sm mt-1">You can try again anytime.</p>
          </div>
        )}

        {/* Current Subscription Status & Management */}
        <div className="grid gap-6 md:grid-cols-2">
          <SubscriptionStatus />
          <SubscriptionManager
            currentPlan={currentPlan}
            onSubscriptionChanged={() => refetch()}
          />
        </div>

        {/* Usage Dashboard */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">
            Current Usage
          </h2>
          <UsageDashboard />
        </div>

        {/* Pricing Plans */}
        <div id="pricing">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Available Plans
            </h2>
            <Tabs
              selectedKey={billingCycle}
              size="sm"
              onSelectionChange={(key) =>
                setBillingCycle(key as "monthly" | "annual")
              }
            >
              <Tab key="monthly" title="Monthly" />
              <Tab key="annual" title="Annual (Save 20%)" />
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {/* Help Section */}
        <div className="bg-bg-card rounded-[12px] border border-border p-6 shadow-sm">
          <h2 className="font-bold text-xl mb-2 text-foreground">Need Help?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Having issues with your subscription? Contact our support team for
            assistance.
          </p>
          <p className="text-sm text-muted-foreground">
            Email: support@dysumcorp.com
          </p>
        </div>
      </div>
    </div>
  );
}
