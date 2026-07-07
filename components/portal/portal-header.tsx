import { Shield } from "lucide-react";
import { LogoDisplay } from "@/components/logo-display";

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
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <LogoDisplay
              logoUrl={logoUrl}
              alt={name}
              size="sm"
            />
            <div>
              <span
                className="text-lg sm:text-xl font-bold tracking-tight"
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
                      className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                      style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                    >
                      {companyWebsite}
                    </a>
                  )}
                  {companyWebsite && companyEmail && (
                    <span className="text-[10px]" style={{ color: `${textColor}30` }}>|</span>
                  )}
                  {companyEmail && (
                    <a
                      href={`mailto:${companyEmail.trim()}`}
                      className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                      style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                    >
                      {companyEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white shadow-sm shrink-0"
              style={{ background: gradientStyle }}
            >
              <Shield className="w-[18px] h-[18px]" />
            </div>
            <div>
              <span
                className="text-lg sm:text-xl font-bold tracking-tight"
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
                      className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                      style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                    >
                      {companyWebsite}
                    </a>
                  )}
                  {companyWebsite && companyEmail && (
                    <span className="text-[10px]" style={{ color: `${textColor}30` }}>|</span>
                  )}
                  {companyEmail && (
                    <a
                      href={`mailto:${companyEmail.trim()}`}
                      className="text-[11px] font-medium hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                      style={{ color: `${primaryColor}CC`, opacity: 0.7 }}
                    >
                      {companyEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
