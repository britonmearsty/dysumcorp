"use client";

import {
  FolderOpen,
  FileText,
  Plus,
  Upload,
  Share2,
  ExternalLink,
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
  const [stats, setStats] = useState({
    activePortals: 0,
    totalFilesReceived: 0,
    recentActivityCount: 0,
  });
  const [activePortalsList, setActivePortalsList] = useState<Portal[]>([]);
  const [recentActivities, setRecentActivities] = useState<FileData[]>([]);

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
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-mono font-bold">OVERVIEW</h1>
        <p className="text-muted-foreground font-mono mt-2">
          Welcome back, {session?.user?.name || "User"}!
        </p>
      </div>

      {/* Total Portals Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border bg-background p-6 hover:border-rgba(51,65,85,0.5) transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                ACTIVE PORTALS
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {stats.activePortals}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Currently running
              </p>
            </div>
            <div className="w-12 h-12 bg-rgba(51,65,85,0.1) flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-[#334155]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-rgba(51,65,85,0.5) transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                FILES RECEIVED
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {stats.totalFilesReceived}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Across all portals
              </p>
            </div>
            <div className="w-12 h-12 bg-rgba(51,65,85,0.1) flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#334155]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-rgba(51,65,85,0.5) transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                RECENT FILES
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {stats.recentActivityCount}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Uploaded in last 24h
              </p>
            </div>
            <div className="w-12 h-12 bg-rgba(51,65,85,0.1) flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[#334155]" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Client Portals - Takes 2 columns */}
        <div className="lg:col-span-2 border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-mono font-bold">
              ACTIVE CLIENT PORTALS
            </h2>
            <Link href="/dashboard/portals">
              <Button
                className="rounded-none font-mono border-2"
                size="sm"
                variant="outline"
              >
                VIEW ALL <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {activePortalsList.length === 0 ? (
              <p className="text-muted-foreground font-mono">
                No active portals found.
              </p>
            ) : (
              activePortalsList.map((portal) => (
                <div
                  key={portal.id}
                  className="border border-border p-4 hover:border-rgba(51,65,85,0.5) transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-bold">{portal.name}</h3>
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-mono border border-green-500/20">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground mt-1">
                        Created{" "}
                        {new Date(portal.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-sm font-mono">
                          <FileText className="w-4 h-4 text-[#334155]" />
                          <span>{portal._count?.files || 0} files</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/portals/${portal.id}`}>
                      <Button
                        className="rounded-none font-mono"
                        size="sm"
                        variant="outline"
                      >
                        MANAGE
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="border border-border bg-background p-6">
          <h2 className="text-xl font-mono font-bold mb-6">QUICK ACTIONS</h2>
          <div className="space-y-3">
            <Link href="/dashboard/portals/create">
              <Button className="w-full rounded-none bg-[#334155] hover:bg-rgba(51,65,85,0.9) font-mono justify-start">
                <Plus className="mr-2 w-4 h-4" />
                CREATE NEW PORTAL
              </Button>
            </Link>
            <Link href="/dashboard/files">
              <Button
                className="w-full rounded-none font-mono border-2 justify-start"
                variant="outline"
              >
                <Upload className="mr-2 w-4 h-4" />
                MANAGE FILES
              </Button>
            </Link>
            <Link href="/dashboard/teams">
              <Button
                className="w-full rounded-none font-mono border-2 justify-start"
                variant="outline"
              >
                <Share2 className="mr-2 w-4 h-4" />
                MANAGE TEAM
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity (Files) */}
      <div className="border border-border bg-background p-6">
        <h2 className="text-xl font-mono font-bold mb-6">RECENT UPLOADS</h2>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground font-mono">
              No recent uploads.
            </p>
          ) : (
            recentActivities.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors px-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10">
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-mono font-medium">File uploaded</p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {file.portal.name} • {file.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-mono text-muted-foreground">
                  {formatDate(file.uploadedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
