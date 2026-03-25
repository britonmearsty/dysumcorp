"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Zap } from "lucide-react";

export interface TrialBannerProps {
  daysRemaining?: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const isWarning = daysRemaining !== undefined && daysRemaining <= 3;

  if (isWarning) {
    return (
      <div className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1800px] py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">
              {daysRemaining === 0
                ? "Your trial expires today."
                : daysRemaining === 1
                  ? "Your trial expires in 1 day."
                  : daysRemaining !== undefined
                    ? `Your trial expires in ${daysRemaining} days.`
                    : "Your trial is ending soon."}
            </span>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Subscribe now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1800px] py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-sm">
            {daysRemaining !== undefined
              ? <><span className="font-medium">{daysRemaining} days</span> remaining in your free trial.</>
              : <span className="font-medium">Free trial active.</span>}
          </span>
        </div>
        <Link
          href="/dashboard/billing"
          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
        >
          <Zap className="w-3 h-3" />
          View plans
        </Link>
      </div>
    </div>
  );
}
