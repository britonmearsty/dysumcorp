"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { authClient } from "@/lib/auth-client";

export function SubscriptionStatus() {
  const [status, setStatus] = useState<{
    hasAccessGranted?: boolean;
    hasAccess?: boolean;
    expiresAt?: string;
    status?: string;
    subscription?: any;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data } = await authClient.creem.hasAccessGranted();

        setStatus(data || null);
      } catch (err) {
        console.error("Failed to check subscription:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
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

  if (!status) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-default-500">No subscription found</p>
        </CardBody>
      </Card>
    );
  }

  const hasAccess = status.hasAccessGranted ?? status.hasAccess ?? false;

  return (
    <Card>
      <CardBody className="gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Subscription Status</span>
          <Chip
            color={hasAccess ? "success" : "warning"}
            size="sm"
            variant="flat"
          >
            {hasAccess ? "Active" : "Inactive"}
          </Chip>
        </div>
        {status.expiresAt && (
          <p className="text-xs text-default-500">
            Expires: {new Date(status.expiresAt).toLocaleDateString()}
          </p>
        )}
        {status.status && (
          <p className="text-xs text-default-500">Status: {status.status}</p>
        )}
      </CardBody>
    </Card>
  );
}
