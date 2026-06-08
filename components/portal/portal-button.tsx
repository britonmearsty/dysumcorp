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
      className={`w-full rounded-2xl py-4 text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-black text-base uppercase tracking-wider group relative overflow-hidden ${className}`}
      disabled={disabled || loading}
      style={{
        ...gradientStyle,
        boxShadow: `0 8px 30px ${primaryColor}4D`,
      }}
      {...props}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="group-hover:translate-x-0.5 transition-transform">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
