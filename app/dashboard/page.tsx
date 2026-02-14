"use client";

import {
  FolderOpen,
  FileText,
  Plus,
  Upload,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
          fetch("/api/portals"),
          fetch("/api/files"),
        ]);

        if (portalsRes.ok && filesRes.ok) {
          const portalsData = await portalsRes.json();
          const filesData = await filesRes.json();

          const portals = portalsData.portals || [];
          const files = filesData.files || [];

          // Calculate stats
          const fileCount = portals.reduce(
            (acc: number, p: any) => acc + (p._count?.files || 0),
            0,
          );

          // Get recent files (last 24h)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentFiles = files.filter(
            (f: any) => new Date(f.uploadedAt) > oneDayAgo,
          );

          setStats({
            activePortals: portals.length,
            totalFilesReceived: fileCount,
            recentActivityCount: recentFiles.length,
          });

          setActivePortalsList(portals.slice(0, 5));
          setRecentActivities(files.slice(0, 5));
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Return relative time if under 24h, else date
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
            {greeting}, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Manage your secure file collection and track client uploads in
            real-time.
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard/portals/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 active:scale-95 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Portal
          </Link>
        </nav>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <FolderOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {stats.activePortals}
            </p>
            <p className="text-sm text-muted-foreground">Active Portals</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/50">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {stats.totalFilesReceived}
            </p>
            <p className="text-sm text-muted-foreground">Files Received</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {stats.recentActivityCount}
            </p>
            <p className="text-sm text-muted-foreground">
              Recent Uploads (24h)
            </p>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Active Client Portals - Takes 2 columns */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Active Client Portals
            </h2>
            <Link
              href="/dashboard/portals"
              className="group flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              View All Portals
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePortalsList.length === 0 ? (
              <div className="col-span-2 bg-card rounded-xl p-12 border border-border text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">
                  No active portals found.
                </p>
              </div>
            ) : (
              activePortalsList.map((portal) => (
                <div
                  key={portal.id}
                  className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate mb-1">
                        {portal.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(portal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-50 text-green-600 dark:bg-green-950/50 text-xs font-medium rounded-md flex-shrink-0 ml-2">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{portal._count?.files || 0} files</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/portals/${portal.id}`}>
                    <Button
                      className="w-full rounded-xl font-medium"
                      size="sm"
                      variant="outline"
                    >
                      Manage Portal
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>

          {activePortalsList.length > 4 && (
            <Link
              href="/dashboard/portals"
              className="flex items-center justify-center py-4 bg-card rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm font-bold"
            >
              View {activePortalsList.length - 4} more portals
            </Link>
          )}
        </section>

        {/* Quick Actions & Recent Activity - Takes 1 column */}
        <aside className="lg:col-span-1 flex flex-col gap-8">
          {/* Quick Actions */}
          <nav className="space-y-4">
            <h2 className="text-sm font-bold text-foreground px-1">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard/portals/create" className="block">
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 font-medium justify-start">
                  <Plus className="mr-2 w-4 h-4" />
                  Create New Portal
                </Button>
              </Link>
              <Link href="/dashboard/assets" className="block">
                <Button
                  className="w-full rounded-xl font-medium justify-start"
                  variant="outline"
                >
                  <Upload className="mr-2 w-4 h-4" />
                  Manage Files
                </Button>
              </Link>
            </div>
          </nav>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-foreground">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/assets"
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No recent uploads.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivities.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 rounded-lg flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.portal.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
