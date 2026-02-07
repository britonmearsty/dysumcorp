"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { usePaywall } from "@/components/paywall-modal";
import { PlanType } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
  };
}

export default function PortalsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showPaywall, PaywallModal } = usePaywall();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<PlanType>("free");

  useEffect(() => {
    fetchPortals();
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/limits/portals");
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data.planType);
      }
    } catch (error) {
      console.error("Failed to fetch user plan:", error);
    }
  };

  const fetchPortals = async () => {
    try {
      const response = await fetch("/api/portals");

      if (response.ok) {
        const data = await response.json();

        setPortals(data.portals);
      }
    } catch (error) {
      console.error("Failed to fetch portals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/portals/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPortals(portals.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete portal");
      }
    } catch (error) {
      console.error("Failed to delete portal:", error);
      alert("Failed to delete portal");
    } finally {
      setDeleting(null);
    }
  };

  const handleCreatePortal = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/limits/portals");
      const data = await response.json();

      if (!data.allowed) {
        showPaywall(
          userPlan,
          "Portals",
          data.reason || "You've reached your portal limit.",
          "pro",
        );
        return;
      }

      router.push("/dashboard/portals/create");
    } catch (error) {
      console.error("Failed to check portal limit:", error);
      // Still allow navigation if check fails
      router.push("/dashboard/portals/create");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-mono">Portals</h1>
          <p className="text-muted-foreground mt-2">Loading your portals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Portals</h1>
          <p className="text-muted-foreground mt-2">
            Manage your client portals
          </p>
        </div>
        <Button
          className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
          onClick={handleCreatePortal}
        >
          <Plus className="w-4 h-4 mr-2" />
          CREATE PORTAL
        </Button>
      </div>

      {portals.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-mono font-semibold text-lg mb-2">
            No portals yet
          </h3>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Create your first client portal to start collecting files securely
          </p>
          <Button
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            onClick={handleCreatePortal}
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE FIRST PORTAL
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <div
              key={portal.id}
              className="border rounded-lg p-6 hover:border-[#FF6B2C] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-mono font-semibold text-lg mb-1">
                    {portal.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    /{portal.slug}
                  </p>
                  {portal.customDomain && (
                    <p className="text-xs text-[#FF6B2C] font-mono mt-1">
                      {portal.customDomain}
                    </p>
                  )}
                </div>
                {portal.whiteLabeled && (
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    White-labeled
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-mono font-medium">
                    {portal._count.files}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-mono">
                    {formatDate(portal.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-none font-mono"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/portal/${portal.slug}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  VIEW
                </Button>
                <Button
                  className="rounded-none font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={deleting === portal.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(portal.id, portal.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal />
    </div>
  );
}
