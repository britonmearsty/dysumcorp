"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { useSession } from "@/lib/auth-client";
import type { AccessResult } from "@/lib/access";

export function SubscriptionStatus() {
  const { data: session, isPending } = useSession();
  const [access, setAccess] = useState<AccessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const userPlan = (session?.user as any)?.subscriptionPlan || "free";
  const userStatus = (session?.user as any)?.subscriptionStatus || "active";
  const polarCurrentPeriodEnd = (session?.user as any)?.polarCurrentPeriodEnd;

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch("/api/access");
        if (res.ok) {
          const data = await res.json();
          setAccess(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      fetchAccess();
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

  const isPro = userPlan === "pro";
  const isActive = isPro && userStatus === "active";
  const isCancelledGrace = isPro && userStatus === "cancelled";
  const isFree = userPlan === "free";

  // Plan label
  const planLabel = isPro ? "Pro" : "Free";

  // Status chip
  let chipLabel: string;
  let chipColor: "success" | "warning" | "danger" | "default";

  if (isActive) {
    chipLabel = "Active";
    chipColor = "success";
  } else if (isCancelledGrace) {
    chipLabel = "Cancelling";
    chipColor = "warning";
  } else {
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

        {isCancelledGrace && polarCurrentPeriodEnd && (
          <p className="text-xs text-muted-foreground">
            Access until:{" "}
            {new Date(polarCurrentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        {isFree && (
          <p className="text-xs text-muted-foreground">
            Subscribe to Pro to create portals and start collecting files.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
