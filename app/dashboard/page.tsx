"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Users, HardDrive, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-mono font-bold">OVERVIEW</h1>
          <p className="text-muted-foreground font-mono mt-2">
            Welcome back, {session?.user?.name || "User"}!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-muted-foreground">TOTAL PROJECTS</p>
                <p className="text-3xl font-mono font-bold mt-2">12</p>
              </div>
              <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-[#FF6B2C]" />
              </div>
            </div>
          </div>

          <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-muted-foreground">DOCUMENTS</p>
                <p className="text-3xl font-mono font-bold mt-2">48</p>
              </div>
              <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#FF6B2C]" />
              </div>
            </div>
          </div>

          <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-muted-foreground">TEAM MEMBERS</p>
                <p className="text-3xl font-mono font-bold mt-2">8</p>
              </div>
              <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#FF6B2C]" />
              </div>
            </div>
          </div>

          <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-muted-foreground">STORAGE USED</p>
                <p className="text-3xl font-mono font-bold mt-2">2.4 GB</p>
              </div>
              <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-[#FF6B2C]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-border bg-background p-6">
          <h2 className="text-xl font-mono font-bold mb-4">QUICK ACTIONS</h2>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono">
              CREATE NEW PROJECT <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
            <Button variant="outline" className="rounded-none font-mono border-2">
              UPLOAD DOCUMENTS
            </Button>
            <Button variant="outline" className="rounded-none font-mono border-2">
              INVITE TEAM MEMBER
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="border border-border bg-background p-6">
          <h2 className="text-xl font-mono font-bold mb-6">ACCOUNT INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-mono text-muted-foreground">NAME</p>
              <p className="font-mono font-medium mt-1">{session?.user?.name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">EMAIL</p>
              <p className="font-mono font-medium mt-1">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">USER ID</p>
              <p className="font-mono font-medium mt-1 text-sm">{session?.user?.id}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">ACCOUNT STATUS</p>
              <p className="font-mono font-medium mt-1 text-[#FF6B2C]">ACTIVE</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-border bg-background p-6">
          <h2 className="text-xl font-mono font-bold mb-6">RECENT ACTIVITY</h2>
          <div className="space-y-4">
            {[
              { action: "Uploaded document", item: "Q4_Report.pdf", time: "2 hours ago" },
              { action: "Created project", item: "Client Portal", time: "5 hours ago" },
              { action: "Invited team member", item: "john@example.com", time: "1 day ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-mono font-medium">{activity.action}</p>
                  <p className="text-sm font-mono text-muted-foreground">{activity.item}</p>
                </div>
                <p className="text-sm font-mono text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
