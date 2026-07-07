import { InputHTMLAttributes } from "react";

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  primaryColor: string;
  textColor: string;
  cardBackgroundColor?: string;
  required?: boolean;
}

export function PortalInput({
  label,
  primaryColor,
  textColor,
  cardBackgroundColor = "#ffffff",
  required = false,
  className = "",
  ...props
}: PortalInputProps) {
  const inputBg = `${cardBackgroundColor}E6`;
  return (
    <div>
      <label
        className="block text-xs mb-2 font-black uppercase tracking-widest opacity-60"
        style={{ color: textColor }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        className={`w-full rounded-xl px-4 py-3.5 placeholder-slate-400 outline-none border transition-all text-sm ${className}`}
        style={{
          color: textColor,
          borderColor: `${primaryColor}20`,
          backgroundColor: inputBg,
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = `${primaryColor}20`;
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.backgroundColor = inputBg;
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = primaryColor;
          e.currentTarget.style.boxShadow = `0 0 0 4px ${primaryColor}15`;
          e.currentTarget.style.backgroundColor = `${cardBackgroundColor}F2`;
        }}
        {...props}
      />
    </div>
  );
}
