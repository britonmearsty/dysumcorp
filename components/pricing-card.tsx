"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check, Copy, CheckCheck } from "lucide-react";

import { PricingPlan } from "@/config/pricing";
import { formatPrice } from "@/config/pricing";
// REMOVABLE: DISCOUNT - Remove this import to disable discount promo
import { getDiscount, calculateDiscountedPrice } from "@/config/discounts";

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
  
  // REMOVABLE: DISCOUNT - Remove this entire block to disable discount promo
  const [copied, setCopied] = useState(false);
  const discount = getDiscount(billingCycle);
  const originalPrice = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.price;
  const originalTotal = billingCycle === "annual" ? plan.priceAnnual : plan.price;
  const discountedPrice = calculateDiscountedPrice(originalPrice, discount.percent);
  const discountedTotal = calculateDiscountedPrice(originalTotal, discount.percent);
  const price = discountedPrice;
  const totalPrice = discountedTotal;
  // END REMOVABLE: DISCOUNT
  
  const savings =
    billingCycle === "annual" ? plan.price * 12 - plan.priceAnnual : 0;

  // REMOVABLE: DISCOUNT - Copy handler for discount code
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(discount.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // END REMOVABLE: DISCOUNT

  // REVERSIBILITY: Remove this line to revert
  const cardStyles = getCardStyles(variant);

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
        <CardHeader className={`flex flex-col items-start gap-2 pb-6 border-b ${cardStyles.divider} bg-transparent`}>
          <h3 className={`text-2xl font-bold ${cardStyles.textTitle}`}>{plan.name}</h3>
          <p className={`text-sm ${cardStyles.textDescription} font-medium`}>
            {plan.description}
          </p>

          {/* REMOVABLE: DISCOUNT - Remove this entire promo block to disable */}
          <div className="mt-4">
            <div 
              className={`cursor-pointer rounded-lg border-2 border-dashed px-3 py-2 transition-all hover:opacity-80 ${
                variant === "dashboard" 
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" 
                  : "bg-amber-50 border-amber-300"
              }`}
              onClick={handleCopyCode}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    variant === "dashboard" ? "text-amber-600 dark:text-amber-400" : "text-amber-600"
                  }`}>
                    Limited Special — Ends {discount.endsAt}
                  </p>
                  <p className={`text-sm font-bold ${
                    variant === "dashboard" ? "text-amber-800 dark:text-amber-200" : "text-amber-800"
                  }`}>
                    {discount.percent}% OFF • Code: <span className="font-mono">{discount.code}</span>
                  </p>
                </div>
                {copied ? (
                  <CheckCheck className={`w-4 h-4 ${
                    variant === "dashboard" ? "text-green-600 dark:text-green-400" : "text-green-600"
                  }`} />
                ) : (
                  <Copy className={`w-4 h-4 ${
                    variant === "dashboard" ? "text-amber-600 dark:text-amber-400" : "text-amber-600"
                  }`} />
                )}
              </div>
            </div>
          </div>
          {/* END REMOVABLE: DISCOUNT */}

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              {/* REMOVABLE: DISCOUNT - Remove strikethrough price */}
              <span className={`text-lg line-through ${cardStyles.textMuted}`}>
                {formatPrice(originalPrice)}
              </span>
              {/* END REMOVABLE: DISCOUNT */}
              <span className={`text-5xl font-bold ${cardStyles.textTitle} tracking-tight`}>
                {formatPrice(price)}
              </span>
              <span className={`${cardStyles.textMuted} font-medium`}>/month</span>
            </div>
            {billingCycle === "annual" && (
              <div className="mt-2">
                <p className={`text-xs ${cardStyles.textMuted} font-bold uppercase tracking-wider`}>
                  {/* REMOVABLE: DISCOUNT - Remove strikethrough total */}
                  <span className="line-through">{formatPrice(originalTotal)}</span>
                  {" → "}
                  {/* END REMOVABLE: DISCOUNT */}
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && (
                  <p className={`text-xs font-bold mt-1 ${cardStyles.savingsBadge} inline-block px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                    Save {formatPrice(savings + (originalTotal - discountedTotal))}/year
                  </p>
                )}
              </div>
            )}
            {/* REMOVABLE: DISCOUNT - Remove monthly savings badge */}
            {billingCycle === "monthly" && (
              <p className={`text-xs font-bold mt-1 ${cardStyles.savingsBadge} inline-block px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                Save {discount.percent}% this month
              </p>
            )}
            {/* END REMOVABLE: DISCOUNT */}
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
    </div>
  );
}
