"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check } from "lucide-react";

import { PricingPlan } from "@/config/pricing";
import { formatPrice } from "@/config/pricing";

// Custom styles to match landing page theme - overriding HeroUI dark defaults
const cardStyles = {
  background: "bg-white",
  border: "border-stone-200",
  borderPopular: "border-[#1c1917]",
  textTitle: "text-[#1c1917]",
  textDescription: "text-stone-600",
  textMuted: "text-stone-500",
  buttonPopular: "bg-[#1c1917] text-stone-50 hover:bg-stone-800",
  buttonDefault: "bg-stone-100 text-[#1c1917] hover:bg-stone-200",
  checkIcon: "text-[#1c1917]",
  popularBadge: "bg-[#1c1917] text-stone-50",
};

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
        <div className={`absolute -top-0 left-1/2 -translate-x-1/2 ${cardStyles.popularBadge} px-4 py-1 rounded-full text-sm font-semibold z-10`}>
          Most Popular
        </div>
      )}

      <Card
        className={`${cardStyles.background} border-2 rounded-xl ${
          plan.popular ? cardStyles.borderPopular : cardStyles.border
        }`}
        shadow="none"
      >
        <CardHeader className="flex flex-col items-start gap-2 pb-6 border-b border-stone-200 bg-transparent">
          <h3 className={`text-2xl font-bold ${cardStyles.textTitle}`}>{plan.name}</h3>
          <p className={`text-sm ${cardStyles.textDescription} font-medium`}>
            {plan.description}
          </p>

          <div className="mt-6">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-bold ${cardStyles.textTitle} tracking-tight`}>
                {formatPrice(price)}
              </span>
              <span className={`${cardStyles.textMuted} font-medium`}>/month</span>
            </div>
            {billingCycle === "annual" && (
              <div className="mt-2">
                <p className={`text-xs ${cardStyles.textMuted} font-bold uppercase tracking-wider`}>
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && (
                  <p className="text-xs font-bold mt-1 bg-stone-100 text-[#1c1917] inline-block px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                <Check className={`w-5 h-5 ${cardStyles.checkIcon} flex-shrink-0 mt-0.5`} />
                <span className={`text-sm font-medium ${cardStyles.textDescription}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className={`w-full py-6 rounded-xl font-bold text-sm transition-all ${
              plan.popular
                ? cardStyles.buttonPopular
                : cardStyles.buttonDefault
            }`}
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
