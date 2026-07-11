"use client";

import { logger } from "@/lib/logger";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Lock,
  Clock,
  Eye,
  File,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";

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
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    mimeType: string;
    hasPassword: boolean;
    expiresAt: string | null;
    maxDownloads: number | null;
    downloadCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [action, setAction] = useState<"idle" | "opening" | "downloading">("idle");
  const { showToast } = useToast();

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          if (res.status === 404) setError("File not found");
          else if (res.status === 410) setError("This file is no longer available");
          else setError("Failed to load file");
          return;
        }
        const data = await res.json();
        setFileInfo(data);
        if (data.hasPassword) setPasswordRequired(true);
      } catch {
        setError("Failed to load file");
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [token]);

  const getDownloadUrl = async () => {
    if (!token || !fileInfo) return null;
    const headers: Record<string, string> = {};
    if (fileInfo.hasPassword && password) {
      headers["x-file-password"] = password;
    }
    const res = await fetch(`/api/shared/download/${token}`, { headers });
    if (!res.ok) {
      if (res.status === 401) {
        setPasswordError(true);
        showToast("Invalid password", "error");
      } else if (res.status === 410) {
        showToast("This file is no longer available", "error");
      } else {
        showToast("Failed to access file", "error");
      }
      return null;
    }
    const data = await res.json();
    return data.downloadUrl as string;
  };

  const handleOpen = async () => {
    if (fetching) return;
    setFetching(true);
    setAction("opening");
    const url = await getDownloadUrl();
    if (url) {
      window.open(url, "_blank");
    }
    setFetching(false);
    setAction("idle");
  };

  const handleDownload = async () => {
    if (fetching) return;
    setFetching(true);
    setAction("downloading");
    const url = await getDownloadUrl();
    if (url && fileInfo) {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setFetching(false);
    setAction("idle");
  };

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
      setPasswordVerified(true);
    } catch {
      setPasswordError(true);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const [passwordVerified, setPasswordVerified] = useState(false);

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
          <h1 className="text-xl font-bold text-foreground mb-2">File Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!fileInfo) return null;

  const isPreviewable = canPreview(fileInfo.mimeType);
  const unlocked = !passwordRequired || passwordVerified;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="bg-bg-card rounded-[14px] border border-border shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${getFileIconColor(fileInfo.name)}`}>
              {getFileIcon(fileInfo.mimeType, "w-8 h-8")}
            </div>

            <h1 className="text-lg font-bold text-foreground truncate mb-1">
              {fileInfo.name}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {formatFileSize(fileInfo.size)}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs text-muted-foreground">
              {fileInfo.expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Expires {new Date(fileInfo.expiresAt).toLocaleDateString()}
                </span>
              )}
              {fileInfo.hasPassword && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Password protected
                </span>
              )}
              {fileInfo.maxDownloads && (
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {fileInfo.maxDownloads - fileInfo.downloadCount} of {fileInfo.maxDownloads} downloads left
                </span>
              )}
            </div>

            {passwordRequired && !passwordVerified && (
              <div className="mb-4">
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg mb-3">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    This file is password protected. Enter the password to continue.
                  </p>
                </div>
                <input
                  className={`w-full px-3 py-2.5 bg-card border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring outline-none ${passwordError ? "border-red-500" : "border-border"}`}
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                />
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1">Invalid password. Please try again.</p>
                )}
                <button
                  className="w-full mt-2 px-4 py-2.5 bg-foreground text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                  disabled={!password || verifyingPassword}
                  type="button"
                  onClick={handleVerifyPassword}
                >
                  {verifyingPassword ? "Verifying..." : "Unlock"}
                </button>
              </div>
            )}

            {unlocked && (
              <div className="flex flex-col gap-3">
                {isPreviewable && (
                  <button
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl font-semibold text-sm hover:bg-muted transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={fetching}
                    type="button"
                    onClick={handleOpen}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {action === "opening" ? "Opening..." : "Open in Browser"}
                  </button>
                )}
                <button
                  className="w-full px-4 py-3 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={fetching}
                  type="button"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                  {action === "downloading" ? "Downloading..." : "Download File"}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
