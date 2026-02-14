"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";

interface Portal {
  id: string;
  name: string;
  clientName?: string;
  createdAt: string;
  _count?: {
    files: number;
  };
}

interface FileData {
  id: string;
  name: string;
  uploadedAt: string;
  portal: {
    name: string;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good afternoon");
  const [stats, setStats] = useState({
    totalPortals: 0,
    activePortals: 0,
    totalFilesReceived: 0,
    recentActivityCount: 0,
  });
  const [activePortalsList, setActivePortalsList] = useState<Portal[]>([]);
  const [recentActivities, setRecentActivities] = useState<FileData[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [portalsRes, filesRes] = await Promise.all([
          fetch("/api/portals?limit=5"),
          fetch("/api/files?limit=5"),
        ]);

        if (portalsRes.ok && filesRes.ok) {
          const portalsData = await portalsRes.json();
          const filesData = await filesRes.json();

          const portals = portalsData.portals || [];
          const files = filesData.files || [];

          const fileCount = portals.reduce(
            (acc: number, p: any) => acc + (p._count?.files || 0),
            0,
          );

          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentFiles = files.filter(
            (f: any) => new Date(f.uploadedAt) > oneDayAgo,
          );

          setStats({
            totalPortals: portals.length,
            activePortals: portals.length,
            totalFilesReceived: fileCount,
            recentActivityCount: recentFiles.length,
          });

          setActivePortalsList(portals);
          setRecentActivities(files);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchData();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-bg-card rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            <div className="h-32 bg-bg-card rounded-xl" />
            <div className="h-32 bg-bg-card rounded-xl" />
            <div className="h-32 bg-bg-card rounded-xl" />
            <div className="h-32 bg-bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-6">
      {/* Header Section */}
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold text-text-white tracking-tight mb-2">
            {greeting}, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-text-muted">
            Manage your secure file collection and track client uploads in
            real-time.
          </p>
        </div>

        <Link
          className="flex items-center gap-1.5 bg-primary text-primary-foreground border-none rounded-[10px] px-5 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          href="/dashboard/portals/create"
        >
          <span className="text-lg font-medium">+</span> Create Portal
        </Link>
      </header>

      {/* Stats Grid - 4 columns */}
      <section className="grid grid-cols-4 gap-6 mb-12">
        {/* Total Portals */}
        <div className="bg-bg-card border border-border rounded-[14px] p-[22px_24px_24px]">
          <div className="w-9 h-9 mb-[18px]">
            <svg
              className="w-9 h-9 text-accent-blue"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-[0.8rem] text-text-muted font-medium mb-1.5 tracking-wide">
            Total Portals
          </p>
          <p className="text-[2rem] font-bold text-text-white leading-none">
            {stats.totalPortals}
          </p>
        </div>

        {/* Active Portals */}
        <div className="bg-bg-card border border-border rounded-[14px] p-[22px_24px_24px]">
          <div className="w-9 h-9 mb-[18px]">
            <svg
              className="w-9 h-9 text-accent-green"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-[0.8rem] text-text-muted font-medium mb-1.5 tracking-wide">
            Active Portals
          </p>
          <p className="text-[2rem] font-bold text-text-white leading-none">
            {stats.activePortals}
          </p>
        </div>

        {/* Files Received */}
        <div className="bg-bg-card border border-border rounded-[14px] p-[22px_24px_24px]">
          <div className="w-9 h-9 mb-[18px]">
            <svg
              className="w-9 h-9 text-accent-purple"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <p className="text-[0.8rem] text-text-muted font-medium mb-1.5 tracking-wide">
            Files Received
          </p>
          <p className="text-[2rem] font-bold text-text-white leading-none">
            {stats.totalFilesReceived}
          </p>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-card border border-border rounded-[14px] p-[22px_24px_24px]">
          <div className="w-9 h-9 mb-[18px]">
            <svg
              className="w-9 h-9 text-accent-yellow"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <p className="text-[0.8rem] text-text-muted font-medium mb-1.5 tracking-wide">
            Recent Activity
          </p>
          <p className="text-[2rem] font-bold text-text-white leading-none">
            {stats.recentActivityCount}
          </p>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[1fr_400px] gap-8 items-start">
        {/* Left Panel - Active Client Portals */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-text-white">
              Active Client Portals
            </span>
            <Link
              className="text-xs text-text-muted hover:text-text-white transition-colors flex items-center gap-1"
              href="/dashboard/portals"
            >
              View All Portals <span>→</span>
            </Link>
          </div>

          <div className="bg-bg-card border border-border rounded-[14px] flex flex-col items-center justify-center py-[72px] px-10 min-h-[380px] text-center">
            <svg
              className="w-14 h-14 mb-6 opacity-45"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className="text-[1.15rem] font-bold text-text-white mb-2.5">
              Build your first portal
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-[280px] mb-7">
              Start collecting files securely. It takes less than a minute to
              set up.
            </p>
            <Link href="/dashboard/portals/create">
              <button className="bg-primary text-primary-foreground border-none rounded-[10px] px-9 py-3 text-[0.9rem] font-bold cursor-pointer hover:opacity-90 transition-opacity">
                Create Portal
              </button>
            </Link>
          </div>
        </section>

        {/* Right Panel - Quick Actions + Recent Activity */}
        <aside className="flex flex-col gap-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-bold text-text-white mb-5">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                className="bg-bg-card border border-border rounded-[12px] p-[18px] cursor-pointer hover:bg-muted/60 hover:border-muted transition-all flex flex-col gap-2.5"
                href="/dashboard/portals/create"
              >
                <svg
                  className="w-[26px] h-[26px] text-accent-green"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="12" x2="12" y1="5" y2="19" />
                  <line x1="5" x2="19" y1="12" y2="12" />
                </svg>
                <span className="text-sm font-semibold text-text-white">
                  New Portal
                </span>
              </Link>

              <Link
                className="bg-bg-card border border-border rounded-[12px] p-[18px] cursor-pointer hover:bg-muted/60 hover:border-muted transition-all flex flex-col gap-2.5"
                href="/dashboard/portals"
              >
                <svg
                  className="w-[26px] h-[26px] text-accent-blue"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-semibold text-text-white">
                  All Portals
                </span>
              </Link>

              <Link
                className="bg-bg-card border border-border rounded-[12px] p-[18px] cursor-pointer hover:bg-muted/60 hover:border-muted transition-all flex flex-col gap-2.5"
                href="/dashboard/storage"
              >
                <svg
                  className="w-[26px] h-[26px] text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
                <span className="text-sm font-semibold text-text-white">
                  Storage
                </span>
              </Link>

              <Link
                className="bg-bg-card border border-border rounded-[12px] p-[18px] cursor-pointer hover:bg-muted/60 hover:border-muted transition-all flex flex-col gap-2.5"
                href="/dashboard/settings"
              >
                <svg
                  className="w-[26px] h-[26px] text-accent-yellow"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="text-sm font-semibold text-text-white">
                  Settings
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-base font-bold text-text-white">
                Recent Activity
              </span>
              <Link
                className="text-xs text-text-muted hover:text-text-white transition-colors"
                href="/dashboard/assets"
              >
                View All
              </Link>
            </div>
            <div className="bg-bg-card border border-border rounded-[12px] flex flex-col items-center justify-center py-14 px-6 min-h-[200px] text-center">
              <svg
                className="w-10 h-10 mb-4 opacity-40"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <h3 className="text-sm font-semibold text-text-sub mb-1.5">
                No recent activity detected.
              </h3>
              <p className="text-[0.78rem] text-text-muted leading-relaxed">
                Files uploaded to your portals will appear here.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
