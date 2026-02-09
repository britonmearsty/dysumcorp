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
  const userPlan = (session?.user as any)?.subscriptionPlan || "free";
  const userStatus = (session?.user as any)?.subscriptionStatus || "active";
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
      <Card>
        <CardBody>
          <p className="text-sm text-default-500">
            Loading subscription status...
          </p>
        </CardBody>
      </Card>
    );
  }

  // Determine subscription status
  // Priority: 1. User table (session), 2. Creem subscription check
  const hasPaidPlan = userPlan !== "free";
  const isUserActive = userStatus === "active";
  const hasCreemAccess =
    creemStatus?.hasAccessGranted ?? creemStatus?.hasAccess ?? false;

  // Consider it active if either source says it's active
  const isActive = (hasPaidPlan && isUserActive) || hasCreemAccess;

  return (
    <Card>
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
            color={isActive ? "success" : "warning"}
            size="sm"
            variant="flat"
          >
            {isActive ? "Active" : "Inactive"}
          </Chip>
        </div>

        {userPlan !== "free" && (
          <div className="text-xs text-default-500 mt-1">
            <p>Plan: {planDetails?.name}</p>
            <p>Status from DB: {userStatus}</p>
          </div>
        )}

        {creemStatus?.expiresAt && (
          <p className="text-xs text-default-500">
            Expires: {new Date(creemStatus.expiresAt).toLocaleDateString()}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
