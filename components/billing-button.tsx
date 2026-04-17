"use client";

import { useState } from "react";
import { Button } from "@heroui/button";

import { useToast } from "@/lib/toast";

interface BillingButtonProps {
  planId?: string;
  billingCycle?: "monthly" | "annual";
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

export function BillingButton({
  planId = "pro",
  billingCycle = "monthly",
  label = "Subscribe Now",
  variant = "solid",
  color = "primary",
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Failed to start checkout", "error");

        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
      showToast("Failed to start checkout process", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color={color}
      isLoading={loading}
      variant={variant}
      onPress={handleCheckout}
    >
      {label}
    </Button>
  );
}
