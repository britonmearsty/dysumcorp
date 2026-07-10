"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check, Copy, CheckCheck, Rocket, Star } from "lucide-react";
import Link from "next/link";

import { PricingPlan, formatPrice } from "@/config/pricing";
// REMOVABLE: DISCOUNT - Remove this import to disable discount promo
import { getDiscount, calculateDiscountedPrice } from "@/config/discounts";
import { EarlyAccessAvailability } from "@/lib/early-access";

const getCardStyles = (variant: "landing" | "dashboard" = "landing") => {
  const isDashboard = variant === "dashboard";

  return {
    background: isDashboard ? "bg-card dark:bg-card" : "bg-white",
    border: isDashboard ? "border-border dark:border-border" : "border-stone-200",
    borderPopular: isDashboard ? "border-primary dark:border-primary" : "border-[#1c1917]",
    borderLaunch: isDashboard ? "border-indigo-500 dark:border-indigo-400" : "border-indigo-400",
    borderEA: isDashboard ? "border-indigo-400 dark:border-indigo-500" : "border-indigo-300",
    textTitle: isDashboard ? "text-foreground dark:text-foreground" : "text-[#1c1917]",
    textDescription: isDashboard ? "text-muted-foreground dark:text-muted-foreground" : "text-stone-600",
    textMuted: isDashboard ? "text-muted-foreground dark:text-muted-foreground" : "text-stone-500",
    buttonPopular: isDashboard
      ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
      : "bg-[#1c1917] text-stone-50 hover:bg-stone-800",
    buttonDefault: isDashboard
      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground"
      : "bg-stone-100 text-[#1c1917] hover:bg-stone-200",
    buttonMuted: isDashboard
      ? "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
      : "bg-stone-100 text-stone-500 hover:bg-stone-200",
    checkIcon: isDashboard ? "text-primary dark:text-primary" : "text-[#1c1917]",
    popularBadge: isDashboard
      ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
      : "bg-[#1c1917] text-stone-50",
    launchBadge: isDashboard
      ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
      : "bg-indigo-600 text-white",
    eaBadge: isDashboard
      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
      : "bg-indigo-100 text-indigo-700",
    divider: isDashboard ? "border-border dark:border-border" : "border-stone-200",
    savingsBadge: isDashboard
      ? "bg-muted text-foreground dark:bg-muted dark:text-foreground"
      : "bg-stone-100 text-[#1c1917]",
    launchCallout: isDashboard
      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700"
      : "bg-indigo-50 border-indigo-200",
    launchCalloutText: isDashboard ? "text-indigo-900 dark:text-indigo-100" : "text-indigo-900",
    launchCalloutMuted: isDashboard ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-700",
    launchCalloutCheck: isDashboard ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-600",
    eaCallout: isDashboard
      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
      : "bg-indigo-50 border-indigo-200",
  };
};

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "annual";
  currentPlan?: string;
  currentStatus?: string;
  onSubscribe?: (planId: string, isAnnual: boolean) => void;
  variant?: "landing" | "dashboard";
  ctaLabel?: string;
  earlyAccessAvailability?: EarlyAccessAvailability | null;
  hasEarlyAccess?: boolean;
  onClaimSuccess?: () => void;
  /** When true, clicking Claim Early Access redirects to /auth instead of calling the API */
  requiresAuth?: boolean;
  /** Expiry date for EA users, to show in status card */
  earlyAccessExpiresAt?: Date | null;
}

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  currentStatus,
  onSubscribe,
  variant = "landing",
  ctaLabel,
  earlyAccessAvailability,
  hasEarlyAccess,
  onClaimSuccess,
  requiresAuth = false,
  earlyAccessExpiresAt,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isCancelledGrace = isCurrentPlan && currentStatus === "cancelled";
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // REMOVABLE: DISCOUNT
  const [copied, setCopied] = useState(false);
  const discount = getDiscount(billingCycle);
  const originalPrice = billingCycle === "annual" ? plan.priceAnnual / 12 : plan.price;
  const originalTotal = billingCycle === "annual" ? plan.priceAnnual : plan.price;
  const discountedPrice = calculateDiscountedPrice(originalPrice, discount.percent);
  const discountedTotal = calculateDiscountedPrice(originalTotal, discount.percent);
  const price = discount.active ? discountedPrice : originalPrice;
  const totalPrice = discount.active ? discountedTotal : originalTotal;
  const savings = billingCycle === "annual" ? plan.price * 12 - plan.priceAnnual : 0;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(discount.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // END REMOVABLE: DISCOUNT

  // Show the launch offer promo when:
  // - Spots are available
  // - User hasn't claimed (or isn't logged in yet)
  // - User isn't already on Pro
  const showLaunchOffer =
    !!earlyAccessAvailability &&
    earlyAccessAvailability.remaining > 0 &&
    !hasEarlyAccess &&
    !isCurrentPlan;

  const handleClaimEarlyAccess = async () => {
    if (requiresAuth) {
      window.location.href = "/auth?redirect=/dashboard/billing?tab=plans";
      return;
    }
    setClaimError(null);
    setIsClaiming(true);
    try {
      const res = await fetch("/api/early-access/claim", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || "Failed to claim early access");
        return;
      }
      onClaimSuccess?.();
    } catch {
      setClaimError("Failed to claim early access");
    } finally {
      setIsClaiming(false);
    }
  };

  const cardStyles = getCardStyles(variant);

  // Border priority: EA active > launch offer > popular > default
  const borderClass = hasEarlyAccess
    ? cardStyles.borderEA
    : showLaunchOffer
      ? cardStyles.borderLaunch
      : plan.popular
        ? cardStyles.borderPopular
        : cardStyles.border;

  const glowClass = showLaunchOffer && !hasEarlyAccess
    ? "shadow-[0_0_0_1px_#6366f1,0_4px_24px_0_rgba(99,102,241,0.15)]"
    : "";

  const scaleClass = showLaunchOffer && !hasEarlyAccess ? "scale-[1.02]" : "";

  // Resolve the badge to show
  const badge = hasEarlyAccess ? (
    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 ${cardStyles.eaBadge} px-4 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1.5 whitespace-nowrap`}>
      <Rocket className="w-3 h-3" />
      Founding User
    </div>
  ) : showLaunchOffer ? (
    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 ${cardStyles.launchBadge} px-4 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1.5 whitespace-nowrap`}>
      <Rocket className="w-3 h-3" />
      Launch Offer
    </div>
  ) : plan.popular ? (
    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 ${cardStyles.popularBadge} px-4 py-1 rounded-full text-sm font-semibold z-10`}>
      Most Popular
    </div>
  ) : null;

  return (
    <div className={`relative pt-4 ${scaleClass} transition-transform duration-300`}>
      {badge}

      <Card
        className={`${cardStyles.background} border-2 rounded-xl ${borderClass} ${glowClass}`}
        shadow="none"
      >
        <CardHeader className={`flex flex-col items-start gap-2 pb-6 border-b ${cardStyles.divider} bg-transparent`}>
          <h3 className={`text-2xl font-bold ${cardStyles.textTitle}`}>{plan.name}</h3>
          <p className={`text-sm ${cardStyles.textDescription} font-medium`}>
            {plan.description}
          </p>

          {/* REMOVABLE: DISCOUNT */}
          {discount.active && (
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
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${variant === "dashboard" ? "text-amber-600 dark:text-amber-400" : "text-amber-600"}`}>
                      First subscription only — click to copy
                    </p>
                    <p className={`text-sm font-bold ${variant === "dashboard" ? "text-amber-800 dark:text-amber-200" : "text-amber-800"}`}>
                      {discount.percent}% OFF • Code: <span className="font-mono">{discount.code}</span>
                    </p>
                  </div>
                  {copied ? (
                    <CheckCheck className={`w-4 h-4 ${variant === "dashboard" ? "text-green-600 dark:text-green-400" : "text-green-600"}`} />
                  ) : (
                    <Copy className={`w-4 h-4 ${variant === "dashboard" ? "text-amber-600 dark:text-amber-400" : "text-amber-600"}`} />
                  )}
                </div>
              </div>
            </div>
          )}
          {/* END REMOVABLE: DISCOUNT */}

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              {discount.active && (
                <span className={`text-lg line-through ${cardStyles.textMuted}`}>
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className={`text-5xl font-bold ${cardStyles.textTitle} tracking-tight`}>
                {formatPrice(price)}
              </span>
              <span className={`${cardStyles.textMuted} font-medium`}>/month</span>
            </div>
            {billingCycle === "annual" && (
              <div className="mt-2">
                <p className={`text-xs ${cardStyles.textMuted} font-bold uppercase tracking-wider`}>
                  {discount.active && <span className="line-through">{formatPrice(originalTotal)}</span>}
                  {discount.active && " → "}
                  {formatPrice(totalPrice)} billed annually
                </p>
                {savings > 0 && discount.active && (
                  <p className={`text-xs font-bold mt-1 ${cardStyles.savingsBadge} inline-block px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                    Save {formatPrice(savings + (originalTotal - discountedTotal))}/year
                  </p>
                )}
              </div>
            )}
            {billingCycle === "monthly" && discount.active && (
              <p className={`text-xs font-bold mt-1 ${cardStyles.savingsBadge} inline-block px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                Save {discount.percent}% on your first month
              </p>
            )}
          </div>
        </CardHeader>

        <CardBody className="pt-6 px-2">
          <ul className="space-y-4 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className={`w-5 h-5 ${cardStyles.checkIcon} flex-shrink-0 mt-0.5`} />
                <span className={`text-sm font-medium ${cardStyles.textDescription}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* ── Early Access user: show founding user status, no upgrade prompt ── */}
          {hasEarlyAccess ? (
            <div className={`rounded-xl border px-4 py-3 ${cardStyles.eaCallout}`}>
              <div className="flex items-start gap-2.5">
                <Rocket className={`w-4 h-4 mt-0.5 shrink-0 ${cardStyles.launchCalloutCheck}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${cardStyles.launchCalloutText}`}>
                    Founding User — Pro access active
                  </p>
                  {earlyAccessExpiresAt && (
                    <p className={`text-xs mt-0.5 ${cardStyles.launchCalloutMuted}`}>
                      Expires{" "}
                      {new Date(earlyAccessExpiresAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              <Link
                className={`mt-3 block text-center text-xs font-semibold underline ${cardStyles.launchCalloutCheck}`}
                href="/dashboard/billing"
              >
                Manage Plan
              </Link>
            </div>
          ) : showLaunchOffer ? (
            /* ── Launch offer: EA callout + single primary CTA ── */
            <div className="space-y-2">
              <div className={`rounded-xl border px-4 py-3 mb-1 ${cardStyles.launchCallout}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${cardStyles.launchCalloutMuted} mb-1.5`}>
                  🎉 Limited-Time Launch Offer
                </p>
                <p className={`text-sm font-bold ${cardStyles.launchCalloutText} mb-2`}>
                  Claim 2 months of Pro FREE
                </p>
                <ul className="space-y-1">
                  {["No credit card required", "Instant access", "Ends after the first 20 users"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${cardStyles.launchCalloutCheck}`} />
                      <span className={`text-xs font-medium ${cardStyles.launchCalloutMuted}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full py-6 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
                isDisabled={isClaiming}
                onClick={handleClaimEarlyAccess}
              >
                <Rocket className="w-4 h-4" />
                {isClaiming ? "Claiming..." : "Claim Free Early Access"}
              </Button>
              {claimError && (
                <p className="text-xs text-red-600 dark:text-red-400 text-center">{claimError}</p>
              )}
              <p className="text-center text-[11px] text-indigo-600 font-semibold">
                Available during launch only — first 20 users.
              </p>
              <p className={`text-center text-[10px] ${cardStyles.textMuted} font-medium`}>
                Or pay ${plan.price}/month with the toggle above.{" "}
                <button
                  className="underline"
                  onClick={() => onSubscribe?.(plan.id, billingCycle === "annual")}
                >
                  Upgrade now
                </button>
              </p>
            </div>
          ) : (
            /* ── Default: single subscribe / current plan button ── */
            <Button
              className={`w-full py-6 rounded-xl font-bold text-sm transition-all ${
                plan.popular ? cardStyles.buttonPopular : cardStyles.buttonDefault
              }`}
              isDisabled={isCurrentPlan && !isCancelledGrace}
              onClick={() => onSubscribe?.(plan.id, billingCycle === "annual")}
            >
              {isCancelledGrace
                ? "Cancelling at Period End"
                : isCurrentPlan
                  ? "Current Plan"
                  : ctaLabel || "Subscribe"}
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
