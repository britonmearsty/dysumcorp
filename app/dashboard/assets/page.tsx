"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Trash2,
  Search,
  ExternalLink,
  Database,
  Lock,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  PieChart,
  TrendingUp,
  Server,
  RefreshCw,
  Cloud,
  HardDrive,
  CloudOff,
  Loader2,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";
import { useStorageDeleteBehavior } from "@/lib/use-storage-delete-behavior";
import { DeleteFileModal } from "@/components/ui/delete-file-modal";

interface File {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  downloads: number;
  passwordHash?: string | null;
  expiresAt?: string | null;
  portal: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AssetsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();
  const { behavior: deleteBehavior } = useStorageDeleteBehavior();

  const tabs = [
    {
      id: "all",
      name: "All Assets",
      icon: Database,
      description: "All uploaded files across all providers",
    },
    {
      id: "storage",
      name: "By Storage",
      icon: Server,
      description: "Organized by cloud provider",
    },
    {
      id: "stats",
      name: "Insights",
      icon: PieChart,
      description: "Storage usage and distribution",
    },
  ];

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");

      if (response.ok) {
        const data = await response.json();

        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithCloud = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/files/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();

        showToast(
          `Synced with cloud: ${result.deleted} files removed`,
          "success",
        );
        fetchFiles();
      } else {
        const error = await response.json();

        showToast(error.error || "Failed to sync", "error");
      }
    } catch (error) {
      console.error("Failed to sync:", error);
      showToast("Failed to sync with cloud storage", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setFileToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (deleteFromStorage: boolean) => {
    if (!fileToDelete) return;
    setDeleteModalOpen(false);
    setDeleting(fileToDelete.id);
    try {
      const response = await fetch(`/api/files/${fileToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteFromStorage }),
      });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileToDelete.id));
        showToast("File deleted successfully", "success");
      } else {
        showToast("Failed to delete file", "error");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      showToast("Failed to delete file", "error");
    } finally {
      setDeleting(null);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: File) => {
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
        showToast("Invalid password. Please try again.", "error");
      } else {
        try {
          const errorData = await response.json();

          showToast(errorData.error || "Failed to download file", "error");
        } catch {
          showToast("Failed to download file", "error");
        }
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      showToast("Failed to download file", "error");
    }
  };

  // Helper functions
  const getStorageType = (storageUrl: string): string => {
    if (!storageUrl) return "other";
    if (
      storageUrl.includes("drive.google.com") ||
      storageUrl.includes("googleapis.com") ||
      storageUrl.includes("googledrive.com")
    )
      return "google";
    if (storageUrl.includes("dropbox.com")) return "dropbox";
    if (storageUrl.startsWith("/uploads")) return "local";

    return "other";
  };

  const getStorageLabel = (type: string): string => {
    const labels: Record<string, string> = {
      google: "Google Drive",
      dropbox: "Dropbox",
      local: "Local Storage",
      other: "Other",
    };

    return labels[type] || "Unknown";
  };

  const getStorageIcon = (type: string) => {
    if (type === "google") return <Cloud className="w-3.5 h-3.5" />;
    if (type === "dropbox") return <Cloud className="w-3.5 h-3.5" />;
    if (type === "local") return <HardDrive className="w-3.5 h-3.5" />;

    return <Server className="w-3.5 h-3.5" />;
  };

  const getProviderIcon = (type: string) => {
    if (type === "google")
      return <Cloud className="w-5 h-5 text-emerald-500" />;
    if (type === "dropbox") return <Cloud className="w-5 h-5 text-blue-500" />;
    if (type === "local")
      return <HardDrive className="w-5 h-5 text-gray-500" />;

    return <Server className="w-5 h-5 text-purple-500" />;
  };

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filtered and grouped data
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDate = dateFilter
        ? file.uploadedAt.startsWith(dateFilter)
        : true;

      return matchesSearch && matchesDate;
    });
  }, [files, searchQuery, dateFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, File[]> = {};

    filteredFiles.forEach((file) => {
      const date = new Date(file.uploadedAt);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(file);
    });

    return groups;
  }, [filteredFiles]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + Number(file.size), 0);
    const byProvider = files.reduce(
      (acc, f) => {
        const type = getStorageType(f.storageUrl);

        acc[type] = (acc[type] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalFiles: files.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byProvider,
    };
  }, [files]);

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Assets
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Loading your files...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Assets
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          A centralized, secure command center for all client documents across
          your connected cloud storage ecosystems.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div className="ml-auto" layoutId="assets-indicator">
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Stats Widget */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-card border border-border rounded-xl">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground mb-2 sm:mb-3">
              Storage Pulse
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <div className="flex justify-between text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                  <span className="text-muted-foreground">Total Volume</span>
                  <span className="text-foreground font-bold">
                    {stats.totalSizeMB} MB
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: "45%" }}
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-1.5 sm:p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Dropbox
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold">
                  {stats.byProvider["dropbox"] || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-1.5 sm:p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Google Drive
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold">
                  {stats.byProvider["google"] || 0}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Card Header */}
                <div className="p-3 sm:p-4 lg:p-6 border-b border-border bg-muted/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                        {tabs.find((t) => t.id === activeTab)?.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                        {tabs.find((t) => t.id === activeTab)?.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border disabled:opacity-50"
                        disabled={syncing}
                        title="Sync with cloud"
                        type="button"
                        onClick={handleSyncWithCloud}
                      >
                        {syncing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border"
                        title="Refresh"
                        type="button"
                        onClick={() => fetchFiles()}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 p-1 bg-muted border border-border rounded-lg">
                        <button
                          className={`p-2 rounded transition-all ${
                            viewMode === "grid"
                              ? "bg-card shadow-sm"
                              : "hover:bg-card/50"
                          }`}
                          type="button"
                          onClick={() => setViewMode("grid")}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded transition-all ${
                            viewMode === "list"
                              ? "bg-card shadow-sm"
                              : "hover:bg-card/50"
                          }`}
                          type="button"
                          onClick={() => setViewMode("list")}
                        >
                          <ListIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Search Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        placeholder="Search assets..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <input
                      className="w-full sm:w-auto sm:flex-shrink-0 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-0">
                  {/* All Assets Tab */}
                  {activeTab === "all" && (
                    <>
                      {filteredFiles.length === 0 ? (
                        <div className="text-center py-12 sm:py-20 px-4 sm:px-6">
                          <FileText className="w-10 sm:w-16 h-10 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                          <h3 className="font-semibold text-base sm:text-lg mb-2">
                            No Assets Found
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm">
                            Your vault is empty or no files match your current
                            search criteria.
                          </p>
                        </div>
                      ) : viewMode === "list" ? (
                        <>
                          {Object.entries(groupedByDate).map(
                            ([date, dateFiles]) => (
                              <div key={date}>
                                <div className="p-3 sm:p-4 lg:p-6 bg-muted/30 border-b border-border">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                      {date}
                                    </h3>
                                    <span className="text-[10px] font-normal text-muted-foreground">
                                      ({dateFiles.length} files)
                                    </span>
                                  </div>
                                </div>
                                <div className="divide-y divide-border">
                                  {dateFiles.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-5 hover:bg-muted/50 transition-colors"
                                    >
                                      <div
                                        className={`flex-shrink-0 ${getFileIconColor(file.mimeType)}`}
                                      >
                                        {getFileIcon(
                                          file.mimeType,
                                          "w-5 sm:w-6 h-5 sm:h-6",
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate">
                                          {file.name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                          <span className="flex items-center gap-1">
                                            {getStorageIcon(
                                              getStorageType(file.storageUrl),
                                            )}
                                            {getStorageLabel(
                                              getStorageType(file.storageUrl),
                                            )}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {formatFileSize(file.size)}
                                          </span>
                                          {file.passwordHash && (
                                            <>
                                              <span>•</span>
                                              <Lock className="w-3 h-3" />
                                            </>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-muted-foreground">
                                            Portal:
                                          </span>
                                          <a
                                            className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                                            href={`/portal/${file.portal.slug}`}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            title={file.portal.name}
                                          >
                                            <span className="truncate">
                                              {file.portal.name}
                                            </span>
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                          </a>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                          title="Download"
                                          onClick={() => handleDownload(file)}
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                          title="Open file"
                                          onClick={() =>
                                            window.open(
                                              file.storageUrl,
                                              "_blank",
                                            )
                                          }
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-50"
                                          disabled={deleting === file.id}
                                          title="Delete"
                                          onClick={() =>
                                            handleDelete(file.id, file.name)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </>
                      ) : (
                        <div className="p-3 sm:p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredFiles.map((file) => (
                              <div
                                key={file.id}
                                className="bg-muted/50 rounded-lg border border-border hover:shadow-md transition-all p-3 sm:p-4 overflow-hidden"
                              >
                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                  <div
                                    className={getFileIconColor(file.mimeType)}
                                  >
                                    {getFileIcon(
                                      file.mimeType,
                                      "w-6 h-6 sm:w-7 sm:h-7",
                                    )}
                                  </div>
                                  <div className="flex gap-0.5 sm:gap-1">
                                    <button
                                      className="p-1 sm:p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all"
                                      onClick={() => handleDownload(file)}
                                    >
                                      <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                    <button
                                      className="p-1 sm:p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                                      disabled={deleting === file.id}
                                      onClick={() =>
                                        handleDelete(file.id, file.name)
                                      }
                                    >
                                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <h4
                                  className="font-bold text-xs sm:text-sm truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </h4>
                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate mt-1">
                                  {file.portal.name}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                  <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </span>
                                  <span className="w-1 h-1 bg-border rounded-full flex-shrink-0" />
                                  <div className="flex items-center gap-1 min-w-0">
                                    {getStorageIcon(
                                      getStorageType(file.storageUrl),
                                    )}
                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                      {getStorageLabel(
                                        getStorageType(file.storageUrl),
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* By Storage Tab */}
                  {activeTab === "storage" && (
                    <>
                      {["google", "dropbox", "local", "other"].map(
                        (provider) => {
                          const providerFiles = filteredFiles.filter(
                            (f) => getStorageType(f.storageUrl) === provider,
                          );

                          if (providerFiles.length === 0) return null;

                          return (
                            <div key={provider}>
                              <div className="p-4 sm:p-6 bg-muted/30 border-b border-border">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-card rounded-lg border border-border flex-shrink-0">
                                      {getProviderIcon(provider)}
                                    </div>
                                    <h3 className="font-bold text-foreground capitalize truncate">
                                      {getStorageLabel(provider)}
                                    </h3>
                                  </div>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0">
                                    {providerFiles.length} items
                                  </span>
                                </div>
                              </div>
                              {viewMode === "list" ? (
                                <div className="divide-y divide-border">
                                  {providerFiles.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-5 hover:bg-muted/50 transition-colors"
                                    >
                                      <div
                                        className={`flex-shrink-0 ${getFileIconColor(file.mimeType)}`}
                                      >
                                        {getFileIcon(file.mimeType, "w-6 h-6")}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate">
                                          {file.name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                          <span>
                                            {formatFileSize(file.size)}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {formatDate(file.uploadedAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                          title="Download"
                                          onClick={() => handleDownload(file)}
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                          title="Open file"
                                          onClick={() =>
                                            window.open(
                                              file.storageUrl,
                                              "_blank",
                                            )
                                          }
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-50"
                                          disabled={deleting === file.id}
                                          title="Delete"
                                          onClick={() =>
                                            handleDelete(file.id, file.name)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 sm:p-6">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {providerFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="bg-muted/50 rounded-lg border border-border hover:shadow-md transition-all p-3 overflow-hidden"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <div
                                            className={getFileIconColor(
                                              file.mimeType,
                                            )}
                                          >
                                            {getFileIcon(
                                              file.mimeType,
                                              "w-5 h-5 sm:w-6 sm:h-6",
                                            )}
                                          </div>
                                          <div className="flex gap-0.5">
                                            <button
                                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all"
                                              title="Download"
                                              onClick={() =>
                                                handleDownload(file)
                                              }
                                            >
                                              <Download className="w-3 h-3" />
                                            </button>
                                            <button
                                              className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                                              disabled={deleting === file.id}
                                              title="Delete"
                                              onClick={() =>
                                                handleDelete(file.id, file.name)
                                              }
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <h4
                                          className="font-bold text-[10px] sm:text-xs truncate"
                                          title={file.name}
                                        >
                                          {file.name}
                                        </h4>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                                          {formatFileSize(file.size)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </>
                  )}

                  {/* Insights Tab */}
                  {activeTab === "stats" && (
                    <div className="p-8 sm:p-12 text-center">
                      <div className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 bg-muted rounded-full border border-border relative flex items-center justify-center">
                        <PieChart className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 bg-card rounded-full flex items-center justify-center shadow-sm">
                          <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-foreground" />
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-foreground mb-2">
                        Storage Intelligence
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 sm:mb-10">
                        Monitor how your storage is distributed across your
                        connected cloud ecosystems.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        <div className="bg-muted/50 rounded-xl border border-border p-4 sm:p-6">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">
                            {stats.totalFiles}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase mt-2">
                            Files Collected
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-xl border border-border p-4 sm:p-6">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">
                            {Math.round(parseFloat(stats.totalSizeMB))}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase mt-2">
                            MB Utilized
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-xl border border-border p-4 sm:p-6">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">
                            {Object.keys(stats.byProvider).length}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase mt-2">
                            Providers
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-xl border border-border p-4 sm:p-6">
                          <p className="text-2xl sm:text-3xl font-black text-foreground">
                            100%
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase mt-2">
                            Secure
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Delete Confirmation Modal */}
        <DeleteFileModal
          behavior={deleteBehavior}
          fileName={fileToDelete?.name ?? ""}
          open={deleteModalOpen && !!fileToDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setFileToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
