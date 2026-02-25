"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";

import { authClient } from "@/lib/auth-client";

interface CustomerPortalButtonProps {
  label?: string;
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
}

export function CustomerPortalButton({
  label = "Manage Subscription",
  variant = "bordered",
  color = "default",
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: portalError } =
        await authClient.creem.createPortal();

      if (portalError) {
        console.error("Portal error:", portalError);
        setError(
          (portalError as any)?.message ||
            "Failed to open customer portal. Please try again.",
        );

        return;
      }

      if (data && "url" in data && data.url) {
        window.location.href = data.url;
      } else {
        setError("No portal URL returned. Please contact support.");
      }
    } catch (err: any) {
      console.error("Failed to open portal:", err);
      setError(err?.message || "Failed to open customer portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        color={color}
        isLoading={loading}
        variant={variant}
        onPress={handlePortal}
      >
        {label}
      </Button>
      {error && (
        <Alert color="danger" title="Error">
          {error}
        </Alert>
      )}
    </div>
  );
}
