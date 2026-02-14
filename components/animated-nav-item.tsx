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
        "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 font-mono text-sm rounded-lg group relative",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "text-foreground hover:bg-muted/60 hover:text-primary",
        className,
      )}
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover/Active background */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-all duration-200",
          isActive
            ? "bg-primary"
            : "bg-gradient-to-r from-primary/5 to-primary/5 group-hover:from-primary/10 group-hover:to-primary/5",
        )}
      />

      {/* Icon */}
      <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
        <Icon
          className="h-5 w-5 flex-shrink-0"
          size={20}
          isHovered={isHovered || isActive}
        />
      </div>

      {/* Label */}
      <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
      )}
    </Link>
  );
});

AnimatedNavItem.displayName = "AnimatedNavItem";
