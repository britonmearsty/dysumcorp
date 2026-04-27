"use client";

import { Lock, CheckCircle, Zap } from "lucide-react";

import { PRICING_PLANS } from "@/config/pricing";

export interface PaywallProps {
  onCheckout: () => void;
}

const PRO_FEATURES = PRICING_PLANS.pro.features;

export function Paywall({ onCheckout }: PaywallProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-main-bg px-4">
      <div className="w-full max-w-md">
        {/* Icon + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border mb-4">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Subscription required
          </h1>
          <p className="text-muted-foreground text-sm">
            Subscribe to Pro to create portals and collect files from clients.
          </p>
        </div>

        {/* Pricing card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Card header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium opacity-90">Pro Plan</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                Most popular
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                ${PRICING_PLANS.pro.price}
              </span>
              <span className="text-sm opacity-80">/month</span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              or ${PRICING_PLANS.pro.priceAnnual}/year (save 20%)
            </p>
          </div>

          {/* Features */}
          <div className="px-6 py-5">
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm text-foreground"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              onClick={onCheckout}
            >
              <Zap className="w-4 h-4" />
              Subscribe to Pro
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Cancel anytime. No hidden fees.
            </p>
          </div>
        </div>

        {/* Support link */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Questions?{" "}
          <a
            className="text-indigo-500 hover:text-indigo-400 underline"
            href="mailto:support@dysumcorp.com"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
