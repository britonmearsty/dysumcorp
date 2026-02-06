"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Clock, Plus, Upload, Share2, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Mock data - replace with real data from your API
  const activePortals = [
    { id: 1, name: "Acme Corp Portal", client: "Acme Corporation", filesReceived: 12, lastActivity: "2 hours ago", status: "active" },
    { id: 2, name: "TechStart Portal", client: "TechStart Inc", filesReceived: 8, lastActivity: "5 hours ago", status: "active" },
    { id: 3, name: "Global Solutions", client: "Global Solutions Ltd", filesReceived: 15, lastActivity: "1 day ago", status: "active" },
  ];

  const recentActivities = [
    { action: "File uploaded", portal: "Acme Corp Portal", file: "Contract_2024.pdf", time: "2 hours ago", type: "upload" },
    { action: "Portal accessed", portal: "TechStart Portal", file: "Client logged in", time: "3 hours ago", type: "access" },
    { action: "File uploaded", portal: "Global Solutions", file: "Invoice_Jan.xlsx", time: "5 hours ago", type: "upload" },
    { action: "Portal created", portal: "New Client Portal", file: "Setup completed", time: "1 day ago", type: "create" },
    { action: "File uploaded", portal: "Acme Corp Portal", file: "Report_Q1.pdf", time: "1 day ago", type: "upload" },
  ];

  const totalActivePortals = activePortals.length;
  const totalFilesReceived = activePortals.reduce((sum, portal) => sum + portal.filesReceived, 0);
  const recentActivityCount = recentActivities.filter(a => a.time.includes("hours")).length;

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
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">ACTIVE PORTALS</p>
              <p className="text-3xl font-mono font-bold mt-2">{totalActivePortals}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Currently running</p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">FILES RECEIVED</p>
              <p className="text-3xl font-mono font-bold mt-2">{totalFilesReceived}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Across all portals</p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">RECENT ACTIVITY</p>
              <p className="text-3xl font-mono font-bold mt-2">{recentActivityCount}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">In the last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Client Portals - Takes 2 columns */}
        <div className="lg:col-span-2 border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-mono font-bold">ACTIVE CLIENT PORTALS</h2>
            <Link href="/dashboard/portals">
              <Button variant="outline" size="sm" className="rounded-none font-mono border-2">
                VIEW ALL <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {activePortals.map((portal) => (
              <div key={portal.id} className="border border-border p-4 hover:border-[#FF6B2C]/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold">{portal.name}</h3>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-mono border border-green-500/20">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground mt-1">{portal.client}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm font-mono">
                        <FileText className="w-4 h-4 text-[#FF6B2C]" />
                        <span>{portal.filesReceived} files</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{portal.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-none font-mono">
                    OPEN
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="border border-border bg-background p-6">
          <h2 className="text-xl font-mono font-bold mb-6">QUICK ACTIONS</h2>
          <div className="space-y-3">
            <Link href="/dashboard/portals">
              <Button className="w-full rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono justify-start">
                <Plus className="mr-2 w-4 h-4" />
                CREATE NEW PORTAL
              </Button>
            </Link>
            <Link href="/dashboard/storage">
              <Button variant="outline" className="w-full rounded-none font-mono border-2 justify-start">
                <Upload className="mr-2 w-4 h-4" />
                UPLOAD FILES
              </Button>
            </Link>
            <Link href="/dashboard/clients">
              <Button variant="outline" className="w-full rounded-none font-mono border-2 justify-start">
                <Share2 className="mr-2 w-4 h-4" />
                INVITE CLIENT
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border border-border bg-background p-6">
        <h2 className="text-xl font-mono font-bold mb-6">RECENT ACTIVITY</h2>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors px-2">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center ${
                  activity.type === 'upload' ? 'bg-blue-500/10' :
                  activity.type === 'access' ? 'bg-green-500/10' :
                  'bg-purple-500/10'
                }`}>
                  {activity.type === 'upload' ? <Upload className="w-5 h-5 text-blue-500" /> :
                   activity.type === 'access' ? <ExternalLink className="w-5 h-5 text-green-500" /> :
                   <Plus className="w-5 h-5 text-purple-500" />}
                </div>
                <div>
                  <p className="font-mono font-medium">{activity.action}</p>
                  <p className="text-sm font-mono text-muted-foreground">{activity.portal} • {activity.file}</p>
                </div>
              </div>
              <p className="text-sm font-mono text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
