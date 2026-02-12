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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-mono">Assets</h1>
          <p className="text-muted-foreground mt-2">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Modal */}
      {showPasswordModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold font-mono mb-4">
              Set Password for "{selectedFile.name}"
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-mono mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md font-mono pr-10"
                    placeholder="Enter password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1 font-mono">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 font-mono">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
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
                className="px-4 py-2 border rounded-md font-mono hover:bg-gray-50"
                disabled={managingPassword === selectedFile.id}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 bg-[#334155] text-white rounded-md font-mono hover:bg-[rgba(51,65,85,0.8)] disabled:opacity-50"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold font-mono mb-4">
              Set Expiration for "{selectedFile.name}"
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-mono mb-2">
                  Expiration Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md font-mono"
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 16)}
                />
                {expirationError && (
                  <p className="text-red-500 text-sm mt-1 font-mono">
                    {expirationError}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 font-mono">
                <p>• The file will no longer be accessible after this date</p>
                <p>• You can remove the expiration at any time</p>
                <p>• Minimum expiration is 24 hours from now</p>
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
                className="px-4 py-2 border rounded-md font-mono hover:bg-gray-50"
                disabled={managingExpiration === selectedFile.id}
              >
                Cancel
              </button>
              <button
                onClick={handleExpirationSubmit}
                className="px-4 py-2 bg-[#334155] text-white rounded-md font-mono hover:bg-[rgba(51,65,85,0.8)] disabled:opacity-50"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Assets</h1>
          <p className="text-muted-foreground mt-2">
            Manage all uploaded files
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-mono">
              Total Storage
            </p>
            <p className="text-lg font-mono font-bold">
              {formatFileSize(totalSize.toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#334155]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">
                Total Files
              </p>
              <p className="text-2xl font-mono font-bold">{files.length}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-[#334155]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">
                Storage Used
              </p>
              <p className="text-2xl font-mono font-bold">
                {formatFileSize(totalSize.toString())}
              </p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-[#334155]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">
                Total Downloads
              </p>
              <p className="text-2xl font-mono font-bold">
                {files.reduce((acc, f) => acc + f.downloads, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 rounded-none font-mono"
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
        <div className="border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-mono font-semibold text-lg mb-2">
            {searchQuery || filterPortal !== "all"
              ? "No files found"
              : "No files yet"}
          </h3>
          <p className="text-muted-foreground font-mono text-sm">
            {searchQuery || filterPortal !== "all"
              ? "Try adjusting your search or filters"
              : "Files uploaded to your portals will appear here"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    File
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Portal
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Storage
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Size
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Uploaded
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Downloads
                  </th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">
                    Security
                  </th>
                  <th className="text-right p-4 font-mono text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getFileIcon(file.mimeType)}
                        </span>
                        <div>
                          <p className="font-mono font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {file.mimeType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {file.portal.name}
                        </span>
                        <a
                          className="text-[#334155] hover:text-[rgba(51,65,85,0.8)]"
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
                        <span className="font-mono text-sm">
                          {getStorageLabel(getStorageType(file.storageUrl))}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">
                        {formatFileSize(file.size)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {formatDate(file.uploadedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">
                        {file.downloads}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {file.passwordHash ? (
                          <>
                            <Lock className="w-4 h-4 text-green-600" />
                            <span className="font-mono text-sm text-green-600">
                              Protected
                            </span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-400">
                              Open
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          className="rounded-none font-mono"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          className="rounded-none font-mono"
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
