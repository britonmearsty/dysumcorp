"use client";

import { logger } from "@/lib/logger";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Lock,
  Clock,
  Eye,
  File,
  AlertCircle,
  Package,
  Hash,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";

interface FileInfo {
  id: string;
  name: string;
  size: string;
  mimeType: string;
}

interface BundleInfo {
  hasPassword: boolean;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  files: FileInfo[];
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PREVIEWABLE_TYPES = [
  "image/",
  "video/",
  "audio/",
  "text/",
  "application/pdf",
  "application/json",
];

function canPreview(mimeType: string): boolean {
  return PREVIEWABLE_TYPES.some((t) => mimeType.startsWith(t));
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [fetchingFile, setFetchingFile] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const fetchBundle = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/shared/${token}`);
      if (!res.ok) {
        if (res.status === 404) setError("Bundle not found");
        else if (res.status === 410) setError("This share link is no longer available");
        else setError("Failed to load bundle");
        return;
      }
      const data = await res.json();
      setBundleInfo(data);
      if (!data.hasPassword) setVerified(true);
    } catch {
      setError("Failed to load bundle");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBundle(); }, [fetchBundle]);

  const handleVerifyPassword = async () => {
    if (!token || !password) return;
    setVerifyingPassword(true);
    setPasswordError(false);
    try {
      const res = await fetch(`/api/shared/verify-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setPasswordError(true);
        return;
      }
      setVerified(true);
    } catch {
      setPasswordError(true);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleFileAction = async (fileId: string, file: FileInfo, mode: "open" | "download") => {
    if (!token) return;
    setFetchingFile(fileId);
    try {
      const res = await fetch(
        `/api/shared/download/${token}?fileId=${fileId}&mode=${mode}`,
        {
          headers: bundleInfo?.hasPassword
            ? { "x-file-password": password }
            : undefined,
        },
      );

      if (res.status === 401) {
        setVerified(false);
        showToast("Session expired, please re-enter password", "warning");
        return;
      }

      if (res.status === 410) {
        setError("This share link is no longer available");
        return;
      }

      if (!res.ok) throw new Error("Failed to access file");

      const data = await res.json();

      if (mode === "open") {
        window.open(data.downloadUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to access file", "error");
    } finally {
      setFetchingFile(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
        >
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/40">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Share Link Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!bundleInfo) return null;

  if (bundleInfo.hasPassword && !verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
        >
          <div className="bg-bg-card rounded-[14px] border border-border shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/40">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-lg font-bold text-foreground text-center mb-1">Password Required</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This share is password protected. Enter the password to continue.
              </p>
              <input
                className={`w-full px-3 py-2.5 bg-card border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring outline-none ${passwordError ? "border-red-500" : "border-border"}`}
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
              />
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">Invalid password. Try again.</p>
              )}
              <button
                className="w-full mt-3 px-4 py-2.5 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                disabled={!password || verifyingPassword}
                type="button"
                onClick={handleVerifyPassword}
              >
                {verifyingPassword ? "Verifying..." : "Unlock"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="bg-bg-card rounded-[14px] border border-border shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center border border-border">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Shared Files</h1>
                <p className="text-sm text-muted-foreground">
                  {bundleInfo.files.length} file{bundleInfo.files.length !== 1 ? "s" : ""} in this bundle
                </p>
              </div>
            </div>

            {(bundleInfo.expiresAt || bundleInfo.maxDownloads) && (
              <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-muted-foreground">
                {bundleInfo.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Expires {new Date(bundleInfo.expiresAt).toLocaleDateString()}
                  </span>
                )}
                {bundleInfo.maxDownloads && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {bundleInfo.maxDownloads - bundleInfo.downloadCount} of {bundleInfo.maxDownloads} downloads left
                  </span>
                )}
              </div>
            )}

            <div className="space-y-3">
              {bundleInfo.files.map((file) => {
                const isPreviewable = canPreview(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                  >
                    <div className={`flex-shrink-0 ${getFileIconColor(file.name)}`}>
                      {getFileIcon(file.mimeType, "w-6 h-6")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isPreviewable && (
                        <button
                          className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          disabled={fetchingFile === file.id}
                          type="button"
                          onClick={() => handleFileAction(file.id, file, "open")}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 inline" />
                          Open
                        </button>
                      )}
                      <button
                        className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                        disabled={fetchingFile === file.id}
                        type="button"
                        onClick={() => handleFileAction(file.id, file, "download")}
                      >
                        <Download className="w-3.5 h-3.5 mr-1 inline" />
                        {fetchingFile === file.id ? "..." : "Download"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
