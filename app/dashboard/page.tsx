"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, X } from "lucide-react";

import { useSession } from "@/lib/auth-client";

interface Portal {
  id: string;
  name: string;
  slug: string;
  clientName?: string;
  createdAt: string;
  isActive: boolean;
  whiteLabeled: boolean;
  customDomain: string | null;
  updatedAt: string;
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
  const router = useRouter();
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
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [portalFiles, setPortalFiles] = useState<any[]>([]);

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

          // Filter only active portals for overview
          const activePortals = portals.filter((p: Portal) => p.isActive !== false);

          const fileCount = activePortals.reduce(
            (acc: number, p: any) => acc + (p._count?.files || 0),
            0,
          );

          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentFiles = files.filter(
            (f: any) => new Date(f.uploadedAt) > oneDayAgo,
          );

          setStats({
            totalPortals: activePortals.length,
            activePortals: activePortals.length,
            totalFilesReceived: fileCount,
            recentActivityCount: recentFiles.length,
          });

          setActivePortalsList(activePortals);
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

  const fetchPortalFiles = async (portalId: string) => {
    try {
      const response = await fetch(`/api/portals/${portalId}`);
      if (response.ok) {
        const data = await response.json();
        setPortalFiles(data.portal?.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch portal files:", error);
    }
  };

  const handlePortalClick = async (portal: Portal) => {
    setSelectedPortal(portal);
    setShowFilesModal(true);
    await fetchPortalFiles(portal.id);
  };

  const handleToggleActive = async (portalId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/portals/${portalId}/toggle-active`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the portals list
        const portalsRes = await fetch("/api/portals?limit=5");
        if (portalsRes.ok) {
          const portalsData = await portalsRes.json();
          const portals = portalsData.portals || [];
          const activePortals = portals.filter((p: Portal) => p.isActive !== false);
          setActivePortalsList(activePortals);
        }
      } else {
        alert("Failed to toggle portal status");
      }
    } catch (error) {
      console.error("Failed to toggle portal status:", error);
      alert("Failed to toggle portal status");
    }
  };

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

          {activePortalsList.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePortalsList.map((portal) => (
                <div
                  key={portal.id}
                  className="bg-bg-card border border-border rounded-[14px] p-6 hover:shadow-md transition-shadow"
                >
                  {/* Portal Name - Clickable to open files modal */}
                  <div
                    className="cursor-pointer mb-4 group"
                    onClick={() => handlePortalClick(portal)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-white text-base truncate group-hover:text-primary transition-colors">
                          {portal.name}
                        </h3>
                        <p className="text-xs text-text-muted truncate mt-1">
                          /{portal.slug}
                        </p>
                        {portal.customDomain && (
                          <p className="text-xs text-primary mt-1 truncate">
                            {portal.customDomain}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs px-2 py-1 rounded-md bg-accent-green/10 text-accent-green">
                          Active
                        </span>
                        {portal.whiteLabeled && (
                          <span className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Files</span>
                      <span className="font-medium flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        {portal._count?.files || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-xl font-medium text-xs h-8 px-3 border border-border hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/portal/${portal.slug}`;
                        navigator.clipboard.writeText(url);
                        alert("Portal link copied to clipboard!");
                      }}
                    >
                      Copy Link
                    </button>
                    <button
                      className="rounded-xl font-medium text-xs h-8 px-3 border border-border hover:bg-muted transition-colors"
                      onClick={(e) => handleToggleActive(portal.id, portal.isActive, e)}
                      title={portal.isActive ? "Deactivate Portal" : "Activate Portal"}
                    >
                      {portal.isActive ? (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" x2="9" y1="9" y2="15" />
                          <line x1="9" x2="15" y1="9" y2="15" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="rounded-xl font-medium text-xs h-8 px-3 border border-border hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/portal/${portal.slug}`);
                      }}
                      title="View Portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="rounded-xl font-medium text-xs h-8 px-3 border border-border hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/portals/${portal.id}/edit`);
                      }}
                      title="Edit Portal"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            {recentActivities.length === 0 ? (
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
            ) : (
              <div className="bg-bg-card border border-border rounded-[12px] overflow-hidden">
                <div className="divide-y divide-border">
                  {recentActivities.map((file: any) => (
                    <div
                      key={file.id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {file.portal?.name || "Unknown Portal"}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(file.uploadedAt).toLocaleDateString()} at{" "}
                            {new Date(file.uploadedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Portal Files Modal */}
      {showFilesModal && selectedPortal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">{selectedPortal.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {portalFiles.length} file{portalFiles.length !== 1 ? "s" : ""} uploaded
                </p>
              </div>
              <button
                className="rounded-xl p-2 hover:bg-muted transition-colors"
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedPortal(null);
                  setPortalFiles([]);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {portalFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portalFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {(Number(file.size) / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                          {file.uploaderName && (
                            <>
                              <span>•</span>
                              <span>{file.uploaderName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          {file.downloads || 0} downloads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
