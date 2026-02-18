"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";

import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  Icon: React.ComponentType<{
    className?: string;
    size?: number;
    isHovered?: boolean;
  }>;
  onClick?: () => void;
  className?: string;
}

export const AnimatedNavItem = forwardRef<
  HTMLAnchorElement,
  AnimatedNavItemProps
>(({ href, label, isActive, Icon, onClick, className }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 my-0.5 font-mono text-[0.85rem] rounded-lg group relative macos-nav-item-hover",
        isActive
          ? "macos-nav-item-active text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
        className,
      )}
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div className="relative z-10">
        <Icon
          className={cn(
            "h-[20px] w-[20px] flex-shrink-0 transition-colors duration-200",
            isActive
              ? "text-sidebar-primary"
              : isHovered
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/60",
          )}
          isHovered={isHovered || isActive}
          size={20}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10 transition-colors duration-200 tracking-wide",
          isActive
            ? "text-sidebar-foreground font-semibold"
            : isHovered
              ? "text-sidebar-foreground"
              : "text-sidebar-foreground/70",
        )}
      >
        {label}
      </span>

      {/* Active indicator - subtle dot on the right */}
      {isActive && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sidebar-primary rounded-full" />
      )}
    </Link>
  );
});

AnimatedNavItem.displayName = "AnimatedNavItem";
