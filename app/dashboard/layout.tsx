"use client";

import type { AccessResult } from "@/lib/access";
import type { EarlyAccessAvailability } from "@/lib/early-access";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Zap, Rocket } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [access, setAccess] = useState<AccessResult | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [earlyAccessAvailability, setEarlyAccessAvailability] =
    useState<EarlyAccessAvailability | null>(null);

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
      fetch("/api/early-access/availability")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setEarlyAccessAvailability(data))
        .catch(() => {});
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

  const isFreeUser = access?.reason === "free";
  const isEarlyAccessUser = access?.reason === "early_access";
  const launchOfferAvailable =
    isFreeUser &&
    earlyAccessAvailability !== null &&
    earlyAccessAvailability.remaining > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Launch offer nudge — free users who can still claim */}
      {launchOfferAvailable && (
        <div className="w-full bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border-b border-indigo-200 dark:border-indigo-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1800px] py-2 flex items-center justify-between gap-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
              🎉 <strong>You&apos;re eligible!</strong> Claim 2 months of Pro FREE — no credit card required.
            </p>
            <Link
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              href="/dashboard/billing?tab=plans"
            >
              <Rocket className="w-3 h-3" />
              Claim Early Access
            </Link>
          </div>
        </div>
      )}

      {/* Generic upgrade nudge — free users after spots are gone */}
      {isFreeUser && !launchOfferAvailable && (
        <div className="w-full bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1800px] py-2 flex items-center justify-between gap-4">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Subscribe to Pro to create portals and start collecting files.
            </p>
            <Link
              className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              href="/dashboard/billing?tab=plans"
            >
              <Zap className="w-3 h-3" />
              Subscribe
            </Link>
          </div>
        </div>
      )}

      {/* Founding user status bar */}
      {isEarlyAccessUser && access?.expiresAt && (
        <div className="w-full bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1800px] py-2 flex items-center justify-between gap-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
              🚀 <strong>Founding User</strong> — complimentary Pro access expires{" "}
              {new Date(access.expiresAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              .
            </p>
            <Link
              className="shrink-0 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 underline"
              href="/dashboard/billing?tab=plans"
            >
              Manage Plan
            </Link>
          </div>
        </div>
      )}

      <div className="flex-1">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </div>
  );
}
