"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { useRouter } from "next/navigation";

import { SubscriptionStatus } from "@/components/subscription-status";
import { CustomerPortalButton } from "@/components/customer-portal-button";
import { PricingCard } from "@/components/pricing-card";
import { UsageDashboard } from "@/components/usage-dashboard";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-mono">Billing & Usage</h1>
        <p className="text-default-500 mt-2">
          Manage your subscription, view usage, and upgrade your plan
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <SubscriptionStatus />
        <Card>
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manage Subscription</p>
              <p className="text-xs text-default-500 mt-1">
                Update payment methods and view invoices
              </p>
            </div>
            <CustomerPortalButton />
          </CardBody>
        </Card>
      </div>

      {/* Usage Dashboard */}
      <div>
        <h2 className="text-xl font-semibold font-mono mb-4">Current Usage</h2>
        <UsageDashboard />
      </div>

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold font-mono">Available Plans</h2>
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
      <Card>
        <CardBody>
          <h2 className="font-mono font-semibold text-xl mb-2">Need Help?</h2>
          <p className="text-sm text-default-500 mb-4">
            Use the Customer Portal to manage your subscription, update payment
            methods, and view invoice history.
          </p>
          <CustomerPortalButton label="Open Customer Portal" variant="flat" />
        </CardBody>
      </Card>
    </div>
  );
}
