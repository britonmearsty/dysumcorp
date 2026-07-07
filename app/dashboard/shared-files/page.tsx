"use client";

import { logger } from "@/lib/logger";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Link,
  Clock,
  Download,
  Trash2,
  File,
  Copy,
  Check,
  X,
  Lock,
  EyeOff,
  Globe,
  Plus,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";
import { useSession } from "@/lib/auth-client";

interface SharedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  shareToken: string;
  hasPassword: boolean;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  createdAt: string;
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExpiryLabel(file: SharedFile): { label: string; color: string } {
  if (file.expiresAt) {
    const expiryDate = new Date(file.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 0) return { label: "Expired", color: "text-red-500" };
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return { label: "Expires today", color: "text-orange-500" };
    if (diffDays < 7) return { label: `Expires in ${diffDays}d`, color: "text-yellow-500" };
    return { label: `Expires ${expiryDate.toLocaleDateString()}`, color: "text-muted-foreground" };
  }
  if (file.maxDownloads) {
    const remaining = file.maxDownloads - file.downloadCount;
    if (remaining <= 0) return { label: "Limit reached", color: "text-red-500" };
    if (remaining <= 3) return { label: `${remaining} downloads left`, color: "text-orange-500" };
    return { label: `${remaining} downloads left`, color: "text-muted-foreground" };
  }
  return { label: "No expiry", color: "text-emerald-500" };
}

export default function SharedFilesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { showToast } = useToast();
  const { data: session, isPending } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(0);
  const [maxDownloads, setMaxDownloads] = useState<number>(0);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/shared-files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      logger.error("Failed to fetch shared files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchFiles();
  }, [session, fetchFiles]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const createRes = await fetch("/api/shared-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadFile.name,
          size: uploadFile.size,
          mimeType: uploadFile.type || "application/octet-stream",
          password: password || undefined,
          expiresInHours: expiresInHours > 0 ? expiresInHours : undefined,
          maxDownloads: maxDownloads > 0 ? maxDownloads : undefined,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create share link");
      }

      const { presignedUrl } = await createRes.json();

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": uploadFile.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      showToast("File uploaded and shared successfully", "success");
      setShowUpload(false);
      setUploadFile(null);
      setPassword("");
      setExpiresInHours(0);
      setMaxDownloads(0);
      fetchFiles();
    } catch (error: any) {
      showToast(error.message || "Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/shared-files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        showToast("File deleted", "success");
      } else {
        showToast("Failed to delete file", "error");
      }
    } catch {
      showToast("Failed to delete file", "error");
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (isPending || loading) {
    return (
      <div className="w-full overflow-hidden">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Shared Files</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-lg">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Shared Files</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-lg">
            Upload files and share them via link with optional password, expiry, and download limits.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
          type="button"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Plus className="w-4 h-4" />
          Share File
        </button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 bg-bg-card rounded-[14px] border border-border overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upload & Share</h2>
                <button
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  type="button"
                  onClick={() => setShowUpload(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className={getFileIconColor(uploadFile.type || "")}>
                      {getFileIcon(uploadFile.type || "", "w-8 h-8")}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{uploadFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size.toString())}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-foreground font-medium">Click to select a file</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Lock className="w-3.5 h-3.5 inline mr-1" />
                    Password (optional)
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
                    placeholder="Leave blank for no password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Expires in (hours)
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
                    min="0"
                    placeholder="0 = no expiry"
                    type="number"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Download className="w-3.5 h-3.5 inline mr-1" />
                    Max downloads
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
                    min="0"
                    placeholder="0 = unlimited"
                    type="number"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  type="button"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                  disabled={!uploadFile || uploading}
                  type="button"
                  onClick={handleUpload}
                >
                  {uploading ? "Uploading..." : "Upload & Share"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">All Shared Files</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-0">
          {files.length > 0 ? (
            <div className="divide-y divide-border">
              {files.map((file) => {
                const expiry = getExpiryLabel(file);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex-shrink-0 ${getFileIconColor(file.mimeType)}`}>
                      {getFileIcon(file.mimeType, "w-5 h-5 sm:w-6 sm:h-6")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{file.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                        <span className={expiry.color}>{expiry.label}</span>
                        {file.hasPassword && <Lock className="w-3 h-3" />}
                        <span>{file.downloadCount} download{file.downloadCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                        title="Copy share link"
                        type="button"
                        onClick={() => copyShareLink(file.shareToken)}
                      >
                        {copiedToken === file.shareToken ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Link className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                        title="Delete"
                        type="button"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20 px-4 sm:px-6">
              <div className="p-3 sm:p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                <Upload className="w-6 sm:w-8 h-6 sm:w-8 text-muted-foreground" />
              </div>
              <h4 className="text-foreground font-semibold mb-1">No shared files yet</h4>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Upload a file and get a shareable link to send to anyone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
