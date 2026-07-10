"use client";

import { Rocket } from "lucide-react";

interface EarlyAccessBannerProps {
  expiresAt: Date;
}

export function EarlyAccessBanner({ expiresAt }: EarlyAccessBannerProps) {
  const expiry = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
          <Rocket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Founding User
          </p>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-0.5">
            You have complimentary Pro access. Expires {expiry}.
          </p>
        </div>
        <a
          href="?tab=plans"
          className="shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
        >
          Manage Plan
        </a>
      </div>
    </div>
  );
}
