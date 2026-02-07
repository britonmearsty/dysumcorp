"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";

// Animated Icons
import { HomeIcon } from "@/components/ui/home";
import { BlocksIcon } from "@/components/ui/blocks";
import { FileTextIcon } from "@/components/ui/file-text";
import { BoxIcon } from "@/components/ui/box";
import { UserIcon } from "@/components/ui/user";
import { GaugeIcon } from "@/components/ui/gauge";
import { CircleDollarSignIcon } from "@/components/ui/circle-dollar-sign";
import { CircleHelpIcon } from "@/components/ui/circle-help";
import { UsersIcon } from "@/components/ui/users";
import { SettingsIcon } from "@/components/ui/settings";
import { MenuIcon } from "@/components/ui/menu";
import { XIcon } from "@/components/ui/x";
import { LogoutIcon } from "@/components/ui/logout";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const navItems: NavItem[] = [
  { label: "OVERVIEW", href: "/dashboard", icon: HomeIcon },
  { label: "PORTALS", href: "/dashboard/portals", icon: BlocksIcon },
  { label: "FILES", href: "/dashboard/files", icon: FileTextIcon },
  { label: "ASSETS", href: "/dashboard/assets", icon: BoxIcon },
  { label: "CLIENTS", href: "/dashboard/clients", icon: UserIcon },
  { label: "STORAGE", href: "/dashboard/storage", icon: GaugeIcon },
  { label: "BILLING", href: "/dashboard/billing", icon: CircleDollarSignIcon },
  { label: "SUPPORT", href: "/dashboard/support", icon: CircleHelpIcon },
  { label: "TEAMS", href: "/dashboard/teams", icon: UsersIcon },
  { label: "SETTINGS", href: "/dashboard/settings", icon: SettingsIcon },
];

function UserAccountSection({ onClose }: { onClose: () => void }) {
  const { data: session, isPending } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    onClose();
  };

  if (isPending) {
    return (
      <div className="px-3 py-2 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-2 bg-muted rounded w-32" />
          </div>
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

  return (
    <div className="px-3 space-y-2">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
        {user?.image ? (
          <Image
            alt={user.name || "User"}
            className="rounded-full"
            height={40}
            src={user.image}
            width={40}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
            <span className="text-[#FF6B2C] text-sm font-mono font-bold">
              {initials}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {user?.email || "No email"}
          </p>
        </div>
      </div>

      <Button
        className="w-full justify-start gap-2 font-mono"
        disabled={isLoggingOut}
        size="sm"
        variant="outline"
        onClick={handleLogout}
      >
        <LogoutIcon className="h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        className="lg:hidden fixed top-4 left-4 z-50"
        size="icon"
        variant="ghost"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <XIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsMobileOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
            <Image
              alt="Dysumcorp Logo"
              height={32}
              src="/logo.svg"
              width={32}
            />
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors font-mono text-sm rounded-lg relative group",
                    isActive
                      ? "bg-[#FF6B2C] text-white font-medium"
                      : "text-foreground hover:bg-muted hover:text-[#FF6B2C]",
                  )}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="h-5 w-5" size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-border">
            <UserAccountSection onClose={() => setIsMobileOpen(false)} />
          </div>
        </div>
      </aside>
    </>
  );
}
