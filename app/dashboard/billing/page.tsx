"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, BarChart3, Package, ChevronRight } from "lucide-react";

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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";
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

  // Handle successful/canceled checkout returns
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success) {
      setShowSuccess(true);
      // Refresh session to get updated subscription data
      refetch();

      // Clean up URL after showing message
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.replace("/dashboard/billing");
      }, 3000);

      return () => clearTimeout(timer);
    }

    if (canceled) {
      setShowCanceled(true);
      // Clean up URL after showing message
      const timer = setTimeout(() => {
        setShowCanceled(false);
        router.replace("/dashboard/billing");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch, router]);

  const handleSubscribe = async (planId: string, isAnnual: boolean) => {
    if (planId === "free") {
      return;
    }

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

      // Redirect to Creem checkout
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
            Your subscription has been activated.
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
                  onClick={() => setActiveTab(tab.id)}
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
                      <div className="grid gap-6 md:grid-cols-2">
                        <SubscriptionStatus />
                        <SubscriptionManager
                          currentPlan={currentPlan}
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

                  {/* Plans Tab */}
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

                      <div className="grid gap-6 md:grid-cols-2">
                        {Object.values(PRICING_PLANS).map((plan) => (
                          <PricingCard
                            key={plan.id}
                            billingCycle={billingCycle}
                            currentPlan={currentPlan}
                            plan={plan}
                            onSubscribe={handleSubscribe}
                          />
                        ))}
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
