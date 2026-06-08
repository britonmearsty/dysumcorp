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

  return (
    <header className="w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="px-6 pt-5 pb-4 flex items-center gap-4">
        {logoUrl ? (
          <div className="p-1 rounded-2xl bg-white shadow-sm border border-black/5">
            <LogoDisplay
              logoUrl={logoUrl}
              alt={name}
              size="md"
              className="shrink-0"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 shadow-lg relative overflow-hidden group"
            style={gradientStyle}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Building2 className="w-6 h-6 text-white relative z-10" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2
            className="font-black text-xl tracking-tight leading-none"
            style={{ color: textColor }}
          >
            {name}
          </h2>
          {(companyWebsite || companyEmail) && (
            <div
              className="text-[11px] font-black uppercase tracking-[0.15em] mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 opacity-70"
              style={{ color: primaryColor }}
            >
              {companyWebsite && (
                <span className="break-all hover:opacity-100 transition-opacity cursor-pointer">{companyWebsite}</span>
              )}
              {companyWebsite && companyEmail && (
                <span className="hidden sm:inline opacity-30">|</span>
              )}
              {companyEmail && (
                <span className="break-all hover:opacity-100 transition-opacity cursor-pointer">{companyEmail}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {welcomeMessage && (
        <div 
          className="px-6 pb-5 border-t border-black/5"
          style={{ backgroundColor: `${primaryColor}05` }}
        >
          {messageTitle && (
            <p
              className="text-base font-bold pt-4"
              style={{ color: textColor }}
            >
              {messageTitle}
            </p>
          )}
          {messageDescription && (
            <p className="text-slate-500 text-sm mt-1 leading-relaxed opacity-80">{messageDescription}</p>
          )}
        </div>
      )}
    </header>
  );
}
