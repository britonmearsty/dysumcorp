"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check } from "lucide-react";

import { PricingPlan } from "@/config/pricing";
import { formatPrice } from "@/config/pricing";

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "annual";
  currentPlan?: string;
  currentStatus?: string;
  onSubscribe?: (planId: string, isAnnual: boolean) => void;
}

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  currentStatus,
  onSubscribe,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isTrialing = isCurrentPlan && currentStatus === "trialing";
  const isScheduledCancel = isCurrentPlan && currentStatus === "scheduled_cancel";
  const price = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.price;
  const totalPrice = billingCycle === "annual" ? plan.priceAnnual : plan.price;
  const savings =
    billingCycle === "annual" ? plan.price * 12 - plan.priceAnnual : 0;

  return (
    <div className="relative pt-4">
      {plan.popular && (
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold z-10">
          Most Popular
        </div>
      )}

      <Card
        className={`bg-card border rounded-xl ${
          plan.popular ? "border-primary" : "border-border"
        }`}
        shadow="none"
      >
        <CardHeader className="flex flex-col items-start gap-2 pb-6 border-b border-border bg-transparent">
          <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground font-medium">
            {plan.description}
          </p>

          <div className="mt-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-foreground tracking-tight">
                {formatPrice(price)}
              </span>
              <span className="text-muted-foreground font-medium">/month</span>
            </div>
            {billingCycle === "annual" && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && (
                  <p className="text-xs text-primary font-bold mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Save {formatPrice(savings)}/year
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="pt-8 px-2">
          <ul className="space-y-4 mb-10">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-foreground/80">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className={`w-full py-6 rounded-xl font-bold text-sm transition-all ${
              plan.popular
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            color={plan.popular ? "primary" : "secondary"}
            isDisabled={isCurrentPlan}
            onClick={() => onSubscribe?.(plan.id, billingCycle === "annual")}
          >
            {isTrialing
              ? "Trial Active"
              : isScheduledCancel
                ? "Cancelling at Period End"
                : isCurrentPlan
                  ? "Current Plan"
                  : "Subscribe"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
