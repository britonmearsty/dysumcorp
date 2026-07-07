"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

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
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  if (!logoUrl && !fallbackText) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden shrink-0",
        sizeClasses[size],
        showBackground && "bg-white rounded-xl border border-black/5 shadow-sm",
        className
      )}
    >
      {logoUrl && !imgError ? (
        <img
          alt={alt}
          className="w-full h-full object-contain p-1.5"
          src={logoUrl}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone-400">
          <Building2 className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
