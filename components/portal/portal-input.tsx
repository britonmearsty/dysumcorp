import { InputHTMLAttributes } from "react";

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  primaryColor: string;
  textColor: string;
  required?: boolean;
}

export function PortalInput({
  label,
  primaryColor,
  textColor,
  required = false,
  className = "",
  ...props
}: PortalInputProps) {
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
        className={`w-full rounded-xl px-4 py-3.5 placeholder-slate-400 outline-none border transition-all bg-white text-sm ${className}`}
        style={{
          color: textColor,
          borderColor: `${primaryColor}20`,
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = `${primaryColor}20`;
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.backgroundColor = "white";
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = primaryColor;
          e.currentTarget.style.boxShadow = `0 0 0 4px ${primaryColor}15`;
          e.currentTarget.style.backgroundColor = `${primaryColor}05`;
        }}
        {...props}
      />
    </div>
  );
}
