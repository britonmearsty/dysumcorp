import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  primaryColor: string;
  secondaryColor?: string;
  gradientEnabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function PortalButton({
  children,
  primaryColor,
  secondaryColor,
  gradientEnabled = true,
  loading = false,
  icon,
  disabled,
  className = "",
  ...props
}: PortalButtonProps) {
  const gradientStyle =
    gradientEnabled && secondaryColor
      ? {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }
      : { backgroundColor: primaryColor };

  return (
    <button
      className={`w-full rounded-full py-3 px-6 text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold tracking-tight shadow-sm ${className}`}
      disabled={disabled || loading}
      style={{
        ...gradientStyle,
        boxShadow: `0 4px 16px ${primaryColor}30`,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
