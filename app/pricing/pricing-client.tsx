"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { useRouter } from "next/navigation";
import { PricingCard } from "@/components/pricing-card";
import { PRICING_PLANS } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

export function PricingClient() {
    const router = useRouter();
    const { data: session } = useSession();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
        "monthly",
    );
    const currentPlan = (session?.user as any)?.subscriptionPlan || "free";

    const handleSubscribe = async (planId: string, isAnnual: boolean) => {
        if (!session?.user) {
            router.push("/auth?redirect=/pricing");
            return;
        }
        if (planId === "free") {
            router.push("/dashboard");
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
                alert(data.error || "Failed to create checkout session");
                router.push("/dashboard/billing");
                return;
            }
            window.location.href = data.checkoutUrl;
        } catch (error) {
            console.error("Subscription error:", error);
            alert("Failed to start checkout process");
            router.push("/dashboard/billing");
        }
    };

    return (
        <div className="min-h-screen py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold font-mono mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-default-500 max-w-2xl mx-auto">
                        Choose the perfect plan for your needs. Upgrade, downgrade, or
                        cancel anytime.
                    </p>
                </div>

                <div className="flex justify-center mb-12">
                    <Tabs
                        classNames={{
                            tabList: "bg-muted border-border",
                            cursor: "bg-primary",
                            tab: "text-muted-foreground data-[selected=true]:text-primary-foreground",
                            tabContent: "group-data-[selected=true]:text-primary-foreground",
                        }}
                        selectedKey={billingCycle}
                        size="lg"
                        onSelectionChange={(key) =>
                            setBillingCycle(key as "monthly" | "annual")
                        }
                    >
                        <Tab key="monthly" title="Monthly" />
                        <Tab
                            key="annual"
                            title={
                                <div className="flex items-center gap-2">
                                    Annual
                                    <span className="bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full">
                                        Save 20%
                                    </span>
                                </div>
                            }
                        />
                    </Tabs>
                </div>

                <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-16">
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

                <div className="max-w-3xl mx-auto mt-20">
                    <h2 className="text-3xl font-bold font-mono text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                Can I upgrade or downgrade later?
                            </h3>
                            <p className="text-default-500">
                                Yes! You can upgrade from Free to Pro or cancel your Pro
                                subscription at any time. Changes take effect immediately, and
                                we&apos;ll prorate any charges.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                What happens if I exceed my limits on the Free plan?
                            </h3>
                            <p className="text-default-500">
                                You&apos;ll be notified when you reach your portal or storage
                                limit. To continue creating portals or uploading files,
                                you&apos;ll need to upgrade to Pro or remove some content.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                Do you offer refunds?
                            </h3>
                            <p className="text-default-500">
                                Yes, we offer a 14-day money-back guarantee on the Pro plan. No
                                questions asked.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-default-500">
                                We accept all major credit cards, debit cards, and support
                                various payment methods through our secure payment processor.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                Is there a free trial for Pro?
                            </h3>
                            <p className="text-default-500">
                                Our Free plan is available forever with no credit card required.
                                You can try the platform and upgrade to Pro anytime to unlock
                                unlimited portals, 500GB storage, and all premium features.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                Can I cancel my Pro subscription anytime?
                            </h3>
                            <p className="text-default-500">
                                Absolutely! You can cancel your Pro subscription at any time.
                                You&apos;ll retain access to Pro features until the end of your
                                billing period, then automatically move to the Free plan.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-20 p-12 bg-default-100 rounded-2xl">
                    <h2 className="text-3xl font-bold font-mono mb-4">
                        Still have questions?
                    </h2>
                    <p className="text-default-500 mb-6">
                        Our team is here to help. Reach out for any questions or support.
                    </p>
                    <button
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
                        onClick={() => router.push("/dashboard/support")}
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}
