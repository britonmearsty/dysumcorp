"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check, X } from "lucide-react";

import { PricingPlan } from "@/config/pricing";
import { formatPrice } from "@/config/pricing";

// Custom styles to match landing page theme - overriding HeroUI dark defaults
const getCardStyles = (variant: "landing" | "dashboard" = "landing") => {
  const isDashboard = variant === "dashboard";

  return {
    background: isDashboard
      ? "bg-card dark:bg-card"
      : "bg-white",
    border: isDashboard
      ? "border-border dark:border-border"
      : "border-stone-200",
    textTitle: isDashboard
      ? "text-foreground dark:text-foreground"
      : "text-[#1c1917]",
    textDescription: isDashboard
      ? "text-muted-foreground dark:text-muted-foreground"
      : "text-stone-600",
    textMuted: isDashboard
      ? "text-muted-foreground dark:text-muted-foreground"
      : "text-stone-500",
    buttonDefault: isDashboard
      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground"
      : "bg-stone-100 text-[#1c1917] hover:bg-stone-200",
    checkIcon: isDashboard
      ? "text-primary dark:text-primary"
      : "text-stone-500",
    xIcon: isDashboard
      ? "text-muted-foreground dark:text-muted-foreground"
      : "text-stone-300",
    divider: isDashboard
      ? "border-border dark:border-border"
      : "border-stone-200",
  };
};

interface PricingCardFreeProps {
  plan: PricingPlan;
  variant?: "landing" | "dashboard";
  ctaLabel?: string;
  onSubscribe?: () => void;
}

export function PricingCardFree({
  plan,
  variant = "landing",
  ctaLabel,
  onSubscribe,
}: PricingCardFreeProps) {
  const cardStyles = getCardStyles(variant);

  return (
    <Card
      className={`${cardStyles.background} border-2 rounded-xl ${cardStyles.border}`}
      shadow="none"
    >
      <CardHeader className={`flex flex-col items-start gap-2 pb-6 border-b ${cardStyles.divider} bg-transparent`}>
        <h3 className={`text-2xl font-bold ${cardStyles.textTitle}`}>{plan.name}</h3>
        <p className={`text-sm ${cardStyles.textDescription} font-medium`}>
          {plan.description}
        </p>

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${cardStyles.textTitle} tracking-tight`}>
              {formatPrice(plan.price)}
            </span>
            <span className={`${cardStyles.textMuted} font-medium`}>/month</span>
          </div>
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
          {plan.limitations?.map((limitation, index) => (
            <li key={`limit-${index}`} className="flex items-start gap-3">
              <X className={`w-5 h-5 ${cardStyles.xIcon} flex-shrink-0 mt-0.5`} />
              <span className={`text-sm font-medium ${cardStyles.textMuted}`}>
                {limitation}
              </span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full py-6 rounded-xl font-bold text-sm transition-all ${cardStyles.buttonDefault}`}
          onClick={onSubscribe}
        >
          {ctaLabel || "Create free portal"}
        </Button>
      </CardBody>
    </Card>
  );
}
