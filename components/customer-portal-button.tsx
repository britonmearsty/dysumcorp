"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { authClient } from "@/lib/auth-client";

interface CustomerPortalButtonProps {
  label?: string;
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export function CustomerPortalButton({
  label = "Manage Subscription",
  variant = "bordered",
  color = "default",
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.creem.createPortal();

      if (error) {
        console.error("Portal error:", error);
        return;
      }

      if (data && 'url' in data && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open portal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color={color}
      variant={variant}
      onPress={handlePortal}
      isLoading={loading}
    >
      {label}
    </Button>
  );
}
