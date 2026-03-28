"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { useSession } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TrialBanner } from "@/components/trial-banner";
import { Paywall } from "@/components/paywall";
import type { AccessResult } from "@/lib/trial";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [access, setAccess] = useState<AccessResult | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    try {
      const res = await fetch("/api/access");
      if (res.ok) {
        const data = await res.json();
        setAccess(data);
      }
    } catch {
      // On error, allow access — don't block the dashboard
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAccess();
    }
  }, [session, fetchAccess]);

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "pro", billingCycle: "monthly" }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      // fallback: navigate to billing page
      router.push("/dashboard/billing");
    }
  };

  if (isPending || (session && accessLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-mono">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // No subscription or expired — show paywall
  if (access?.reason === "expired" || access?.reason === "no_subscription") {
    return <Paywall onCheckout={handleCheckout} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Trial banner shown when user is in their 7-day trial */}
      {(access?.reason === "trialing" ||
        access?.reason === "limited_trial") && (
        <TrialBanner isLimitedTrial={access?.reason === "limited_trial"} />
      )}
      <div className="flex-1">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </div>
  );
}
