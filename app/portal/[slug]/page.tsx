"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lock, Loader2, AlertCircle, Upload } from "lucide-react";
import { Toaster, toast } from "sonner";

import { PortalHeader } from "@/components/portal/portal-header";
import { PortalInput } from "@/components/portal/portal-input";
import { PortalTextarea } from "@/components/portal/portal-textarea";
import { PortalDropZone } from "@/components/portal/portal-drop-zone";
import { PortalFileList } from "@/components/portal/portal-file-list";
import { PortalButton } from "@/components/portal/portal-button";
import { LogoDisplay } from "@/components/logo-display";
import { PortalSuccessView } from "@/components/portal/portal-success-view";
import { PortalChecklist } from "@/components/portal/portal-checklist";
import { uploadFiles } from "@/lib/upload-manager";

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  sortOrder: number;
}

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  isActive: boolean;
  isOwnerSubscriber: boolean;
  // Branding
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  gradientEnabled?: boolean;
  logoUrl: string | null;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  // Storage
  storageProvider: string | null;
  storageFolderId: string | null;
  storageFolderPath: string | null;
  useClientFolders: boolean;
  // Security
  password: string | null;
  requireClientName: boolean;
  requireClientEmail: boolean;
  maxFileSize: string;
  allowedFileTypes: string[] | null;
  // Messaging
  welcomeMessage: string | null;
  welcomeToastMessage?: string | null;
  welcomeToastDelay?: number;
  welcomeToastDuration?: number;
  submitButtonText: string;
  successMessage: string;
  textboxSectionEnabled: boolean;
  textboxSectionTitle: string | null;
  textboxSectionPlaceholder: string | null;
  textboxSectionRequired: boolean;
  userId: string;
  fileCount?: number;
  fileLimit?: number;
  expiresAt: string | null;
  maxUploads: number | null;
  uploadCount: number;
  checklistItems: ChecklistItem[];
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function PublicPortalPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [textboxValue, setTextboxValue] = useState("");
  const [sentFiles, setSentFiles] = useState<
    Array<{ name: string; size: number; type: string }>
  >([]);
  const [failedFiles, setFailedFiles] = useState<
    Array<{ name: string; size: number; type: string; error?: string }>
  >([]);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [slotFiles, setSlotFiles] = useState<Record<string, UploadFile[]>>({});

  useEffect(() => {
    fetchPortal();
  }, [slug]);

  // Warn user before closing if uploads are in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        return "Uploads in progress. Closing will cancel your uploads. Are you sure?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploading]);

  // Show welcome toast when portal is loaded and authenticated
  useEffect(() => {
    if (portal && authenticated && portal.welcomeToastMessage) {
      const delay = portal.welcomeToastDelay || 1000;
      const duration = portal.welcomeToastDuration || 3000;

      const timer = setTimeout(() => {
        toast(portal.welcomeToastMessage, {
          duration: duration,
        });
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [portal, authenticated]);

  const fetchPortal = async () => {
    try {
      const response = await fetch(`/api/portals/public/${slug}`);

      if (response.ok) {
        const data = await response.json();
        const p = data.portal as Portal;

        setPortal(p);

        if (p.password) {
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
        }
      } else if (response.status === 403) {
        const errorData = await response.json();

        if (errorData.code === "PORTAL_EXPIRED") {
          setBlocked(true);
          setBlockedReason("This portal has expired and is no longer accepting uploads.");
          setLoading(false);
          return;
        }
        if (errorData.code === "PORTAL_UPLOAD_LIMIT_REACHED") {
          setBlocked(true);
          setBlockedReason("This portal has reached its upload limit.");
          setLoading(false);
          return;
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portalPassword.trim()) {
      setPasswordError("Please enter the password");

      return;
    }

    setAuthenticating(true);
    setPasswordError("");

    try {
      const response = await fetch(`/api/portals/${portal?.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: portalPassword }),
      });

      if (response.ok) {
        setAuthenticated(true);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (error) {
      setPasswordError("Failed to verify password");
    } finally {
      setAuthenticating(false);
    }
  };

  const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split(".").pop() || "";

    // Extension → MIME category map for browsers that report empty file.type
    const extToCategory: Record<string, string> = {
      // Audio
      mp3: "audio",
      wav: "audio",
      ogg: "audio",
      flac: "audio",
      aac: "audio",
      m4a: "audio",
      wma: "audio",
      opus: "audio",
      // Video
      mp4: "video",
      mov: "video",
      avi: "video",
      mkv: "video",
      webm: "video",
      wmv: "video",
      flv: "video",
      m4v: "video",
      // Image
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      webp: "image",
      svg: "image",
      bmp: "image",
      ico: "image",
      tiff: "image",
      // Archive - map to actual MIME types for compatibility
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
      bz2: "application/x-bzip2",
      xz: "application/x-xz",
      pen: "application/x-tar",
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
    };

    const textExtensions = [
      "txt",
      "md",
      "markdown",
      "js",
      "jsx",
      "ts",
      "tsx",
      "json",
      "html",
      "htm",
      "css",
      "scss",
      "sass",
      "less",
      "xml",
      "yaml",
      "yml",
      "csv",
      "log",
      "py",
      "rb",
      "php",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "cs",
      "go",
      "rs",
      "swift",
      "kt",
      "sql",
      "sh",
      "bash",
      "zsh",
      "ps1",
      "bat",
      "cmd",
      "ini",
      "conf",
      "cfg",
      "toml",
      "env",
      "gitignore",
      "dockerfile",
    ];

    return allowedTypes.some((allowedType) => {
      const allowed = allowedType.toLowerCase().trim();

      if (allowed.endsWith("/*")) {
        const baseType = allowed.replace("/*", "");

        if (baseType === "text") {
          return (
            textExtensions.includes(fileExtension) ||
            fileType.startsWith("text")
          );
        }
        if (baseType === "archive") {
          return (
            extToCategory[fileExtension] === "archive" ||
            fileType.includes("archive")
          );
        }
        // Match by MIME type, or fall back to extension category when file.type is empty
        if (fileType) return fileType.startsWith(baseType);

        return extToCategory[fileExtension] === baseType;
      }

      // Check if allowed type matches the mapped MIME type for the extension
      const mappedMime = extToCategory[fileExtension];
      if (mappedMime && mappedMime === allowed) return true;

      // Exact MIME type match
      if (fileType && fileType === allowed) return true;
      // Extension match (with dot)
      if (allowed.startsWith(".")) return fileName.endsWith(allowed);
      // Extension match (without dot)
      if (fileExtension === allowed) return true;
      // Handle comma-separated list of MIME types
      if (allowed.includes(",")) {
        return allowed.split(",").some((type) => type.trim() === fileType);
      }

      return false;
    });
  };

  const addFiles = (incoming: FileList) => {
    if (!portal) return;

    const selectedFiles = Array.from(incoming);
    const portalMaxSize = parseInt(portal.maxFileSize);
    const portalAllowedTypes = portal.allowedFileTypes || [];

    const newFiles: UploadFile[] = selectedFiles.map((file) => {
      // Check file type
      if (
        portalAllowedTypes.length > 0 &&
        !isFileTypeAllowed(file, portalAllowedTypes)
      ) {
        return {
          id: Math.random().toString(36).slice(2),
          file,
          progress: 0,
          status: "error" as const,
          error: "File type not allowed",
        };
      }

      // Check file size
      if (file.size > portalMaxSize) {
        return {
          id: Math.random().toString(36).slice(2),
          file,
          progress: 0,
          status: "error" as const,
          error: `Exceeds ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit`,
        };
      }

      return {
        id: Math.random().toString(36).slice(2),
        file,
        progress: 0,
        status: "pending" as const,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
    setUploadStatus("idle");
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setCompletedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (!portal) {
      setErrorMessage("Portal information not loaded");
      setUploadStatus("error");

      return;
    }

    if (portal.requireClientName && !uploaderName.trim()) {
      setErrorMessage("Please enter your name");
      setUploadStatus("error");

      return;
    }

    if (portal.requireClientEmail) {
      if (!uploaderEmail.trim()) {
        setErrorMessage("Please enter your email");
        setUploadStatus("error");

        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(uploaderEmail)) {
        setErrorMessage("Please enter a valid email address");
        setUploadStatus("error");

        return;
      }
    }

    if (
      portal.textboxSectionEnabled &&
      portal.textboxSectionRequired &&
      !textboxValue.trim()
    ) {
      setErrorMessage(
        `Please fill in the ${portal.textboxSectionTitle || "Notes"} field`,
      );
      setUploadStatus("error");

      return;
    }

    const mainPending = files.filter((f) => f.status === "pending");
    const slotPending = Object.entries(slotFiles).flatMap(([slotId, slotList]) =>
      slotList.filter((f) => f.status === "pending").map((f) => ({ ...f, slotId })),
    );

    const allFiles = [...mainPending, ...slotPending];

    if (allFiles.length === 0) {
      setErrorMessage("Please select at least one valid file");
      setUploadStatus("error");

      return;
    }

    const indexMap = allFiles.map((f) => ({
      isSlot: "slotId" in f,
      slotId: (f as any).slotId as string | undefined,
      fileId: f.id,
    }));

    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    // Mark all pending files as uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending"
          ? { ...f, status: "uploading" as const, progress: 0 }
          : f,
      ),
    );
    setSlotFiles((prev) => {
      const next: Record<string, UploadFile[]> = {};
      for (const [slotId, slotList] of Object.entries(prev)) {
        next[slotId] = slotList.map((f) =>
          f.status === "pending"
            ? { ...f, status: "uploading" as const, progress: 0 }
            : f,
        );
      }
      return next;
    });

    const successful: Array<{ name: string; size: number; type: string }> = [];
    const failed: Array<{
      name: string;
      size: number;
      type: string;
      error?: string;
    }> = [];

    try {
      await uploadFiles(
        allFiles.map((f) => f.file),
        {
          portalId: portal.id,
          password: portalPassword || undefined,
          uploaderName: uploaderName.trim(),
          uploaderEmail: uploaderEmail.trim(),
          uploaderNotes: textboxValue.trim() || undefined,
          onFileProgress: (fileIndex, progress) => {
            const entry = indexMap[fileIndex];
            if (!entry) return;
            if (entry.isSlot) {
              setSlotFiles((prev) => ({
                ...prev,
                [entry.slotId!]: prev[entry.slotId!].map((sf) =>
                  sf.id === entry.fileId ? { ...sf, progress: Math.floor(progress) } : sf,
                ),
              }));
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === entry.fileId ? { ...f, progress: Math.floor(progress) } : f,
                ),
              );
            }
          },
          onFileComplete: (fileIndex, result) => {
            const entry = indexMap[fileIndex];
            if (!entry) return;
            const allFile = allFiles[fileIndex];
            if (!allFile) return;

            if (result.success) {
              successful.push({
                name: allFile.file.name,
                size: allFile.file.size,
                type: allFile.file.type,
              });
              if (entry.isSlot) {
                setSlotFiles((prev) => ({
                  ...prev,
                  [entry.slotId!]: prev[entry.slotId!].map((sf) =>
                    sf.id === entry.fileId
                      ? { ...sf, progress: 100, status: "done" as const }
                      : sf,
                  ),
                }));
              } else {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === entry.fileId
                      ? { ...f, progress: 100, status: "done" as const }
                      : f,
                  ),
                );
                setTimeout(() => {
                  setFiles((prev) => {
                    const completed = prev.find((f) => f.id === entry.fileId);
                    if (completed)
                      setCompletedFiles((c) => [
                        ...c,
                        { ...completed, progress: 100, status: "done" as const },
                      ]);
                    return prev.filter((f) => f.id !== entry.fileId);
                  });
                }, 600);
              }
            } else {
              failed.push({
                name: allFile.file.name,
                size: allFile.file.size,
                type: allFile.file.type,
                error: result.error ?? "Upload failed",
              });
              if (entry.isSlot) {
                setSlotFiles((prev) => ({
                  ...prev,
                  [entry.slotId!]: prev[entry.slotId!].map((sf) =>
                    sf.id === entry.fileId
                      ? { ...sf, status: "error" as const, error: result.error ?? "Upload failed", progress: 0 }
                      : sf,
                  ),
                }));
              } else {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === entry.fileId
                      ? { ...f, status: "error" as const, error: result.error ?? "Upload failed", progress: 0 }
                      : f,
                  ),
                );
              }
            }
          },
        },
      );

      if (successful.length > 0 || failed.length > 0) {
        setSentFiles(successful);
        setFailedFiles(failed);
        setUploadStatus("success");
      } else {
        setErrorMessage("All uploads failed. Please try again.");
        setUploadStatus("error");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.";

      setErrorMessage(errorMsg);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadMore = () => {
    setUploadStatus("idle");
    setFiles([]);
    setCompletedFiles([]);
    setSentFiles([]);
    setFailedFiles([]);
    setSlotFiles({});
  };

  const handleSlotFiles = (slotId: string, incoming: FileList) => {
    if (!portal) return;

    const selectedFiles = Array.from(incoming);
    const portalMaxSize = parseInt(portal.maxFileSize);
    const portalAllowedTypes = portal.allowedFileTypes || [];

    const newFiles: UploadFile[] = selectedFiles.map((file) => {
      if (
        portalAllowedTypes.length > 0 &&
        !isFileTypeAllowed(file, portalAllowedTypes)
      ) {
        return {
          id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file,
          progress: 0,
          status: "error" as const,
          error: "File type not allowed",
        };
      }

      if (file.size > portalMaxSize) {
        return {
          id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file,
          progress: 0,
          status: "error" as const,
          error: `Exceeds ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit`,
        };
      }

      return {
        id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: "pending" as const,
      };
    });

    setSlotFiles((prev) => ({
      ...prev,
      [slotId]: [...(prev[slotId] || []), ...newFiles],
    }));
  };

  const handleRemoveSlotFile = (slotId: string, fileId: string) => {
    setSlotFiles((prev) => ({
      ...prev,
      [slotId]: prev[slotId].filter((f) => f.id !== fileId),
    }));
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: portal?.backgroundColor || "#f1f5f9" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: portal?.primaryColor || "#6366f1" }}
        />
      </div>
    );
  }

  if (blocked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: portal?.backgroundColor || "#f1f5f9" }}
      >
        <div className="max-w-md w-full text-center space-y-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h2 className="text-xl font-bold mt-4">Portal Unavailable</h2>
            <p className="text-muted-foreground mt-2">{blockedReason}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portal) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f1f5f9" }}
      >
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-slate-800">
            Portal Unavailable
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            This portal is not currently accepting uploads. Please contact the
            portal owner for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Password protection screen
  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: portal.backgroundColor }}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl border shadow-lg"
          style={{
            backgroundColor: portal.cardBackgroundColor,
            borderColor: `${portal.primaryColor}30`,
          }}
        >
          <div className="text-center mb-6">
            {portal.logoUrl && (
              <div className="flex justify-center mb-4">
                <LogoDisplay
                  logoUrl={portal.logoUrl}
                  alt={portal.name}
                  size="lg"
                />
              </div>
            )}
            <h1
              className="text-2xl font-bold"
              style={{ color: portal.textColor }}
            >
              {portal.name}
            </h1>
            <p className="mt-2 text-sm" style={{ color: portal.textColor }}>
              This portal is password protected
            </p>
          </div>

          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: portal.textColor }}
              />
              <input
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-4 rounded-xl border outline-none transition-all font-medium"
                placeholder="Enter password"
                style={{
                  backgroundColor: portal.backgroundColor,
                  color: portal.textColor,
                  borderColor: `${portal.primaryColor}30`,
                }}
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <p className="text-sm font-bold text-red-500">{passwordError}</p>
            )}
            <PortalButton
              gradientEnabled={portal.gradientEnabled}
              loading={authenticating}
              primaryColor={portal.primaryColor}
              secondaryColor={portal.secondaryColor}
              type="submit"
            >
              Access Portal
            </PortalButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: portal.backgroundColor }}
    >
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#1e293b",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          },
        }}
      />

      {/* Header */}
      <PortalHeader
        companyEmail={portal.companyEmail}
        companyWebsite={portal.companyWebsite}
        gradientEnabled={portal.gradientEnabled}
        logoUrl={portal.logoUrl}
        name={portal.name}
        primaryColor={portal.primaryColor}
        secondaryColor={portal.secondaryColor}
        textColor={portal.textColor}
        welcomeMessage={portal.welcomeMessage}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {uploadStatus === "success" ? (
            <PortalSuccessView
              gradientEnabled={portal.gradientEnabled}
              primaryColor={portal.primaryColor}
              secondaryColor={portal.secondaryColor}
              sentFiles={sentFiles}
              failedFiles={failedFiles}
              successMessage={portal.successMessage}
              textColor={portal.textColor}
              uploaderEmail={uploaderEmail}
              uploaderName={uploaderName}
              onUploadMore={handleUploadMore}
            />
          ) : (
            <div
              className="rounded-2xl overflow-hidden border shadow-md"
              style={{
                backgroundColor: portal.cardBackgroundColor || "#ffffff",
                borderColor: `${portal.primaryColor}20`,
              }}
            >
              <div className="p-8 space-y-5">
                {/* Name */}
                {portal.requireClientName && (
                  <PortalInput
                    required
                    label="Your Name"
                    placeholder="Jane Doe"
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    type="text"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                  />
                )}

                {/* Email */}
                {portal.requireClientEmail && (
                  <PortalInput
                    required
                    label="Email Address"
                    placeholder="jane@example.com"
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    type="email"
                    value={uploaderEmail}
                    onChange={(e) => setUploaderEmail(e.target.value)}
                  />
                )}

                {/* Textbox Section */}
                {portal.textboxSectionEnabled && (
                  <PortalTextarea
                    label="Notes"
                    placeholder={
                      portal.textboxSectionPlaceholder ||
                      "Enter any notes or comments..."
                    }
                    primaryColor={portal.primaryColor}
                    required={portal.textboxSectionRequired}
                    rows={4}
                    textColor={portal.textColor}
                    value={textboxValue}
                    onChange={(e) => setTextboxValue(e.target.value)}
                  />
                )}

                {/* File limit indicator — only for non-subscriber (free) portals */}
                {!portal.isOwnerSubscriber &&
                  portal.fileLimit !== undefined &&
                  portal.fileCount !== undefined && (
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm"
                      style={{
                        borderColor: `${portal.primaryColor}30`,
                        background: `${portal.primaryColor}08`,
                        color: portal.textColor,
                      }}
                    >
                      <div className="flex-1 flex items-center gap-2">
                        {portal.fileCount >= portal.fileLimit ? (
                          <span className="font-medium text-amber-600">
                            File limit reached
                          </span>
                        ) : (
                          <>
                            <span className="font-medium">
                              {portal.fileLimit - portal.fileCount} file
                              {portal.fileLimit - portal.fileCount !== 1
                                ? "s"
                                : ""}{" "}
                              remaining
                            </span>
                            <span className="text-slate-400">·</span>
                          </>
                        )}
                        <span className="text-slate-500">
                          {portal.fileCount} of {portal.fileLimit} used
                        </span>
                      </div>
                    </div>
                  )}

                {/* Drop Zone or File List */}
                {portal.checklistItems && portal.checklistItems.length > 0 ? (
                  <div className="space-y-6">
                    <PortalChecklist
                      items={portal.checklistItems}
                      primaryColor={portal.primaryColor}
                      slotFiles={slotFiles}
                      textColor={portal.textColor}
                      uploading={uploading}
                      onFilesSelected={handleSlotFiles}
                      onRemoveFile={handleRemoveSlotFile}
                    />

                    {!uploading &&
                      Object.values(slotFiles).some((files) =>
                        files.some((f) => f.status === "pending"),
                      ) && (
                        <PortalButton
                          gradientEnabled={portal.gradientEnabled}
                          icon={<Upload className="w-4 h-4" />}
                          primaryColor={portal.primaryColor}
                          secondaryColor={portal.secondaryColor}
                          onClick={handleUpload}
                        >
                          {portal.submitButtonText}
                        </PortalButton>
                      )}
                  </div>
                ) : files.length === 0 ? (
                  <PortalDropZone
                    allowedFileTypes={portal.allowedFileTypes || undefined}
                    maxFileSize={parseInt(portal.maxFileSize)}
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    onFilesSelected={addFiles}
                  />
                ) : (
                  <>
                    <PortalFileList
                      completedFiles={completedFiles}
                      files={files}
                      gradientEnabled={portal.gradientEnabled}
                      primaryColor={portal.primaryColor}
                      secondaryColor={portal.secondaryColor}
                      textColor={portal.textColor}
                      uploading={uploading}
                      onAddMore={() => {
                        const input = document.createElement("input");

                        input.type = "file";
                        input.multiple = true;
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;

                          if (target.files) addFiles(target.files);
                        };
                        input.click();
                      }}
                      onRemove={removeFile}
                    />

                    {!uploading &&
                      files.filter((f) => f.status === "pending").length >
                        0 && (
                        <PortalButton
                          gradientEnabled={portal.gradientEnabled}
                          icon={<Upload className="w-4 h-4" />}
                          primaryColor={portal.primaryColor}
                          secondaryColor={portal.secondaryColor}
                          onClick={handleUpload}
                        >
                          {portal.submitButtonText}
                        </PortalButton>
                      )}
                  </>
                )}

                {/* Error Message */}
                {errorMessage &&
                  (uploadStatus === "error" || uploadStatus === "idle") && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                      <p className="text-red-600 text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {errorMessage}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div
            className="mt-8 p-4 rounded-2xl border bg-white/50 text-center shadow-sm"
            style={{ borderColor: `${portal.primaryColor}20` }}
          >
            <p
              className="text-sm flex items-center justify-center gap-2"
              style={{ color: portal.textColor }}
            >
              <Lock className="w-4 h-4" /> Your files are encrypted and securely
              stored
            </p>
          </div>
        </div>
      </main>

      {/* Footer - hidden for subscribers */}
      {!portal.isOwnerSubscriber && (
        <footer className="w-full py-5 px-6 border-t border-slate-200 bg-white flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-xs">
              Secure file delivery powered by
            </span>
            <span className="text-slate-700 text-xs ml-1 font-bold">
              Dysumcorp
            </span>
          </div>
          <span className="text-slate-300 text-xs">
            © 2026 Dysumcorp · All rights reserved.
          </span>
        </footer>
      )}
    </div>
  );
}
