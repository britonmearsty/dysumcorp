import { Shield } from "lucide-react";
import { LogoDisplay } from "@/components/logo-display";

interface PortalHeaderProps {
  name: string;
  logoUrl?: string | null;
  primaryColor: string;
  textColor: string;
  secondaryColor?: string;
  gradientEnabled?: boolean;
}

export function PortalHeader({
  name,
  logoUrl,
  primaryColor,
  textColor,
  secondaryColor,
  gradientEnabled = true,
}: PortalHeaderProps) {
  const gradientStyle =
    gradientEnabled && secondaryColor
      ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
      : primaryColor;

  return (
    <header className="relative z-10 w-full px-6 sm:px-8 py-6 sm:py-8 flex items-center justify-between max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <LogoDisplay
              logoUrl={logoUrl}
              alt={name}
              size="sm"
            />
            <span
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: textColor }}
            >
              {name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white shadow-sm"
              style={{ background: gradientStyle }}
            >
              <Shield className="w-[18px] h-[18px]" />
            </div>
            <span
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: textColor }}
            >
              {name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
