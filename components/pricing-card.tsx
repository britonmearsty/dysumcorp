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
        className={`bg-white border rounded-[2rem] p-4 ${plan.popular ? "border-2 border-[#1c1917] premium-shadow" : "border-stone-200"}`}
        shadow="none"
      >
        <CardHeader className="flex flex-col items-start gap-2 pb-6 border-b border-stone-100 bg-transparent">
          <h3 className="text-2xl font-bold serif-font text-[#1c1917]">
            {plan.name}
          </h3>
          <p className="text-sm text-stone-600 font-medium">
            {plan.description}
          </p>

          <div className="mt-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-[#1c1917] tracking-tight">
                {formatPrice(price)}
              </span>
              {!isFree && (
                <span className="text-stone-500 font-medium">/month</span>
              )}
            </div>
            {billingCycle === "annual" && !isFree && (
              <div className="mt-2">
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && (
                  <p className="text-xs text-[#1c1917] font-bold mt-1 bg-stone-100 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                <Check className="w-5 h-5 text-[#1c1917] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-stone-700">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className={`w-full py-6 rounded-xl font-bold text-sm transition-all ${
              plan.popular
                ? "bg-[#1c1917] text-stone-50 hover:bg-stone-800"
                : "bg-white border border-stone-200 text-[#1c1917] hover:bg-stone-50"
            }`}
            isDisabled={isCurrentPlan}
            onClick={() => onSubscribe?.(plan.id, billingCycle === "annual")}
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
