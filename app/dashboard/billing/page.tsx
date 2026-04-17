"use client";

import type { AccessResult } from "@/lib/trial";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  BarChart3,
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";

import { SubscriptionStatus } from "@/components/subscription-status";
import { SubscriptionManager } from "@/components/subscription-manager";
import { PricingCard } from "@/components/pricing-card";
import { UsageDashboard } from "@/components/usage-dashboard";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/lib/toast";

export default function BillingPage() {
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Sync activeTab with URL params on mount
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "plans", "usage"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const [access, setAccess] = useState<AccessResult | null>(null);
  const currentPlan = (session?.user as any)?.subscriptionPlan || "trial";
  const currentStatus = (session?.user as any)?.subscriptionStatus || "trialing";
  const { showToast } = useToast();

  const tabs = [
    {
      id: "overview",
      name: "Overview",
      icon: CreditCard,
      description: "Subscription status and management",
    },
    {
      id: "plans",
      name: "Plans",
      icon: Package,
      description: "Available pricing plans",
    },
    {
      id: "usage",
      name: "Usage",
      icon: BarChart3,
      description: "Current usage and limits",
    },
  ];

  // Fetch access status for trial info
  useEffect(() => {
    fetch("/api/access")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAccess(data);
      })
      .catch(() => {});
  }, [session]);

  // Handle successful/canceled checkout returns
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success) {
      setShowSuccess(true);

      // Poll until the webhook has updated the DB and session reflects the new state.
      // Creem webhooks typically arrive within 1-3 seconds of redirect.
      let attempts = 0;
      const maxAttempts = 10;

      const poll = async () => {
        attempts++;
        await refetch();

        // Also refresh access state
        try {
          const res = await fetch("/api/access");
          if (res.ok) {
            const data = await res.json();
            setAccess(data);

            // If access is now granted (trialing or active), we're done
            if (data.allowed) {
              router.replace("/dashboard/billing");
              return;
            }
          }
        } catch {}

        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          // Webhook took too long — just clear the param and show whatever state we have
          router.replace("/dashboard/billing");
        }
      };

      // Start polling after a short initial delay to give the webhook time to arrive
      setTimeout(poll, 1500);

      const timer = setTimeout(() => setShowSuccess(false), 18000);
      return () => clearTimeout(timer);
    }

    if (canceled) {
      setShowCanceled(true);
      const timer = setTimeout(() => {
        setShowCanceled(false);
        router.replace("/dashboard/billing");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch, router]);

  const handleSubscribe = async (planId: string, isAnnual: boolean) => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: isAnnual ? "annual" : "monthly",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Failed to create checkout session", "error");

        return;
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      showToast("Failed to start checkout process", "error");
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Billing & Usage
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Manage your subscription, view usage, and upgrade your plan
        </p>
      </div>

      {/* Success/Canceled Messages */}
      {showSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 sm:mb-6">
          <p className="font-bold text-sm sm:text-base">Payment successful!</p>
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">
            Activating your subscription — this may take a few seconds.
          </p>
        </div>
      )}
      {showCanceled && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 sm:mb-6">
          <p className="font-bold text-sm sm:text-base">Payment canceled</p>
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1">
            You can try again anytime.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-card border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.replace(`/dashboard/billing?tab=${tab.id}`, {
                      scroll: false,
                    });
                  }}
                >
                  <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto"
                      layoutId="billing-indicator"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-xl border border-border overflow-visible">
                {/* Card Header */}
                <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-foreground">
                      {tabs.find((t) => t.id === activeTab)?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tabs.find((t) => t.id === activeTab)?.description}
                    </p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Trialing — card on file, within 7-day trial */}
                      {access?.reason === "trialing" && (
                        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
                          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                              7-Day Free Trial Active
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">
                              Your card will be charged at the end of your
                              7-day trial. Cancel anytime before then.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Active paid subscriber */}
                      {access?.reason === "active_subscription" &&
                        currentStatus !== "scheduled_cancel" && (
                          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              Pro plan active
                            </p>
                          </div>
                        )}

                      {/* Scheduled cancel — still has access until period end */}
                      {currentStatus === "scheduled_cancel" && (
                        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                              Subscription cancelling
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              You have full access until your billing period
                              ends. You can resume your subscription anytime
                              before then.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-6 md:grid-cols-2">
                        <SubscriptionStatus />
                        <SubscriptionManager
                          currentPlan={currentPlan}
                          currentStatus={currentStatus}
                          onSubscriptionChanged={() => refetch()}
                        />
                      </div>

                      {/* Help Section */}
                      <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="font-bold text-xl mb-2 text-foreground">
                          Need Help?
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          Having issues with your subscription? Contact our
                          support team for assistance.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Email: support@dysumcorp.com
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Plans Tab — only Pro plan shown */}
                  {activeTab === "plans" && (
                    <div id="pricing">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-foreground">
                          Choose Your Plan
                        </h3>
                        <Tabs
                          classNames={{
                            tabList: "bg-muted border-border",
                            cursor: "bg-primary",
                            tab: "text-muted-foreground data-[selected=true]:text-primary-foreground",
                            tabContent:
                              "group-data-[selected=true]:text-primary-foreground",
                          }}
                          selectedKey={billingCycle}
                          size="sm"
                          onSelectionChange={(key) =>
                            setBillingCycle(key as "monthly" | "annual")
                          }
                        >
                          <Tab key="monthly" title="Monthly" />
                          <Tab key="annual" title="Annual (Save 20%)" />
                        </Tabs>
                      </div>

                      <div className="max-w-sm">
                        <PricingCard
                          billingCycle={billingCycle}
                          currentPlan={currentPlan}
                          currentStatus={currentStatus}
                          plan={PRICING_PLANS.pro}
                          onSubscribe={handleSubscribe}
                        />
                      </div>
                    </div>
                  )}

                  {/* Usage Tab */}
                  {activeTab === "usage" && (
                    <div>
                      <UsageDashboard />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
