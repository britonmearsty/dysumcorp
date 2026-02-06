"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { authClient } from "@/lib/auth-client";

interface BillingButtonProps {
  productId: string;
  label?: string;
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  discountCode?: string;
  metadata?: Record<string, any>;
}

export function BillingButton({
  productId,
  label = "Subscribe Now",
  variant = "solid",
  color = "primary",
  discountCode,
  metadata,
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.creem.createCheckout({
        productId,
        successUrl: "/dashboard",
        discountCode,
        metadata,
      });

      if (error) {
        console.error("Checkout error:", error);
        return;
      }

      if (data && 'url' in data && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color={color}
      variant={variant}
      onPress={handleCheckout}
      isLoading={loading}
    >
      {label}
    </Button>
  );
}
