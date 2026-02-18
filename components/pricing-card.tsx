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
  onSubscribe?: (planId: string, isAnnual: boolean) => void;
}

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  onSubscribe,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === "free";
  const price = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.price;
  const totalPrice = billingCycle === "annual" ? plan.priceAnnual : plan.price;
  const savings =
    billingCycle === "annual" && !isFree
      ? plan.price * 12 - plan.priceAnnual
      : 0;

  return (
    <div className="relative pt-4">
      {plan.popular && (
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold z-10">
          Most Popular
        </div>
      )}

      <Card
        className={`bg-card border border-border rounded-xl ${plan.popular ? "border-2 border-primary" : ""}`}
        shadow="none"
      >
        <CardHeader className="flex flex-col items-start gap-2 pb-4 bg-muted/30">
          <h3 className="text-xl font-bold font-mono">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>

          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold font-mono">
                {formatPrice(price)}
              </span>
              {!isFree && <span className="text-muted-foreground">/month</span>}
            </div>
            {billingCycle === "annual" && !isFree && (
              <div className="mt-1">
                <p className="text-sm text-muted-foreground">
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && (
                  <p className="text-sm text-success font-semibold">
                    Save {formatPrice(savings)}/year
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            fullWidth
            color={plan.popular ? "primary" : "default"}
            isDisabled={isCurrentPlan}
            variant={isCurrentPlan ? "bordered" : "solid"}
            onPress={() => onSubscribe?.(plan.id, billingCycle === "annual")}
          >
            {isCurrentPlan
              ? "Current Plan"
              : isFree
                ? "Get Started"
                : "Subscribe"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
