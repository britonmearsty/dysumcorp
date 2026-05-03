"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

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
  label = "Subscribe Now",
  variant = "solid",
  color = "primary",
}: BillingButtonProps) {
  const router = useRouter();

  const handleCheckout = () => {
    router.push("/dashboard/billing?tab=plans");
  };

  return (
    <Button
      color={color}
      variant={variant}
      onPress={handleCheckout}
    >
      {label}
    </Button>
  );
}
