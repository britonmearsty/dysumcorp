"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";
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
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "OVERVIEW", href: "/dashboard", icon: Home },
  { label: "PORTALS", href: "/dashboard/portals", icon: LayoutGrid },
  { label: "ASSETS", href: "/dashboard/assets", icon: Package },
  { label: "CLIENTS", href: "/dashboard/clients", icon: UserCircle },
  { label: "STORAGE", href: "/dashboard/storage", icon: Database },
  { label: "BILLING", href: "/dashboard/billing", icon: CreditCard },
  { label: "SUPPORT", href: "/dashboard/support", icon: HelpCircle },
  { label: "TEAMS", href: "/dashboard/teams", icon: UsersRound },
  { label: "SETTINGS", href: "/dashboard/settings", icon: Settings },
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
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="px-3 space-y-2">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={40}
            height={40}
            className="rounded-full"
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
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 font-mono"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4" />
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
                </Link>
              );
            })}
          </nav>

          {/* Premium Banner and User section */}
          <div className="px-3 py-4 border-t border-border space-y-3">
            {/* Premium Banner */}
            <Link
              href="/dashboard/premium"
              onClick={() => setIsMobileOpen(false)}
              className="block mx-3 p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                  <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold font-mono text-yellow-700 dark:text-yellow-300">
                      GO PREMIUM
                    </h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500 text-white font-mono font-bold">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unlock advanced features and unlimited access
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-mono font-semibold text-yellow-700 dark:text-yellow-300">
                    <span>Learn more</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* User Account Info */}
            <UserAccountSection onClose={() => setIsMobileOpen(false)} />
          </div>
        </div>
      </aside>
    </>
  );
}
