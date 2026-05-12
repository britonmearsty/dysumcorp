"use client";

import { cn } from "@/lib/utils";

interface LogoDisplayProps {
  logoUrl?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBackground?: boolean;
  fallbackText?: string;
}

export function LogoDisplay({
  logoUrl,
  alt = "Logo",
  size = "md",
  className,
  showBackground = true,
  fallbackText,
}: LogoDisplayProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const paddingClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3", 
    xl: "p-4",
  };

  if (!logoUrl && !fallbackText) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        showBackground && "bg-white rounded-2xl border border-stone-100 shadow-sm",
        className
      )}
    >
      {logoUrl ? (
        <img
          alt={alt}
          className={cn(
            "w-full h-full object-contain",
            paddingClasses[size]
          )}
          src={logoUrl}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center text-xs font-bold text-stone-400 uppercase tracking-wider",
            paddingClasses[size]
          )}
        >
          {fallbackText}
        </div>
      )}
    </div>
  );
}
