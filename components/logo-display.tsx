"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary-url";

interface LogoDisplayProps {
  logoUrl?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBackground?: boolean;
  fallbackText?: string;
}

function getSizePx(size: string): number {
  switch (size) {
    case "sm": return 40;
    case "md": return 64;
    case "lg": return 80;
    case "xl": return 96;
    default: return 64;
  }
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

  const sizePx = getSizePx(size);
  const optimizedUrl = useMemo(
    () => logoUrl ? getOptimizedCloudinaryUrl(logoUrl, { width: sizePx * 2 }) : null,
    [logoUrl, sizePx],
  );

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
        optimizedUrl && optimizedUrl.endsWith(".svg") ? (
          <object
            className="w-full h-full pointer-events-none"
            data={optimizedUrl}
            type="image/svg+xml"
            aria-label={alt}
            onError={() => setImgError(true)}
          >
            <img
              alt={alt}
              className="w-full h-full object-contain p-1.5"
              src={optimizedUrl}
              onError={() => setImgError(true)}
            />
          </object>
        ) : (
          <img
            alt={alt}
            className="w-full h-full object-contain p-1.5"
            src={optimizedUrl ?? logoUrl}
            onError={() => setImgError(true)}
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone-400">
          <Building2 className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
