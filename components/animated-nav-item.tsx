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
        "flex items-center gap-3 px-4 py-2.5 my-0.5 transition-all duration-200 font-mono text-sm rounded-md group relative",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
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
            "h-5 w-5 flex-shrink-0 transition-colors duration-200",
            isActive
              ? "text-primary"
              : isHovered
                ? "text-foreground"
                : "text-muted-foreground",
          )}
          size={20}
          isHovered={isHovered || isActive}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10 transition-colors duration-200",
          isActive
            ? "text-foreground font-semibold"
            : isHovered
              ? "text-foreground"
              : "text-muted-foreground",
        )}
      >
        {label}
      </span>

      {/* Active indicator - left border */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
      )}
    </Link>
  );
});

AnimatedNavItem.displayName = "AnimatedNavItem";
