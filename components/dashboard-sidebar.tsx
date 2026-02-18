"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { AnimatedNavItem } from "@/components/animated-nav-item";

// Animated Icons
import { HomeIcon } from "@/components/ui/home";
import { BlocksIcon } from "@/components/ui/blocks";
import { BoxIcon } from "@/components/ui/box";
import { UserIcon } from "@/components/ui/user";
import { GaugeIcon } from "@/components/ui/gauge";
import { CircleDollarSignIcon } from "@/components/ui/circle-dollar-sign";
import { CircleHelpIcon } from "@/components/ui/circle-help";
import { SettingsIcon } from "@/components/ui/settings";
import { MenuIcon } from "@/components/ui/menu";
import { XIcon } from "@/components/ui/x";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const navItems: NavItem[] = [
  { label: "OVERVIEW", href: "/dashboard", icon: HomeIcon },
  { label: "PORTALS", href: "/dashboard/portals", icon: BlocksIcon },
  { label: "ASSETS", href: "/dashboard/assets", icon: BoxIcon },
  { label: "CLIENTS", href: "/dashboard/clients", icon: UserIcon },
  { label: "STORAGE", href: "/dashboard/storage", icon: GaugeIcon },
  { label: "BILLING", href: "/dashboard/billing", icon: CircleDollarSignIcon },
  { label: "SUPPORT", href: "/dashboard/support", icon: CircleHelpIcon },
  { label: "SETTINGS", href: "/dashboard/settings", icon: SettingsIcon },
];

function UserAccountSection({
  onClose,
  isCollapsed,
}: {
  onClose: () => void;
  isCollapsed: boolean;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className={cn("px-4 py-3 animate-pulse", isCollapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-muted" />
          {!isCollapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-32" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const avatarElement = user?.image ? (
    <Image
      alt={user.name || "User"}
      className="rounded-full ring-2 ring-primary/20"
      height={44}
      src={user.image}
      width={44}
    />
  ) : (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20">
      <span className="text-white text-sm font-mono font-bold">
        {initials}
      </span>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="space-y-3 p-2">
        <Tooltip
          content={
            <div className="px-1 py-0.5">
              <p className="text-sm font-mono font-semibold">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {user?.email || "No email"}
              </p>
            </div>
          }
          placement="right"
        >
          <div className="flex items-center justify-center cursor-pointer">
            {avatarElement}
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {/* User Info Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-sidebar-border/50">
        {avatarElement}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold text-foreground truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {user?.email || "No email"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        className="lg:hidden fixed top-4 left-4 z-50 bg-sidebar/80 backdrop-blur-sm border border-sidebar-border/50 shadow-lg"
        size="icon"
        variant="outline"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          role="button"
          tabIndex={0}
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-sidebar backdrop-blur-sm border-r border-sidebar-border/30 transition-all duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-16 lg:w-16" : "w-72",
        )}
      >
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div
            className={cn(
              "flex items-center gap-3 px-6 py-6 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm transition-all duration-300",
              isCollapsed && "px-3 justify-center",
            )}
          >
            <div className="relative">
              <Image
                alt="Dysumcorp Logo"
                className="transition-transform duration-200 hover:scale-105"
                height={36}
                src="/logo.svg"
                style={{ width: "auto", height: "auto" }}
                width={36}
              />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md -z-10" />
            </div>
            <span
              className={cn(
                "font-mono text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent transition-all duration-300",
                isCollapsed
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100 w-auto",
              )}
            >
              Dysumcorp
            </span>
          </div>

          {/* Toggle Button - Desktop only */}
          <Button
            className={cn(
              "hidden lg:flex absolute -right-3 top-20 z-50 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border/50 shadow-md hover:bg-muted transition-all duration-200 p-0 items-center justify-center",
            )}
            size="icon"
            variant="ghost"
            onClick={toggleCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <AnimatedNavItem
                  key={item.href}
                  Icon={Icon}
                  href={item.href}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  label={item.label}
                  onClick={() => setIsMobileOpen(false)}
                />
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
            <UserAccountSection
              isCollapsed={isCollapsed}
              onClose={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
