"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { authClient, useSession } from "@/lib/auth-client";
import { PRICING_PLANS } from "@/config/pricing";

export function SubscriptionStatus() {
  const { data: session, isPending } = useSession();
  const [creemStatus, setCreemStatus] = useState<{
    hasAccessGranted?: boolean;
    hasAccess?: boolean;
    expiresAt?: string;
    status?: string;
    subscription?: any;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Get plan from session (User table)
  const userPlan = (session?.user as any)?.subscriptionPlan || "trial";
  const userStatus = (session?.user as any)?.subscriptionStatus || "trialing";
  const planDetails = PRICING_PLANS[userPlan as keyof typeof PRICING_PLANS];

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check Creem subscription status
        const { data } = await authClient.creem.hasAccessGranted();

        setCreemStatus(data || null);
      } catch (err) {
        console.error("Failed to check subscription:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      checkAccess();
    }
  }, [session, isPending]);

  if (loading || isPending) {
    return (
      <Card className="bg-card border border-border rounded-xl" shadow="none">
        <CardBody>
          <p className="text-sm text-muted-foreground">
            Loading subscription status...
          </p>
        </CardBody>
      </Card>
    );
  }

  // Determine subscription status
  const hasPaidPlan = userPlan === "pro";
  const isUserActive = userStatus === "active";
  const hasScheduledCancel = userStatus === "scheduled_cancel";
  const hasCreemAccess =
    creemStatus?.hasAccessGranted ?? creemStatus?.hasAccess ?? false;

  const isActive = (hasPaidPlan && isUserActive) || hasCreemAccess;
  const isCanceled = hasPaidPlan && hasScheduledCancel;

  return (
    <Card className="bg-card border border-border rounded-xl" shadow="none">
      <CardBody className="gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Plan</span>
          <span className="text-sm font-bold">
            {planDetails?.name || "Free"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Subscription Status</span>
          <Chip
            color={isActive ? "success" : isCanceled ? "warning" : "default"}
            size="sm"
            variant="flat"
          >
            {isActive ? "Active" : isCanceled ? "Canceling" : "Inactive"}
          </Chip>
        </div>

        {creemStatus?.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Expires: {new Date(creemStatus.expiresAt).toLocaleDateString()}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
