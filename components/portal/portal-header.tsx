"use client";

import { useState, useMemo } from "react";
import { Shield, Building2 } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary-url";

interface PortalHeaderProps {
  name: string;
  logoUrl?: string | null;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  primaryColor: string;
  textColor: string;
  secondaryColor?: string;
  gradientEnabled?: boolean;
}

export function PortalHeader({
  name,
  logoUrl,
  companyWebsite,
  companyEmail,
  primaryColor,
  textColor,
  secondaryColor,
  gradientEnabled = true,
}: PortalHeaderProps) {
  const [logoError, setLogoError] = useState(false);

  const optimizedLogoUrl = useMemo(
    () => logoUrl ? getOptimizedCloudinaryUrl(logoUrl, { width: 88 }) : null,
    [logoUrl],
  );

  const gradientStyle =
    gradientEnabled && secondaryColor
      ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
      : primaryColor;

  const formatWebsiteHref = (website: string) => {
    const trimmed = website.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <header className="relative z-10 w-full px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 sm:gap-4">
        {logoUrl && !logoError ? (
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-sm border border-black/5"
          >
            {optimizedLogoUrl?.endsWith(".svg") ? (
              <object
                className="w-full h-full pointer-events-none"
                data={optimizedLogoUrl}
                type="image/svg+xml"
                aria-label={name}
                onError={() => setLogoError(true)}
              >
                <img
                  alt={name}
                  className="w-full h-full object-contain p-1"
                  src={optimizedLogoUrl}
                  onError={() => setLogoError(true)}
                />
              </object>
            ) : (
              <img
                alt={name}
                className="w-full h-full object-contain p-1"
                src={optimizedLogoUrl ?? logoUrl}
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        ) : (
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl text-white shadow-sm shrink-0"
            style={{ background: gradientStyle }}
          >
            <Shield className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          </div>
        )}
        <div className="min-w-0">
          <span
            className="text-base sm:text-lg font-bold tracking-tight block truncate"
            style={{ color: textColor }}
          >
            {name}
          </span>
          {(companyWebsite || companyEmail) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {companyWebsite && (
                <a
                  href={formatWebsiteHref(companyWebsite)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline truncate max-w-[200px]"
                  style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                >
                  {companyWebsite}
                </a>
              )}
              {companyWebsite && companyEmail && (
                <span className="text-[10px] shrink-0" style={{ color: `${textColor}30` }}>|</span>
              )}
              {companyEmail && (
                <a
                  href={`mailto:${companyEmail.trim()}`}
                  className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline truncate"
                  style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                >
                  {companyEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
