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
        className="block text-sm mb-1.5 font-semibold"
        style={{ color: textColor }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        className={`w-full rounded-xl px-4 py-3 placeholder-slate-400 outline-none border border-slate-200 transition-all bg-white focus:ring-2 ${className}`}
        style={{
          color: textColor,
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = `${primaryColor}66`;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}1A`;
        }}
        {...props}
      />
    </div>
  );
}
