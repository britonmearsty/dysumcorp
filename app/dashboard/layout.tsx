"use client";

import { useEffect, useState, useCallback } from "react";

import { useSession } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TrialBanner } from "@/components/trial-banner";
import type { AccessResult } from "@/lib/trial";

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Trial banner shown when user is in their 7-day trial */}
      {access?.reason === "trialing" && <TrialBanner />}
      <div className="flex-1">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </div>
  );
}
