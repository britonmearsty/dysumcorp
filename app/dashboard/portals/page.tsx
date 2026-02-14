"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Upload,
  X,
  Search,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProgressiveLimitWarning } from "@/components/progressive-limit-warning";
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

interface FileUploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface SoftLimitResponse {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  percentage: number;
  softLimitLevel: "normal" | "warning" | "critical" | "exceeded";
  canProceed: boolean;
  requiresUpgrade: boolean;
  graceUsed?: number;
  graceTotal?: number;
  recommendation?: {
    suggestedPlan: PlanType;
    message: string;
  };
}

export default function PortalsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [searchQuery, setSearchQuery] = useState("");
  const [limitStatus, setLimitStatus] = useState<SoftLimitResponse | null>(
    null,
  );
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadProgress[]>(
    [],
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchPortals();
    fetchUserPlan();
    fetchLimitStatus();
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

  const fetchLimitStatus = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/limits/portals/soft");

      if (response.ok) {
        const data: SoftLimitResponse = await response.json();

        setLimitStatus(data);

        // Show warning if we're at warning level or above
        if (data.softLimitLevel !== "normal") {
          setShowLimitWarning(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch limit status:", error);
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
        // Refresh limit status after deletion
        await fetchLimitStatus();
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

    // Get current limit status
    try {
      const response = await fetch("/api/limits/portals/soft");
      const data: SoftLimitResponse = await response.json();

      // If we can't proceed (hard limit exceeded), show gentle upgrade prompt
      if (!data.canProceed) {
        const shouldUpgrade = confirm(
          `You've reached your ${data.current}/${data.limit} portal limit. Would you like to upgrade your plan to continue?`,
        );

        if (shouldUpgrade) {
          router.push("/dashboard/billing");
        }

        return;
      }

      // If we're in a warning state, proceed but show context
      if (
        data.softLimitLevel === "warning" ||
        data.softLimitLevel === "critical"
      ) {
        const confirmed = confirm(
          `You're using ${data.current}/${data.limit} portals (${Math.round(data.percentage)}%). You can create another portal, but consider upgrading soon to avoid interruptions. Continue?`,
        );

        if (!confirmed) {
          return;
        }
      }

      // If we're in grace period (exceeded but allowed)
      if (data.softLimitLevel === "exceeded" && data.canProceed) {
        const confirmed = confirm(
          `You've exceeded your portal limit (${data.current}/${data.limit}). You have ${data.graceTotal} grace uses remaining. Consider upgrading to continue without interruptions. Continue?`,
        );

        if (!confirmed) {
          return;
        }
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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    portalId: string,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const fileProgress: FileUploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: "pending",
      }));

      setUploadingFiles(fileProgress);
      setShowUploadModal(true);
      uploadFiles(fileProgress, portalId);
    }
  };

  const uploadFiles = async (
    fileProgress: FileUploadProgress[],
    portalId: string,
  ) => {
    for (let i = 0; i < fileProgress.length; i++) {
      const fileItem = fileProgress[i];

      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "uploading" } : item,
        ),
      );

      try {
        const formData = new FormData();

        formData.append("files", fileItem.file);
        formData.append("portalId", portalId);

        // Create XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;

              setUploadingFiles((prev) =>
                prev.map((item, idx) =>
                  idx === i ? { ...item, progress: percentComplete } : item,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadingFiles((prev) =>
                prev.map((item, idx) =>
                  idx === i
                    ? { ...item, status: "success", progress: 100 }
                    : item,
                ),
              );
              resolve();
            } else {
              setUploadingFiles((prev) =>
                prev.map((item, idx) =>
                  idx === i
                    ? {
                        ...item,
                        status: "error",
                        error: "Upload failed",
                      }
                    : item,
                ),
              );
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => {
            setUploadingFiles((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      status: "error",
                      error: "Network error",
                    }
                  : item,
              ),
            );
            reject(new Error("Network error"));
          });

          xhr.open("POST", "/api/portals/upload");
          xhr.send(formData);
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    // Refresh portals after all uploads complete
    await fetchPortals();
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadingFiles([]);
  };

  const filteredPortals = portals.filter(
    (portal) =>
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Secure Portals
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage and monitor your secure file collection endpoints.
          </p>
        </div>
        <Button
          className="rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-sm hover:shadow-md active:scale-95 transition-all w-fit"
          onClick={handleCreatePortal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Portal
        </Button>
      </header>

      {/* Progressive Limit Warning */}
      {showLimitWarning && limitStatus && (
        <ProgressiveLimitWarning
          className="mb-6"
          currentPlan={userPlan}
          resourceType="portals"
          usage={{
            used: limitStatus.current,
            limit: limitStatus.limit,
            percentage: limitStatus.percentage,
            isUnlimited: limitStatus.limit >= 999999,
          }}
          onUpgrade={() => router.push("/dashboard/billing")}
        />
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none text-sm"
          />
        </div>
      </div>

      {/* Portals Grid */}
      {filteredPortals.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">
            {searchQuery ? "No portals found" : "No portals yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first client portal to start collecting files securely"}
          </p>
          {!searchQuery && (
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 font-bold"
              onClick={handleCreatePortal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Portal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPortals.map((portal) => (
            <div
              key={portal.id}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate mb-1">
                    {portal.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    /{portal.slug}
                  </p>
                  {portal.customDomain && (
                    <p className="text-xs text-primary mt-1 truncate">
                      {portal.customDomain}
                    </p>
                  )}
                </div>
                {portal.whiteLabeled && (
                  <span className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 flex-shrink-0 ml-2">
                    Premium
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {portal._count.files}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-xs">
                    {formatDate(portal.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl font-medium"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/portal/${portal.slug}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  View
                </Button>
                <Button
                  className="rounded-xl font-medium"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");

                    input.type = "file";
                    input.multiple = true;
                    input.onchange = (e) =>
                      handleFileSelect(
                        e as unknown as React.ChangeEvent<HTMLInputElement>,
                        portal.id,
                      );
                    input.click();
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                </Button>
                <Button
                  className="rounded-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  disabled={deleting === portal.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(portal.id, portal.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Uploading Files</h2>
              <Button
                className="rounded-xl"
                size="sm"
                variant="ghost"
                onClick={closeUploadModal}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {uploadingFiles.map((fileItem, index) => (
                  <div key={index} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="ml-4">
                        {fileItem.status === "pending" && (
                          <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium">
                            Pending
                          </span>
                        )}
                        {fileItem.status === "uploading" && (
                          <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
                            Uploading
                          </span>
                        )}
                        {fileItem.status === "success" && (
                          <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
                            Complete
                          </span>
                        )}
                        {fileItem.status === "error" && (
                          <span className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${
                          fileItem.status === "success"
                            ? "bg-green-500"
                            : fileItem.status === "error"
                              ? "bg-red-500"
                              : "bg-primary"
                        }`}
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {fileItem.error || ""}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {Math.round(fileItem.progress)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t">
              <Button
                className="w-full rounded-xl bg-primary hover:bg-primary/90 font-bold"
                disabled={uploadingFiles.some(
                  (f) => f.status === "uploading" || f.status === "pending",
                )}
                onClick={closeUploadModal}
              >
                {uploadingFiles.every((f) => f.status === "success")
                  ? "Done"
                  : uploadingFiles.some(
                        (f) =>
                          f.status === "uploading" || f.status === "pending",
                      )
                    ? "Uploading..."
                    : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
