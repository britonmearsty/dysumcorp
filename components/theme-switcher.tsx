"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Chip } from "@heroui/chip";

import { cn } from "@/lib/utils";
import {
  SunFilledIcon,
  MoonFilledIcon,
  SparklesIcon,
} from "@/components/icons";

type Theme = "light" | "dark" | "system";

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function ThemeSwitcher() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-lg bg-default-100" />
    );
  }

  const getCurrentTheme = () => {
    if (theme === "system") {
      return systemTheme || "light";
    }

    return theme || "light";
  };

  const themeOptions: ThemeOption[] = [
    {
      value: "light",
      label: "Light",
      description: "Clean and bright interface",
      icon: <SunFilledIcon size={20} />,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Easy on the eyes",
      icon: <MoonFilledIcon size={20} />,
    },
    {
      value: "system",
      label: "System",
      description: "Follow your device preference",
      icon: <SparklesIcon size={20} />,
    },
  ];

  const currentTheme = getCurrentTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono font-semibold text-foreground">Theme</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred color scheme
          </p>
        </div>
        <Chip className="font-mono" color="primary" size="sm" variant="flat">
          {themeOptions.find((opt) => opt.value === theme)?.label || "System"}
        </Chip>
      </div>

      <div className="bg-muted rounded-xl border border-border p-3 space-y-2">
        {themeOptions.map((option) => {
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              className={cn(
                "w-full justify-start gap-3 h-14 rounded-lg transition-all duration-200 flex items-center",
                "bg-transparent border border-transparent",
                "hover:bg-bg-card hover:border-border",
                isActive && "bg-bg-card border-border",
              )}
              onClick={() => setTheme(option.value)}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/10 text-muted-foreground",
                )}
              >
                {option.icon}
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-sm text-foreground">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
              {isActive && <div className="w-2 h-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        Current: {currentTheme === "light" ? "☀️ Light" : "🌙 Dark"}
        {theme === "system" &&
          ` (System: ${systemTheme === "light" ? "Light" : "Dark"})`}
      </div>
    </div>
  );
}

// Simple version for other places in the app
export function ThemeSwitch() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <button
      aria-label="Toggle theme"
      className="p-2 rounded-lg transition-all duration-200 hover:bg-muted border border-transparent hover:border-border"
      onClick={() => setTheme(isDark ? "light" : isDark ? "system" : "dark")}
    >
      {isDark ? (
        <SunFilledIcon className="text-foreground" size={20} />
      ) : (
        <MoonFilledIcon className="text-foreground" size={20} />
      )}
    </button>
  );
}
