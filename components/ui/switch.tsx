"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  loading?: boolean;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      checked,
      onCheckedChange,
      onClick,
      loading,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          ref={ref}
          checked={checked}
          className="sr-only peer"
          disabled={isDisabled}
          type="checkbox"
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) {
              onClick(e);
            }
          }}
          {...props}
        />
        <div
          className={cn(
            "relative w-12 h-7 rounded-full transition-all duration-300 border-2",
            checked
              ? "bg-emerald-500/20 border-emerald-500"
              : "bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600",
            isDisabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300",
              checked
                ? "bg-emerald-500 translate-x-5"
                : "bg-gray-500 dark:bg-gray-400",
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
