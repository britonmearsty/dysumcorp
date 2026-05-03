"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import { CustomerPortalButton } from "./customer-portal-button";

import { PRICING_PLANS } from "@/config/pricing";
import { useToast } from "@/lib/toast";
// REMOVABLE: DISCOUNT - Remove this import to disable discount promo
import { getDiscount, calculateDiscountedPrice } from "@/config/discounts";

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
  const router = useRouter();
  const { showToast } = useToast();

  const isPro = currentPlan === "pro";
  const isCancelledGrace = isPro && currentStatus === "cancelled";

  // REMOVABLE: DISCOUNT - Remove this block to disable discount display
  const discount = getDiscount("monthly");
  const displayPrice = calculateDiscountedPrice(PRICING_PLANS.pro.price, discount.percent);
  // END REMOVABLE: DISCOUNT

  const handleSubscribe = () => {
    router.push("/dashboard/billing?tab=plans");
  };

  // Active pro subscriber
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
          {isCancelledGrace ? (
            <p className="text-sm text-muted-foreground">
              Your subscription is set to cancel at the end of the current
              billing period. You retain full access until then. You can resume
              your subscription from the portal below.
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

  // Free user — show subscribe CTA
  return (
    <Card className="bg-card border border-border rounded-xl" shadow="none">
      <CardHeader className="flex flex-col items-start gap-1 bg-muted/30">
        <h3 className="text-lg font-semibold">Get Started</h3>
        <p className="text-small text-muted-foreground">No active subscription</p>
      </CardHeader>
      <CardBody className="gap-4">
        <p className="text-sm text-muted-foreground">
          Subscribe to Pro to create portals and start routing files to your
          cloud storage.
        </p>
        <Button
          className="w-full font-semibold"
          color="primary"
          isLoading={loading}
          onPress={handleSubscribe}
        >
          {/* REMOVABLE: DISCOUNT - Restore original: Subscribe to Pro — ${PRICING_PLANS.pro.price}/mo */}
          Subscribe to Pro — ${displayPrice}/mo
          {/* END REMOVABLE: DISCOUNT */}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Cancel anytime. No hidden fees.
        </p>
      </CardBody>
    </Card>
  );
}
