"use client";

interface EarlyAccessBannerProps {
  expiresAt: Date;
}

export function EarlyAccessBanner({ expiresAt }: EarlyAccessBannerProps) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
            You have Early Access — Pro features active until {expiresAt.toLocaleDateString()}
          </p>
        </div>
        <a
          href="?tab=plans"
          className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 underline"
        >
          Subscribe before it expires
        </a>
      </div>
    </div>
  );
}
