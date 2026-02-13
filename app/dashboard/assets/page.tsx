"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  HardDrive,
  ExternalLink,
  Cloud,
  Database,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDropdown } from "@/components/ui/custom-dropdown";

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
  const [filterPortal, setFilterPortal] = useState<string>("all");
  const [filterStorage, setFilterStorage] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [managingPassword, setManagingPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [managingExpiration, setManagingExpiration] = useState<string | null>(
    null,
  );
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [expirationError, setExpirationError] = useState("");

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
      const response = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      });

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
      // If file is password protected, prompt for password
      if (file.passwordHash) {
        const password = prompt(
          "This file is password protected. Please enter the password:",
        );
        if (!password) return;
      }

      // Always download via API to handle both cloud and local files
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: file.passwordHash
          ? {
              "x-file-password": password || "",
            }
          : {},
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
        const errorData = await response.json();
        if (errorData.requiresPassword) {
          alert("Invalid password. Please try again.");
        } else {
          alert("Unauthorized access");
        }
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

    // Basic password validation
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setManagingPassword(selectedFile.id);
    setPasswordError("");

    try {
      const response = await fetch(`/api/files/${selectedFile.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  const handleSetExpiration = (file: File) => {
    setSelectedFile(file);
    setExpirationDate(
      file.expiresAt ? new Date(file.expiresAt).toISOString().slice(0, 16) : "",
    );
    setExpirationError("");
    setShowExpirationModal(true);
  };

  const handleRemoveExpiration = async (file: File) => {
    if (
      !confirm(
        `Are you sure you want to remove the expiration date from "${file.name}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}/expiration`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(
          files.map((f) => (f.id === file.id ? { ...f, expiresAt: null } : f)),
        );
        alert("Expiration date removed successfully");
      } else {
        alert("Failed to remove expiration date");
      }
    } catch (error) {
      console.error("Failed to remove expiration:", error);
      alert("Failed to remove expiration date");
    }
  };

  const handleExpirationSubmit = async () => {
    if (!selectedFile || !expirationDate) {
      setExpirationError("Expiration date is required");
      return;
    }

    const expiration = new Date(expirationDate);
    if (expiration <= new Date()) {
      setExpirationError("Expiration date must be in the future");
      return;
    }

    setManagingExpiration(selectedFile.id);
    setExpirationError("");

    try {
      const response = await fetch(`/api/files/${selectedFile.id}/expiration`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresAt: expiration.toISOString() }),
      });

      if (response.ok) {
        setFiles(
          files.map((f) =>
            f.id === selectedFile.id
              ? { ...f, expiresAt: expiration.toISOString() }
              : f,
          ),
        );
        setShowExpirationModal(false);
        setSelectedFile(null);
        setExpirationDate("");
        alert("Expiration date set successfully");
      } else {
        const errorData = await response.json();
        setExpirationError(errorData.error || "Failed to set expiration date");
      }
    } catch (error) {
      console.error("Failed to set expiration:", error);
      setExpirationError("Failed to set expiration date");
    } finally {
      setManagingExpiration(null);
    }
  };

  const isFileExpired = (file: File) => {
    if (!file.expiresAt) return false;
    return new Date(file.expiresAt) < new Date();
  };

  const getExpirationStatus = (file: File) => {
    if (!file.expiresAt) return null;

    const expiration = new Date(file.expiresAt);
    const now = new Date();
    const isExpired = expiration < now;

    const timeDiff = expiration.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return {
      isExpired,
      daysDiff,
      formatted: expiration.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStorageType = (storageUrl: string): string => {
    if (
      storageUrl.includes("drive.google.com") ||
      storageUrl.includes("googleapis.com")
    ) {
      return "google";
    }
    if (
      storageUrl.includes("dropbox.com") ||
      storageUrl.includes("dl.dropboxusercontent.com")
    ) {
      return "dropbox";
    }
    if (storageUrl.startsWith("http")) {
      return "other";
    }

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
      hour: "2-digit",
      minute: "2-digit",
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

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPortal =
      filterPortal === "all" || file.portal.id === filterPortal;
    const storageType = getStorageType(file.storageUrl);
    const matchesStorage =
      filterStorage === "all" || storageType === filterStorage;

    return matchesSearch && matchesPortal && matchesStorage;
  });

  const uniquePortals = Array.from(new Set(files.map((f) => f.portal.id))).map(
    (id) => {
      const file = files.find((f) => f.portal.id === id);

      return file?.portal;
    },
  );

  const totalSize = files.reduce((acc, file) => acc + Number(file.size), 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets & Files</h1>
          <p className="text-muted-foreground mt-2">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Password Modal */}
      {showPasswordModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                    placeholder="Enter password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <p className="font-semibold mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedFile(null);
                  setPassword("");
                  setPasswordError("");
                }}
                className="px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors font-medium text-sm"
                disabled={managingPassword === selectedFile.id}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm"
                disabled={managingPassword === selectedFile.id}
              >
                {managingPassword === selectedFile.id
                  ? "Setting..."
                  : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiration Modal */}
      {showExpirationModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Set Expiration for "{selectedFile.name}"
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Expiration Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring transition-all outline-none font-medium text-foreground"
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 16)}
                />
                {expirationError && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {expirationError}
                  </p>
                )}
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                <ul className="space-y-1">
                  <li>• The file will no longer be accessible after this date</li>
                  <li>• You can remove the expiration at any time</li>
                  <li>• Minimum expiration is 24 hours from now</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExpirationModal(false);
                  setSelectedFile(null);
                  setExpirationDate("");
                  setExpirationError("");
                }}
                className="px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors font-medium text-sm"
                disabled={managingExpiration === selectedFile.id}
              >
                Cancel
              </button>
              <button
                onClick={handleExpirationSubmit}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm"
                disabled={managingExpiration === selectedFile.id}
              >
                {managingExpiration === selectedFile.id
                  ? "Setting..."
                  : "Set Expiration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Assets & Files</h1>
          <p className="text-muted-foreground text-sm">Manage all uploaded files across your portals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Storage</p>
            <p className="text-2xl font-bold text-foreground">
              {formatFileSize(totalSize.toString())}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{files.length}</p>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {formatFileSize(totalSize.toString())}
            </p>
            <p className="text-sm text-muted-foreground">Storage Used</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/50">
              <Download className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {files.reduce((acc, f) => acc + f.downloads, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Downloads</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-11 rounded-xl"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <CustomDropdown
              className="w-48"
              options={[
                { value: "all", label: "All Portals" },
                ...uniquePortals.map((portal) => ({
                  value: portal?.id || "",
                  label: portal?.name || "",
                })),
              ]}
              placeholder="Select portal"
              value={filterPortal}
              onChange={setFilterPortal}
            />
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <CustomDropdown
              className="w-48"
              options={[
                {
                  value: "all",
                  label: "All Storage",
                  icon: <Database className="w-4 h-4" />,
                },
                {
                  value: "google",
                  label: "Google Drive",
                  icon: <Cloud className="w-4 h-4 text-blue-500" />,
                },
                {
                  value: "dropbox",
                  label: "Dropbox",
                  icon: <Cloud className="w-4 h-4 text-blue-600" />,
                },
                {
                  value: "local",
                  label: "Local Storage",
                  icon: <HardDrive className="w-4 h-4 text-gray-500" />,
                },
              ]}
              placeholder="Select storage"
              value={filterStorage}
              onChange={setFilterStorage}
            />
          </div>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2 text-foreground">
            {searchQuery || filterPortal !== "all"
              ? "No files found"
              : "No files yet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery || filterPortal !== "all"
              ? "Try adjusting your search or filters"
              : "Files uploaded to your portals will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    File
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Portal
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Storage
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Size
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Uploaded
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Downloads
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">
                    Security
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getFileIcon(file.mimeType)}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.mimeType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                          {file.portal.name}
                        </span>
                        <a
                          className="text-primary hover:text-primary/80 transition-colors"
                          href={`/portal/${file.portal.slug}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStorageIcon(getStorageType(file.storageUrl))}
                        <span className="text-sm text-foreground">
                          {getStorageLabel(getStorageType(file.storageUrl))}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDate(file.uploadedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">
                        {file.downloads}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {file.passwordHash ? (
                          <>
                            <Lock className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              Protected
                            </span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Open
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          className="rounded-xl"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          className="rounded-xl"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetPassword(file)}
                          title={
                            file.passwordHash
                              ? "Change Password"
                              : "Set Password"
                          }
                        >
                          {file.passwordHash ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                        {file.passwordHash && (
                          <Button
                            className="rounded-none font-mono text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemovePassword(file)}
                            title="Remove Password"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          className="rounded-none font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleting === file.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(file.id, file.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
