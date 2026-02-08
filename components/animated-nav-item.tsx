"use client";

import Link from "next/link";
import { forwardRef, useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  Icon: React.ComponentType<{
    className?: string;
    size?: number;
  }>;
  onClick?: () => void;
  className?: string;
}

export const AnimatedNavItem = forwardRef<
  HTMLAnchorElement,
  AnimatedNavItemProps
>(({ href, label, isActive, Icon, onClick, className }, ref) => {
  const iconContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    // Trigger animation by simulating mouse enter on the icon
    const iconElement =
      iconContainerRef.current?.querySelector("svg")?.parentElement;

    if (iconElement) {
      const mouseEvent = new MouseEvent("mouseenter", { bubbles: true });

      iconElement.dispatchEvent(mouseEvent);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Trigger animation stop by simulating mouse leave on the icon
    const iconElement =
      iconContainerRef.current?.querySelector("svg")?.parentElement;

    if (iconElement) {
      const mouseEvent = new MouseEvent("mouseleave", { bubbles: true });

      iconElement.dispatchEvent(mouseEvent);
    }
  }, []);

  return (
    <Link
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 font-mono text-sm rounded-lg group relative overflow-hidden",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "text-foreground hover:bg-muted hover:text-primary hover:translate-x-0.5",
        className,
      )}
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle hover background effect */}
      {!isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}

      <div ref={iconContainerRef} className="relative z-10">
        <Icon className="h-5 w-5 flex-shrink-0" size={20} />
      </div>
      <span className="relative z-10">{label}</span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
      )}
    </Link>
  );
});

AnimatedNavItem.displayName = "AnimatedNavItem";
