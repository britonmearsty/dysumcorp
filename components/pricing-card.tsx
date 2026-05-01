"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check } from "lucide-react";

import { PricingPlan } from "@/config/pricing";
import { formatPrice } from "@/config/pricing";

// Custom styles to match landing page theme - overriding HeroUI dark defaults
// REVERSIBILITY: Remove variant param to revert
const getCardStyles = (variant: "landing" | "dashboard" = "landing") => {
  const isDashboard = variant === "dashboard";

  return {
    background: isDashboard
      ? "bg-card dark:bg-card"
      : "bg-white",
    border: isDashboard
      ? "border-border dark:border-border"
      : "border-stone-200",
    borderPopular: isDashboard
      ? "border-primary dark:border-primary"
      : "border-[#1c1917]",
    textTitle: isDashboard
      ? "text-foreground dark:text-foreground"
      : "text-[#1c1917]",
    textDescription: isDashboard
      ? "text-muted-foreground dark:text-muted-foreground"
      : "text-stone-600",
    textMuted: isDashboard
      ? "text-muted-foreground dark:text-muted-foreground"
      : "text-stone-500",
    buttonPopular: isDashboard
      ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
      : "bg-[#1c1917] text-stone-50 hover:bg-stone-800",
    buttonDefault: isDashboard
      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground"
      : "bg-stone-100 text-[#1c1917] hover:bg-stone-200",
    checkIcon: isDashboard
      ? "text-primary dark:text-primary"
      : "text-[#1c1917]",
    popularBadge: isDashboard
      ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
      : "bg-[#1c1917] text-stone-50",
    divider: isDashboard
      ? "border-border dark:border-border"
      : "border-stone-200",
    savingsBadge: isDashboard
      ? "bg-muted text-foreground dark:bg-muted dark:text-foreground"
      : "bg-stone-100 text-[#1c1917]",
  };
};

// REVERSIBILITY: Remove variant from interface to revert
interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "annual";
  currentPlan?: string;
  currentStatus?: string;
  onSubscribe?: (planId: string, isAnnual: boolean) => void;
  variant?: "landing" | "dashboard";
}

// REVERSIBILITY: Remove variant param to revert
export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  currentStatus,
  onSubscribe,
  variant = "landing",
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isCancelledGrace = isCurrentPlan && currentStatus === "cancelled";
  const price = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.price;
  const totalPrice = billingCycle === "annual" ? plan.priceAnnual : plan.price;
  const savings =
    billingCycle === "annual" ? plan.price * 12 - plan.priceAnnual : 0;

  // REVERSIBILITY: Remove this line to revert
  const cardStyles = getCardStyles(variant);

  return (
    <div className="relative pt-4">
      {plan.popular && (
        <div className={`absolute -top-0 left-1/2 -translate-x-1/2 ${cardStyles.popularBadge} px-4 py-1 rounded-full text-sm font-semibold z-10`}>
          Most Popular
        </div>
      )}
      {/* REVERSIBILITY: Remove variant wrapper to revert */}
      <div className={variant === "dashboard" ? "dark" : ""}>

      <Card
        className={`${cardStyles.background} border-2 rounded-xl ${
          plan.popular ? cardStyles.borderPopular : cardStyles.border
        } ${variant === "dashboard" ? "dark:bg-card" : ""}`}
        shadow="none"
      >
        <CardHeader className={`flex flex-col items-start gap-2 pb-6 border-b ${cardStyles.divider} bg-transparent`}>
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
                  <p className={`text-xs font-bold mt-1 ${cardStyles.savingsBadge} inline-block px-2 py-0.5 rounded-full uppercase tracking-wider`}>
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
            {isCancelledGrace
              ? "Cancelling at Period End"
              : isCurrentPlan
                ? "Current Plan"
                : "Subscribe"}
          </Button>
        </CardBody>
      </Card>
      {/* REVERSIBILITY: Remove this closing div to revert */}
      </div>
    </div>
  );
}
