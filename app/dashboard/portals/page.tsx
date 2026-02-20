"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  X,
  Search,
  FolderOpen,
  Download,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { uploadFile } from "@/lib/upload-manager";

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  isActive: boolean;
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

export default function PortalsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadProgress[]>(
    [],
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [portalFiles, setPortalFiles] = useState<any[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    fetchPortals();
  }, []);

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

  const handleCreatePortal = () => {
    router.push("/dashboard/portals/create");
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
        // Use the hybrid upload manager
        const result = await uploadFile({
          file: fileItem.file,
          portalId,
          onProgress: (progress) => {
            setUploadingFiles((prev) =>
              prev.map((item, idx) =>
                idx === i ? { ...item, progress } : item,
              ),
            );
          },
        });

        if (result.success) {
          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "success", progress: 100 } : item,
            ),
          );
        } else {
          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "error",
                    error: result.error || "Upload failed",
                  }
                : item,
            ),
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadingFiles((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        );
      }
    }

    // Refresh portals after all uploads complete
    await fetchPortals();
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadingFiles([]);
  };

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

  const handleToggleActive = async (
    portalId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/portals/${portalId}/toggle-active`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh portals list
        await fetchPortals();
      } else {
        alert("Failed to toggle portal status");
      }
    } catch (error) {
      console.error("Failed to toggle portal status:", error);
      alert("Failed to toggle portal status");
    }
  };

  const handleDownloadFile = async (file: any) => {
    try {
      let filePassword = "";

      if (file.passwordHash) {
        const promptPassword = prompt(
          "This file is password protected. Please enter the password:",
        );

        if (!promptPassword) return;
        filePassword = promptPassword;
      }
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: file.passwordHash ? { "x-file-password": filePassword } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.status === 401) {
        alert("Invalid password. Please try again.");
      } else {
        // Try to get error message from response
        try {
          const errorData = await response.json();

          alert(errorData.error || "Failed to download file");
        } catch {
          alert("Failed to download file");
        }
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingFile(fileId);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPortalFiles(portalFiles.filter((f) => f.id !== fileId));
        alert("File deleted successfully");
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
      <header className="mb-6 sm:mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Secure Portals
          </h1>
          <p className="text-muted-foreground mt-1 text-base sm:text-lg">
            Manage and monitor your secure file collection endpoints.
          </p>
        </div>
        <Button
          className="rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-sm hover:shadow-md active:scale-95 transition-all w-fit text-sm sm:text-base"
          onClick={handleCreatePortal}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">Create New Portal</span>
        </Button>
      </header>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none text-sm"
            placeholder="Search by name or slug..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Portals Grid */}
      {filteredPortals.length === 0 ? (
        <div className="bg-bg-card rounded-[12px] p-8 sm:p-12 border border-border text-center">
          <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPortals.map((portal) => (
            <div
              key={portal.id}
              className="bg-bg-card rounded-[12px] p-4 sm:p-6 border border-border hover:shadow-md transition-shadow"
            >
              {/* Portal Name - Clickable to open files modal */}
              <div
                className="cursor-pointer mb-3 sm:mb-4 group"
                onClick={() => handlePortalClick(portal)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors text-sm sm:text-base">
                      {portal.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      /{portal.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                    {portal.isActive ? (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-green-50 text-green-600 dark:bg-green-950/50">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                    {portal.whiteLabeled && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 hidden sm:inline">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  className="flex-1 sm:flex-initial rounded-xl font-medium text-xs h-8 min-w-0 sm:min-w-[80px]"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/portal/${portal.slug}`;

                    navigator.clipboard.writeText(url);
                    alert("Portal link copied to clipboard!");
                  }}
                >
                  <span className="hidden sm:inline">Copy Link</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
                <Button
                  className="rounded-xl font-medium text-xs h-8 px-2 sm:px-3"
                  size="sm"
                  title={
                    portal.isActive ? "Deactivate Portal" : "Activate Portal"
                  }
                  variant="outline"
                  onClick={() => handleToggleActive(portal.id, portal.isActive)}
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
                </Button>
                <Button
                  className="rounded-xl font-medium text-xs h-8 px-2 sm:px-3"
                  size="sm"
                  title="View Portal"
                  variant="outline"
                  onClick={() =>
                    window.open(`/portal/${portal.slug}`, "_blank")
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button
                  className="rounded-xl font-medium text-xs h-8 px-2 sm:px-3"
                  size="sm"
                  title="Edit Portal"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/portals/${portal.id}/edit`)
                  }
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
                </Button>
                <Button
                  className="rounded-xl font-medium text-xs h-8 px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  disabled={deleting === portal.id}
                  size="sm"
                  title="Delete Portal"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-background border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl mx-2">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-bold">Uploading Files</h2>
              <Button
                className="rounded-xl"
                size="sm"
                variant="ghost"
                onClick={closeUploadModal}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="space-y-3 sm:space-y-4">
                {uploadingFiles.map((fileItem, index) => (
                  <div
                    key={index}
                    className="border rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {fileItem.status === "pending" && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium">
                            Pending
                          </span>
                        )}
                        {fileItem.status === "uploading" && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
                            Uploading
                          </span>
                        )}
                        {fileItem.status === "success" && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
                            Complete
                          </span>
                        )}
                        {fileItem.status === "error" && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative w-full h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
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
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
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
            <div className="p-4 sm:p-6 border-t">
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

      {/* Portal Files Modal */}
      {showFilesModal && selectedPortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => {
              setShowFilesModal(false);
              setSelectedPortal(null);
              setPortalFiles([]);
            }}
          />
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-bg-card rounded-[14px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-2"
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="p-4 sm:p-6 lg:p-8 border-b border-border bg-muted/50 flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-lg sm:text-xl font-bold text-foreground">
                  <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">
                    {selectedPortal.name}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                    /{selectedPortal.slug}
                  </p>
                </div>
              </div>
              <button
                className="p-1.5 sm:p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedPortal(null);
                  setPortalFiles([]);
                }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-bg-card p-3 sm:p-4 rounded-[14px] border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Total Files
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {portalFiles.length}
                  </p>
                </div>
                <div className="bg-bg-card p-3 sm:p-4 rounded-[14px] border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    Total Size
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {formatFileSize(
                      portalFiles
                        .reduce((acc, f) => acc + Number(f.size || 0), 0)
                        .toString(),
                    )}
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Uploaded Files
              </h4>

              <div className="space-y-2">
                {portalFiles.length > 0 ? (
                  portalFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors"
                    >
                      <span
                        className={`flex-shrink-0 ${getFileIconColor(file.mimeType)}`}
                      >
                        {getFileIcon(file.mimeType, "w-4 h-4 sm:w-5 sm:h-5")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex-wrap">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(file.uploadedAt)}
                          </div>
                          {file.uploaderName && (
                            <>
                              <span>•</span>
                              <span className="hidden sm:inline">
                                {file.uploaderName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                          title="Download"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                          title="Open file"
                          onClick={() => window.open(file.storageUrl, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-50"
                          disabled={deletingFile === file.id}
                          title="Delete"
                          onClick={() => handleDeleteFile(file.id, file.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 sm:py-12 text-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      No files uploaded yet
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Files uploaded to this portal will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-muted border-t border-border flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-card border border-border rounded-xl sm:rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1"
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedPortal(null);
                  setPortalFiles([]);
                }}
              >
                Close
              </button>
              <button
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-foreground text-background rounded-xl sm:rounded-2xl text-sm font-bold hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                onClick={() =>
                  window.open(`/portal/${selectedPortal.slug}`, "_blank")
                }
              >
                View Portal <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
