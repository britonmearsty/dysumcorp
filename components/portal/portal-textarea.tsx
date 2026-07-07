import { TextareaHTMLAttributes } from "react";

interface PortalTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  primaryColor: string;
  textColor: string;
  cardBackgroundColor?: string;
  required?: boolean;
}

export function PortalTextarea({
  label,
  primaryColor,
  textColor,
  cardBackgroundColor = "#ffffff",
  required = false,
  className = "",
  ...props
}: PortalTextareaProps) {
  const inputBg = `${cardBackgroundColor}E6`;
  return (
    <div>
      <label
        className="block text-xs mb-2 font-black uppercase tracking-widest opacity-60"
        style={{ color: textColor }}
      >
        {label}
        {!required && (
          <span className="text-slate-400 font-normal ml-1 lowercase italic">(optional)</span>
        )}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        className={`w-full rounded-xl px-4 py-3.5 placeholder-slate-400 outline-none border transition-all resize-none text-sm ${className}`}
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
