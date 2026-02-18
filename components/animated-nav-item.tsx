"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import { Tooltip } from "@heroui/tooltip";

import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
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
>(({ href, label, isActive, isCollapsed, Icon, onClick, className }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const linkContent = (
    <Link
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-5 py-3 my-0.5 transition-all duration-200 font-mono text-[0.85rem] rounded-md group relative",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        isCollapsed && "px-2 justify-center",
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
            "h-[22px] w-[22px] flex-shrink-0 transition-colors duration-200",
            isActive
              ? "text-primary"
              : isHovered
                ? "text-foreground"
                : "text-muted-foreground",
          )}
          isHovered={isHovered || isActive}
          size={22}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10 transition-all duration-200",
          isActive
            ? "text-foreground font-semibold"
            : isHovered
              ? "text-foreground"
              : "text-muted-foreground",
          isCollapsed
            ? "opacity-0 w-0 overflow-hidden"
            : "opacity-100 w-auto",
        )}
      >
        {label}
      </span>

      {/* Active indicator - left border */}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r-full" />
      )}

      {/* Active indicator - dot for collapsed state */}
      {isActive && isCollapsed && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} placement="right">
        {linkContent}
      </Tooltip>
    );
  }

  return linkContent;
});

AnimatedNavItem.displayName = "AnimatedNavItem";
