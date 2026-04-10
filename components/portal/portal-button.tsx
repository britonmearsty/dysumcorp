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
      className={`w-full rounded-xl py-3.5 text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base ${className}`}
      disabled={disabled || loading}
      style={{
        ...gradientStyle,
        boxShadow: `0 2px 12px ${primaryColor}4D`,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
