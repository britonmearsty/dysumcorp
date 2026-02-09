"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface CustomDropdownProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 text-sm",
          "bg-background border-2 border-border",
          "transition-colors duration-200",
          "hover:border-[#FF6B2C]",
          "focus:outline-none focus:border-[#FF6B2C]",
          "font-mono",
        )}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span
            className={cn(
              value && value !== "all"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border overflow-hidden">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm",
                  "transition-colors duration-150",
                  "hover:bg-[#FF6B2C]/10 hover:border-l-2 hover:border-[#FF6B2C]",
                  "focus:outline-none focus:bg-[#FF6B2C]/10",
                  "font-mono",
                  value === option.value &&
                    "bg-[#FF6B2C]/10 text-[#FF6B2C] font-medium border-l-2 border-[#FF6B2C]",
                )}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
                {value === option.value && (
                  <Check className="w-4 h-4 text-[#FF6B2C]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
