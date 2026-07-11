"use client";

import { logger } from "@/lib/logger";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Link,
  Clock,
  Download,
  Trash2,
  Copy,
  Check,
  X,
  Lock,
  Plus,
  Loader2,
  Package,
  File,
  Hash,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";
import { useSession } from "@/lib/auth-client";

interface SharedFileInfo {
  id: string;
  name: string;
  size: string;
  mimeType: string;
}

interface ShareBundle {
  id: string;
  shareToken: string;
  passwordHash: string | null;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  createdAt: string;
  files: SharedFileInfo[];
}

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  shareToken?: string;
  shareUrl?: string;
  error?: string;
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

function getExpiryLabel(bundle: ShareBundle): { label: string; color: string } {
  if (bundle.expiresAt) {
    const expiryDate = new Date(bundle.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 0) return { label: "Expired", color: "text-red-500" };
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return { label: "Expires today", color: "text-orange-500" };
    if (diffDays < 7) return { label: `Expires in ${diffDays}d`, color: "text-yellow-500" };
    return { label: `Expires ${expiryDate.toLocaleDateString()}`, color: "text-muted-foreground" };
  }
  if (bundle.maxDownloads) {
    const remaining = bundle.maxDownloads - bundle.downloadCount;
    if (remaining <= 0) return { label: "Limit reached", color: "text-red-500" };
    if (remaining <= 3) return { label: `${remaining} downloads left`, color: "text-orange-500" };
    return { label: `${remaining} downloads left`, color: "text-muted-foreground" };
  }
  return { label: "No expiry", color: "text-emerald-500" };
}

export default function SharedFilesPage() {
  const [bundles, setBundles] = useState<ShareBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { showToast } = useToast();
  const { data: session, isPending } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(0);
  const [maxDownloads, setMaxDownloads] = useState<number>(0);

  const fetchBundles = useCallback(async () => {
    try {
      const res = await fetch("/api/shared-files");
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      logger.error("Failed to fetch share bundles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchBundles();
  }, [session, fetchBundles]);

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newItems: UploadItem[] = Array.from(selectedFiles).map((f) => ({
      file: f,
      status: "pending" as const,
    }));
    setUploadItems((prev) => [...prev, ...newItems]);
  };

  const removeUploadItem = (index: number) => {
    setUploadItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadItems.length === 0) return;
    setUploading(true);

    try {
      const filesPayload = uploadItems.map((item) => ({
        name: item.file.name,
        size: item.file.size,
        mimeType: item.file.type || "application/octet-stream",
      }));

      const createRes = await fetch("/api/shared-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: filesPayload,
          password: password || null,
          expiresInHours: expiresInHours > 0 ? expiresInHours : null,
          maxDownloads: maxDownloads > 0 ? maxDownloads : null,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create share bundle");
      }

      const data = await createRes.json();

      for (let i = 0; i < data.files.length; i++) {
        const { presignedUrl } = data.files[i];
        const file = uploadItems[i].file;

        setUploadItems((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p)),
        );

        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);

        setUploadItems((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: "done", shareToken: data.shareToken, shareUrl: data.shareUrl }
              : p,
          ),
        );
      }

      showToast(`Bundle with ${uploadItems.length} file(s) created`, "success");
      fetchBundles();
      resetUploadForm();
    } catch (error: any) {
      showToast(error.message || "Upload failed", "error");
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadItems([]);
    setPassword("");
    setExpiresInHours(0);
    setMaxDownloads(0);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/shared-files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBundles((prev) => prev.filter((b) => b.id !== id));
        showToast("Bundle deleted", "success");
      } else {
        showToast("Failed to delete bundle", "error");
      }
    } catch {
      showToast("Failed to delete bundle", "error");
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

  const pendingCount = uploadItems.filter(
    (i) => i.status === "pending" || i.status === "uploading",
  ).length;
  const hasResults = uploadItems.some(
    (i) => i.status === "done" || i.status === "error",
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Shared Files</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-lg">
            Upload and share multiple files as a single bundle with optional password, expiry, and download limits.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
          type="button"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Plus className="w-4 h-4" />
          Share Files
        </button>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
          >
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">New Share Bundle</h2>
              <button
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                type="button"
                onClick={resetUploadForm}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  type="file"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground font-medium">Click to select files</p>
                <p className="text-sm text-muted-foreground mt-1">All files will be bundled into a single share link</p>
              </div>

              {uploadItems.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadItems.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="flex items-center gap-3 p-2.5 bg-muted rounded-lg"
                    >
                      <span className={getFileIconColor(item.file.type || "")}>
                        {getFileIcon(item.file.type || "", "w-5 h-5")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size.toString())}</p>
                      </div>
                      {item.status === "pending" && (
                        <button
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          type="button"
                          onClick={() => removeUploadItem(index)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.status === "uploading" && (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                      {item.status === "done" && item.shareUrl && (
                        <button
                          className="p-1.5 text-emerald-500 hover:text-emerald-600 rounded"
                          title="Copy share link"
                          type="button"
                          onClick={() => copyShareLink(item.shareToken!)}
                        >
                          {copiedToken === item.shareToken ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {item.status === "error" && (
                        <span className="text-xs text-red-500" title={item.error}>
                          Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!hasResults && (
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
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-border flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                type="button"
                onClick={resetUploadForm}
              >
                {hasResults ? "Close" : "Cancel"}
              </button>
              {!hasResults && (
                <button
                  className="px-6 py-2 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                  disabled={uploadItems.length === 0 || uploading}
                  type="button"
                  onClick={handleUpload}
                >
                  {uploading
                    ? `Uploading...`
                    : `Upload & Share (${uploadItems.length} file${uploadItems.length !== 1 ? "s" : ""})`}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">All Share Bundles</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-0">
          {bundles.length > 0 ? (
            <div className="divide-y divide-border">
              {bundles.map((bundle) => {
                const expiry = getExpiryLabel(bundle);
                return (
                  <div
                    key={bundle.id}
                    className="p-3 sm:p-5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground text-sm sm:text-base">
                          {bundle.files.length} file{bundle.files.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                          title="Copy share link"
                          type="button"
                          onClick={() => copyShareLink(bundle.shareToken)}
                        >
                          {copiedToken === bundle.shareToken ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Link className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                          title="Delete"
                          type="button"
                          onClick={() => handleDelete(bundle.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {bundle.files.map((f) => (
                        <span
                          key={f.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs text-muted-foreground"
                        >
                          <File className="w-3 h-3" />
                          {f.name}
                          <span className="text-muted-foreground/60">({formatFileSize(f.size)})</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(bundle.createdAt)}</span>
                      <span className={expiry.color}>{expiry.label}</span>
                      {bundle.passwordHash && <Lock className="w-3 h-3" />}
                      {bundle.maxDownloads && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {bundle.downloadCount}/{bundle.maxDownloads}
                        </span>
                      )}
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
                Upload files and get a single shareable link to send to anyone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
