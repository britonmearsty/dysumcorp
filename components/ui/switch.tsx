"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  loading?: boolean;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onClick, loading, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          ref={ref}
          checked={checked}
          className="sr-only peer"
          type="checkbox"
          disabled={isDisabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          onClick={(e) => {
            if (onClick) {
              onClick(e);
            }
          }}
          {...props}
        />
        <div
          className={cn(
            "w-11 h-6 rounded-full border-2 transition-all duration-200",
            checked
              ? "bg-emerald-500 border-emerald-500"
              : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
            isDisabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <div
            className={cn(
              "absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200",
              checked && "translate-x-5",
            )}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
