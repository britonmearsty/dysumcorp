import { Building2 } from "lucide-react";
import { LogoDisplay } from "@/components/logo-display";

interface PortalHeaderProps {
  name: string;
  logoUrl?: string | null;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  welcomeMessage?: string | null;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  gradientEnabled?: boolean;
}

export function PortalHeader({
  name,
  logoUrl,
  companyWebsite,
  companyEmail,
  welcomeMessage,
  primaryColor,
  secondaryColor,
  textColor,
  gradientEnabled = true,
}: PortalHeaderProps) {
  const gradientStyle =
    gradientEnabled && secondaryColor
      ? {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }
      : { backgroundColor: primaryColor };

  // Split welcome message into title and description
  const messageParts =
    welcomeMessage?.split("\n").filter((line) => line.trim()) || [];
  const messageTitle = messageParts[0] || "";
  const messageDescription = messageParts.slice(1).join(" ") || "";

  const formatWebsiteHref = (website: string) => {
    const trimmed = website.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <header className="w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 flex items-center gap-3 sm:gap-4">
        {logoUrl ? (
          <div className="p-1 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-black/5">
            <LogoDisplay
              logoUrl={logoUrl}
              alt={name}
              size="sm"
              className="shrink-0 sm:hidden"
            />
            <LogoDisplay
              logoUrl={logoUrl}
              alt={name}
              size="md"
              className="shrink-0 hidden sm:block"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shrink-0 shadow-lg relative overflow-hidden group"
            style={gradientStyle}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2
            className="font-black text-lg sm:text-xl tracking-tight leading-none"
            style={{ color: textColor }}
          >
            {name}
          </h2>
          {(companyWebsite || companyEmail) && (
            <div
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] mt-1 sm:mt-1.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 opacity-70"
              style={{ color: primaryColor }}
            >
              {companyWebsite && (
                <a
                  href={formatWebsiteHref(companyWebsite)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="break-all hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                >
                  {companyWebsite}
                </a>
              )}
              {companyWebsite && companyEmail && (
                <span className="hidden sm:inline opacity-30">|</span>
              )}
              {companyEmail && (
                <a
                  href={`mailto:${companyEmail.trim()}`}
                  className="break-all hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
                >
                  {companyEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {welcomeMessage && (
        <div 
          className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-black/5"
          style={{ backgroundColor: `${primaryColor}05` }}
        >
          {messageTitle && (
            <p
              className="text-sm sm:text-base font-bold pt-3 sm:pt-4"
              style={{ color: textColor }}
            >
              {messageTitle}
            </p>
          )}
          {messageDescription && (
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed opacity-80">{messageDescription}</p>
          )}
        </div>
      )}
    </header>
  );
}
