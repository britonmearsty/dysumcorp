"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { authClient, useSession } from "@/lib/auth-client";

export function SubscriptionStatus() {
  const { data: session, isPending } = useSession();
  const [creemStatus, setCreemStatus] = useState<{
    hasAccessGranted?: boolean;
    hasAccess?: boolean;
    expiresAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const userPlan = (session?.user as any)?.subscriptionPlan || "trial";
  const userStatus = (session?.user as any)?.subscriptionStatus || "trialing";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await authClient.creem.hasAccessGranted();

        setCreemStatus(data || null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      fetchStatus();
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

  // Derive display values from DB state (source of truth)
  const isPro = userPlan === "pro";
  const isActive = isPro && userStatus === "active";
  const isTrialing = isPro && userStatus === "trialing";
  const isScheduledCancel = isPro && userStatus === "scheduled_cancel";
  const isExpired = userPlan === "expired";
  const isNewUser = userPlan === "trial"; // no card, no subscription

  // Plan label
  let planLabel: string;

  if (isPro) {
    planLabel = "Pro";
  } else if (isExpired) {
    planLabel = "Expired";
  } else {
    planLabel = "No plan";
  }

  // Status chip
  let chipLabel: string;
  let chipColor: "success" | "warning" | "danger" | "default";

  if (isActive) {
    chipLabel = "Active";
    chipColor = "success";
  } else if (isTrialing) {
    chipLabel = "Trialing";
    chipColor = "warning";
  } else if (isScheduledCancel) {
    chipLabel = "Cancelling";
    chipColor = "warning";
  } else if (isExpired) {
    chipLabel = "Expired";
    chipColor = "danger";
  } else {
    // new user
    chipLabel = "No subscription";
    chipColor = "default";
  }

  return (
    <Card className="bg-card border border-border rounded-xl" shadow="none">
      <CardBody className="gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Plan</span>
          <span className="text-sm font-bold">{planLabel}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Chip color={chipColor} size="sm" variant="flat">
            {chipLabel}
          </Chip>
        </div>

        {isScheduledCancel && creemStatus?.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Access until:{" "}
            {new Date(creemStatus.expiresAt).toLocaleDateString()}
          </p>
        )}

        {isTrialing && (
          <p className="text-xs text-muted-foreground">
            Your card will be charged at the end of your 7-day trial.
          </p>
        )}

        {isNewUser && (
          <p className="text-xs text-muted-foreground">
            Subscribe to create portals and start collecting files.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
