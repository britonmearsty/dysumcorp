"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Home,
  BarChart3,
  FileText,
  Settings,
  Users,
  Folder,
  Menu,
  X,
  LayoutGrid,
  Package,
  UserCircle,
  Database,
  CreditCard,
  HelpCircle,
  UsersRound,
  Crown,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPremium?: boolean;
}

const navItems: NavItem[] = [
  { label: "OVERVIEW", href: "/dashboard", icon: Home },
  { label: "PORTALS", href: "/dashboard/portals", icon: LayoutGrid },
  { label: "ASSETS", href: "/dashboard/assets", icon: Package },
  { label: "CLIENTS", href: "/dashboard/clients", icon: UserCircle },
  { label: "STORAGE", href: "/dashboard/storage", icon: Database },
  { label: "PREMIUM", href: "/dashboard/premium", icon: Crown, isPremium: true },
  { label: "BILLING", href: "/dashboard/billing", icon: CreditCard },
  { label: "SUPPORT", href: "/dashboard/support", icon: HelpCircle },
  { label: "TEAMS", href: "/dashboard/teams", icon: UsersRound },
  { label: "SETTINGS", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-border">
            <Image
              src="/logo.svg"
              alt="Dysumcorp Logo"
              width={32}
              height={32}
            />
            <span className="font-mono text-xl font-bold">Dysumcorp</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors font-mono text-sm rounded-lg relative",
                    isActive
                      ? "bg-[#FF6B2C] text-white font-medium"
                      : "text-foreground hover:bg-muted hover:text-[#FF6B2C]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.isPremium && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
                <span className="text-[#FF6B2C] text-sm font-mono font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium truncate">User Account</p>
                <p className="text-xs text-muted-foreground font-mono truncate">View profile</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
