"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
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
          <h3 className="font-mono font-semibold">Theme</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred color scheme
          </p>
        </div>
        <Chip className="font-mono" color="primary" size="sm" variant="flat">
          {themeOptions.find((opt) => opt.value === theme)?.label || "System"}
        </Chip>
      </div>

      <Card className="border-border/50">
        <CardBody className="p-3 space-y-2">
          {themeOptions.map((option) => {
            const isActive = theme === option.value;

            return (
              <Button
                key={option.value}
                className={cn(
                  "w-full justify-start gap-3 h-14 rounded-lg transition-all duration-200",
                  "hover:bg-default-100 dark:hover:bg-default-50",
                  isActive && "bg-primary/10 text-primary dark:bg-primary/20",
                )}
                variant="light"
                onClick={() => setTheme(option.value)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-default-100 dark:bg-default-200">
                  {option.icon}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            );
          })}
        </CardBody>
      </Card>

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
      className="p-2 rounded-lg transition-all duration-200 hover:bg-default-100 dark:hover:bg-default-800"
      onClick={() => setTheme(isDark ? "light" : isDark ? "system" : "dark")}
    >
      {isDark ? (
        <SunFilledIcon className="text-default-600" size={20} />
      ) : (
        <MoonFilledIcon className="text-default-600" size={20} />
      )}
    </button>
  );
}
