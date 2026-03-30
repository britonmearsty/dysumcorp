import { Building2 } from "lucide-react";

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
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="px-6 pt-5 pb-4 flex items-center gap-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 overflow-hidden"
          style={logoUrl ? {} : gradientStyle}
        >
          {logoUrl ? (
            <img
              alt={name}
              className="w-full h-full object-contain"
              src={logoUrl}
            />
          ) : (
            <Building2 className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="font-bold text-xl tracking-tight"
            style={{ color: textColor }}
          >
            {name}
          </h2>
          {(companyWebsite || companyEmail) && (
            <div
              className="text-sm font-medium mt-0.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1"
              style={{ color: primaryColor }}
            >
              {companyWebsite && (
                <span className="break-all">{companyWebsite}</span>
              )}
              {companyWebsite && companyEmail && (
                <span className="hidden sm:inline">·</span>
              )}
              {companyEmail && (
                <span className="break-all">{companyEmail}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {welcomeMessage && (
        <div className="px-6 pb-5 border-t border-slate-100 bg-slate-50">
          {messageTitle && (
            <p
              className="text-base font-medium pt-4"
              style={{ color: textColor }}
            >
              {messageTitle}
            </p>
          )}
          {messageDescription && (
            <p className="text-slate-500 text-sm mt-1">{messageDescription}</p>
          )}
        </div>
      )}
    </header>
  );
}
