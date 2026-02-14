"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Download,
  Trash2,
  Search,
  HardDrive,
  ExternalLink,
  Cloud,
  Database,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  PieChart,
  TrendingUp,
  Server,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [managingPassword, setManagingPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

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
      const response = await fetch(`/api/files/${id}`, { method: "DELETE" });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== id));
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      if (file.passwordHash) {
        const password = prompt(
          "This file is password protected. Please enter the password:",
        );

        if (!password) return;
      }
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: file.passwordHash ? { "x-file-password": password || "" } : {},
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
        alert("Failed to download file");
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file");
    }
  };

  const handleSetPassword = (file: File) => {
    setSelectedFile(file);
    setPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handleRemovePassword = async (file: File) => {
    if (
      !confirm(
        `Are you sure you want to remove password protection from "${file.name}"?`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/files/${file.id}/password`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(
          files.map((f) =>
            f.id === file.id ? { ...f, passwordHash: null } : f,
          ),
        );
        alert("Password protection removed successfully");
      } else {
        alert("Failed to remove password protection");
      }
    } catch (error) {
      console.error("Failed to remove password:", error);
      alert("Failed to remove password protection");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedFile || !password.trim()) {
      setPasswordError("Password is required");

      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");

      return;
    }
    setManagingPassword(selectedFile.id);
    setPasswordError("");
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (response.ok) {
        setFiles(
          files.map((f) =>
            f.id === selectedFile.id ? { ...f, passwordHash: "set" } : f,
          ),
        );
        setShowPasswordModal(false);
        setSelectedFile(null);
        setPassword("");
        alert("Password protection added successfully");
      } else {
        const errorData = await response.json();

        setPasswordError(errorData.error || "Failed to set password");
      }
    } catch (error) {
      console.error("Failed to set password:", error);
      setPasswordError("Failed to set password");
    } finally {
      setManagingPassword(null);
    }
  };

  // Helper functions
  const getStorageType = (storageUrl: string): string => {
    if (
      storageUrl.includes("drive.google.com") ||
      storageUrl.includes("googleapis.com")
    )
      return "google";
    if (
      storageUrl.includes("dropbox.com") ||
      storageUrl.includes("dl.dropboxusercontent.com")
    )
      return "dropbox";
    if (storageUrl.startsWith("http")) return "other";

    return "local";
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "📽️";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    )
      return "📦";

    return "📎";
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case "google":
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case "dropbox":
        return <Cloud className="w-4 h-4 text-blue-600" />;
      case "local":
        return <HardDrive className="w-4 h-4 text-gray-500" />;
      default:
        return <Database className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStorageLabel = (storageType: string) => {
    switch (storageType) {
      case "google":
        return "Google Drive";
      case "dropbox":
        return "Dropbox";
      case "local":
        return "Local";
      default:
        return "Other";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return <Cloud className="w-5 h-5 text-blue-500" />;
      case "dropbox":
        return <Cloud className="w-5 h-5 text-blue-600" />;
      case "local":
        return <HardDrive className="w-5 h-5 text-gray-500" />;
      default:
        return <Database className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

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
      <div>
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Assets
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Loading your files...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Password Modal */}
      {showPasswordModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card rounded-[12px] p-6 w-full max-w-md border border-border shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Set Password for "{selectedFile.name}"
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                    placeholder="Enter password (min 8 characters)"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors font-medium text-sm"
                disabled={managingPassword === selectedFile.id}
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedFile(null);
                  setPassword("");
                  setPasswordError("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm"
                disabled={managingPassword === selectedFile.id}
                onClick={handlePasswordSubmit}
              >
                {managingPassword === selectedFile.id
                  ? "Setting..."
                  : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Assets
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl leading-relaxed">
          A centralized, secure command center for all client documents across
          your connected cloud storage ecosystems.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto"
                      layoutId="assets-active-indicator"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Storage Pulse Widget */}
          <div className="mt-8 p-6 bg-bg-card border border-border rounded-[14px]">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Storage Pulse
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium">
                    Total Volume
                  </span>
                  <span className="text-foreground font-bold">
                    {stats.totalSizeMB} MB
                  </span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: "45%" }}
                    className="h-full bg-foreground"
                    initial={{ width: 0 }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center bg-bg-card p-3 rounded-[12px] border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                  <span className="text-xs text-muted-foreground">Dropbox</span>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {stats.byProvider["dropbox"] || 0}
                </span>
              </div>
              <div className="flex justify-between items-center bg-bg-card p-3 rounded-[12px] border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">
                    Google Drive
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {stats.byProvider["google"] || 0}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-ring transition-all outline-none text-sm text-foreground"
                placeholder="Search assets..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors text-sm font-medium border border-border"
                title="Refresh page"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              <div className="flex items-center gap-2 p-1 bg-muted border border-border rounded-xl w-fit">
                <button
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + viewMode}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-bg-card rounded-[14px] border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                  <h2 className="text-xl font-bold text-foreground">
                    {tabs.find((t) => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tabs.find((t) => t.id === activeTab)?.description}
                  </p>
                </div>

                <div className="p-0">
                  {/* All Assets Tab */}
                  {activeTab === "all" && (
                    <div className="p-6">
                      {filteredFiles.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg mb-2 text-foreground">
                            No Assets Found
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Your vault is empty or no files match your current
                            search criteria.
                          </p>
                        </div>
                      ) : viewMode === "list" ? (
                        <div className="divide-y divide-border">
                          {filteredFiles.map((file) => (
                            <div
                              key={file.id}
                              className="py-4 hover:bg-muted/20 transition-colors px-4 -mx-4 rounded-xl"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 text-3xl">
                                  {getFileIcon(file.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground truncate">
                                    {file.name}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      {getStorageIcon(
                                        getStorageType(file.storageUrl),
                                      )}
                                      {getStorageLabel(
                                        getStorageType(file.storageUrl),
                                      )}
                                    </span>
                                    <span>•</span>
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.uploadedAt)}</span>
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
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                      href={`/portal/${file.portal.slug}`}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      {file.portal.name}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                    title="Download"
                                    onClick={() => handleDownload(file)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  {file.passwordHash ? (
                                    <button
                                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                      title="Remove password"
                                      onClick={() => handleRemovePassword(file)}
                                    >
                                      <Unlock className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                      title="Set password"
                                      onClick={() => handleSetPassword(file)}
                                    >
                                      <Lock className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-50"
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
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredFiles.map((file) => (
                            <div
                              key={file.id}
                              className="group bg-bg-card rounded-[14px] border border-border hover:border-muted-foreground hover:shadow-lg transition-all p-4"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="bg-card rounded-xl border border-border group-hover:bg-muted transition-colors p-3 text-2xl">
                                  {getFileIcon(file.mimeType)}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                                    onClick={() => handleDownload(file)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                    disabled={deleting === file.id}
                                    onClick={() =>
                                      handleDelete(file.id, file.name)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <h4
                                className="font-bold text-foreground truncate text-sm"
                                title={file.name}
                              >
                                {file.name}
                              </h4>
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {file.portal.name}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  {formatFileSize(file.size)}
                                </span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <div className="flex items-center gap-1">
                                  {getStorageIcon(
                                    getStorageType(file.storageUrl),
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {getStorageLabel(
                                      getStorageType(file.storageUrl),
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* By Storage Tab */}
                  {activeTab === "storage" && (
                    <div className="p-6 space-y-8">
                      {["google", "dropbox", "local", "other"].map(
                        (provider) => {
                          const providerFiles = filteredFiles.filter(
                            (f) => getStorageType(f.storageUrl) === provider,
                          );

                          if (providerFiles.length === 0) return null;

                          return (
                            <div
                              key={provider}
                              className="bg-bg-card rounded-[14px] border border-border overflow-hidden"
                            >
                              <div className="p-4 bg-card border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-muted rounded-xl">
                                    {getProviderIcon(provider)}
                                  </div>
                                  <h3 className="font-bold text-foreground capitalize">
                                    {getStorageLabel(provider)}
                                  </h3>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  {providerFiles.length} items
                                </span>
                              </div>
                              <div className="p-4">
                                {viewMode === "list" ? (
                                  <div className="divide-y divide-border">
                                    {providerFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="py-3 hover:bg-card/50 transition-colors px-3 -mx-3 rounded-xl"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0 text-2xl">
                                            {getFileIcon(file.mimeType)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate text-sm">
                                              {file.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                              <span>
                                                {formatFileSize(file.size)}
                                              </span>
                                              <span>•</span>
                                              <span>
                                                {formatDate(file.uploadedAt)}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                                              onClick={() =>
                                                handleDownload(file)
                                              }
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                              className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                              disabled={deleting === file.id}
                                              onClick={() =>
                                                handleDelete(file.id, file.name)
                                              }
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {providerFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="bg-bg-card rounded-[12px] border border-border hover:shadow-md transition-all p-3"
                                      >
                                        <div className="flex justify-between items-start mb-3">
                                          <div className="text-xl">
                                            {getFileIcon(file.mimeType)}
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                              onClick={() =>
                                                handleDownload(file)
                                              }
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                              onClick={() =>
                                                handleDelete(file.id, file.name)
                                              }
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        <h4
                                          className="font-bold text-foreground truncate text-xs"
                                          title={file.name}
                                        >
                                          {file.name}
                                        </h4>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                          {formatFileSize(file.size)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}

                  {/* Insights Tab */}
                  {activeTab === "stats" && (
                    <div
                      className={`transition-all duration-300 ${viewMode === "list" ? "p-8" : "p-12"} text-center`}
                    >
                      <div
                        className={`mx-auto transition-all duration-300 bg-muted rounded-full border border-border relative flex items-center justify-center ${
                          viewMode === "list"
                            ? "w-20 h-20 mb-6"
                            : "w-32 h-32 mb-8"
                        }`}
                      >
                        <PieChart
                          className={`text-muted-foreground transition-all ${viewMode === "list" ? "w-10 h-10" : "w-16 h-16"}`}
                        />
                        <div
                          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-full flex items-center justify-center shadow-sm transition-all ${
                            viewMode === "list" ? "w-7 h-7" : "w-10 h-10"
                          }`}
                        >
                          <TrendingUp
                            className={`text-foreground ${viewMode === "list" ? "w-3.5 h-3.5" : "w-5 h-5"}`}
                          />
                        </div>
                      </div>

                      <div
                        className={
                          viewMode === "list"
                            ? "flex flex-col items-center"
                            : ""
                        }
                      >
                        <h3
                          className={`font-black text-foreground mb-2 transition-all ${viewMode === "list" ? "text-xl" : "text-2xl"}`}
                        >
                          Storage Intelligence
                        </h3>
                        <p
                          className={`text-muted-foreground text-sm max-w-md mx-auto leading-relaxed transition-all ${
                            viewMode === "list" ? "mb-8" : "mb-10"
                          }`}
                        >
                          Monitor how your storage is distributed across your
                          connected cloud ecosystems.
                        </p>
                      </div>

                      <div
                        className={`grid gap-4 mx-auto transition-all ${
                          viewMode === "list"
                            ? "grid-cols-2 md:grid-cols-4 max-w-4xl"
                            : "grid-cols-2 md:grid-cols-4 max-w-3xl"
                        }`}
                      >
                        <div
                          className={`bg-bg-card rounded-[14px] border border-border group hover:bg-bg-card hover:border-border transition-all ${
                            viewMode === "list" ? "p-4" : "p-6"
                          }`}
                        >
                          <p
                            className={`font-black text-foreground transition-all ${viewMode === "list" ? "text-2xl" : "text-3xl"}`}
                          >
                            {stats.totalFiles}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                            Files Collected
                          </p>
                        </div>
                        <div
                          className={`bg-bg-card rounded-[14px] border border-border group hover:bg-bg-card hover:border-border transition-all ${
                            viewMode === "list" ? "p-4" : "p-6"
                          }`}
                        >
                          <p
                            className={`font-black text-foreground transition-all ${viewMode === "list" ? "text-2xl" : "text-3xl"}`}
                          >
                            {Math.round(parseFloat(stats.totalSizeMB))}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                            MB Utilized
                          </p>
                        </div>
                        <div
                          className={`bg-bg-card rounded-[14px] border border-border group hover:bg-bg-card hover:border-border transition-all ${
                            viewMode === "list" ? "p-4" : "p-6"
                          }`}
                        >
                          <p
                            className={`font-black text-foreground transition-all ${viewMode === "list" ? "text-2xl" : "text-3xl"}`}
                          >
                            {Object.keys(stats.byProvider).length}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                            Providers
                          </p>
                        </div>
                        <div
                          className={`bg-bg-card rounded-[14px] border border-border group hover:bg-bg-card hover:border-border transition-all ${
                            viewMode === "list" ? "p-4" : "p-6"
                          }`}
                        >
                          <p
                            className={`font-black text-foreground transition-all ${viewMode === "list" ? "text-2xl" : "text-3xl"}`}
                          >
                            {files.length > 0 ? "Healthy" : "-"}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                            Vault Status
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
      </div>
    </div>
  );
}
