"use client";

import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-main-bg">
      <DashboardSidebar />

      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
