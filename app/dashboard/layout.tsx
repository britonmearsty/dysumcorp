"use client";

import type { AccessResult } from "@/lib/trial";

import { useEffect, useState, useCallback } from "react";

import { useSession } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TrialBanner } from "@/components/trial-banner";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
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
      // On error, allow access
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAccess();
    }
  }, [session, fetchAccess]);

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

  // Calculate days remaining in trial from trialStartedAt (stored in session)
  const trialStartedAt = (session.user as any)?.trialStartedAt;
  let daysRemaining: number | undefined;

  if (access?.reason === "trialing" && trialStartedAt) {
    const trialEnd = new Date(trialStartedAt);

    trialEnd.setDate(trialEnd.getDate() + 7);
    const msRemaining = trialEnd.getTime() - Date.now();

    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  }

  // Only show trial banner for pro+trialing users (card on file, within trial)
  // Not for new users with no subscription
  const showTrialBanner = access?.reason === "trialing";

  return (
    <div className="flex flex-col min-h-screen">
      {showTrialBanner && <TrialBanner daysRemaining={daysRemaining} />}
      <div className="flex-1">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </div>
  );
}
