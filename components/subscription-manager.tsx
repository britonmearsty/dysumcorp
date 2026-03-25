"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

import { CustomerPortalButton } from "./customer-portal-button";

import { PRICING_PLANS } from "@/config/pricing";

interface SubscriptionManagerProps {
  currentPlan: string;
  onSubscriptionChanged?: () => void;
}

export function SubscriptionManager({
  currentPlan,
}: SubscriptionManagerProps) {
  const currentPlanDetails =
    PRICING_PLANS[currentPlan as keyof typeof PRICING_PLANS];

  if (!currentPlanDetails) {
    return (
      <Card className="bg-card border border-border rounded-xl" shadow="none">
        <CardBody className="text-center py-8">
          <p className="text-muted-foreground mb-4">No active subscription</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border rounded-xl" shadow="none">
      <CardHeader className="flex flex-col items-start gap-1 bg-muted/30">
        <h3 className="text-lg font-semibold">Manage Subscription</h3>
        <p className="text-small text-muted-foreground">
          Current Plan: {currentPlanDetails.name}
        </p>
      </CardHeader>
      <CardBody className="gap-4">
        <p className="text-sm text-muted-foreground">
          To cancel or update your subscription, use the Creem customer portal.
          You can cancel anytime — access continues until the end of your billing period.
        </p>
        <div className="grid gap-3">
          <CustomerPortalButton
            color="secondary"
            label="Manage Payment Methods"
            variant="flat"
          />
          <CustomerPortalButton
            color="danger"
            label="Cancel Subscription"
            variant="flat"
          />
        </div>
      </CardBody>
    </Card>
  );
}
