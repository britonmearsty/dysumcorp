"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";

import { CustomerPortalButton } from "./customer-portal-button";

import { PRICING_PLANS } from "@/config/pricing";
import { useToast } from "@/lib/toast";

interface SubscriptionManagerProps {
  currentPlan: string;
  currentStatus?: string;
  onSubscriptionChanged?: () => void;
}

export function SubscriptionManager({
  currentPlan,
  currentStatus,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const isPro = currentPlan === "pro";
  const isExpired = currentPlan === "expired";
  const isScheduledCancel = currentStatus === "scheduled_cancel";
  const isTrialing = currentStatus === "trialing";

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "pro", billingCycle: "monthly" }),
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Failed to start checkout", "error");

        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      showToast("Failed to start checkout process", "error");
    } finally {
      setLoading(false);
    }
  };

  // Active pro subscriber (including scheduled cancel — still has access)
  if (isPro) {
    return (
      <Card className="bg-card border border-border rounded-xl" shadow="none">
        <CardHeader className="flex flex-col items-start gap-1 bg-muted/30">
          <h3 className="text-lg font-semibold">Manage Subscription</h3>
          <p className="text-small text-muted-foreground">
            {PRICING_PLANS.pro.name} Plan
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          {isScheduledCancel ? (
            <p className="text-sm text-muted-foreground">
              Your subscription is set to cancel at the end of the current
              billing period. You retain full access until then. You can resume
              your subscription from the portal below.
            </p>
          ) : isTrialing ? (
            <p className="text-sm text-muted-foreground">
              You&apos;re in your 7-day free trial. Your card will be charged
              when the trial ends. Cancel anytime before then from the portal
              below.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              To cancel or update your subscription, use the customer portal.
              Cancelling schedules your subscription to end at the current
              billing period — you keep access until then.
            </p>
          )}
          <CustomerPortalButton label="Manage Subscription" variant="ghost" />
        </CardBody>
      </Card>
    );
  }

  // Expired or new user — show subscribe CTA
  return (
    <Card className="bg-card border border-border rounded-xl" shadow="none">
      <CardHeader className="flex flex-col items-start gap-1 bg-muted/30">
        <h3 className="text-lg font-semibold">
          {isExpired ? "Resubscribe" : "Get Started"}
        </h3>
        <p className="text-small text-muted-foreground">
          {isExpired
            ? "Your subscription has ended"
            : "No active subscription"}
        </p>
      </CardHeader>
      <CardBody className="gap-4">
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? "Subscribe to Pro to reactivate your portals and continue collecting files."
            : "Subscribe to Pro to create portals and start routing files to your cloud storage."}
        </p>
        <Button
          className="w-full font-semibold"
          color="primary"
          isLoading={loading}
          onPress={handleSubscribe}
        >
          Subscribe to Pro — ${PRICING_PLANS.pro.price}/mo
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          7-day free trial · Cancel anytime
        </p>
      </CardBody>
    </Card>
  );
}
