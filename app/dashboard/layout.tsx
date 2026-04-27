"use client";

import type { AccessResult } from "@/lib/access";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

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

  // Show a subscribe banner for free users (no active subscription)
  const showFreeBanner = access?.reason === "free";

  return (
    <div className="flex flex-col min-h-screen">
      {showFreeBanner && (
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
      <div className="flex-1">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </div>
  );
}
