"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lock, Loader2, AlertCircle, Upload, Shield } from "lucide-react";
import { Toaster, toast } from "sonner";

import { PortalHeader } from "@/components/portal/portal-header";
import { PortalInput } from "@/components/portal/portal-input";
import { PortalTextarea } from "@/components/portal/portal-textarea";
import { PortalDropZone } from "@/components/portal/portal-drop-zone";
import { PortalFileList } from "@/components/portal/portal-file-list";
import { PortalButton } from "@/components/portal/portal-button";
import { LogoDisplay } from "@/components/logo-display";
import { PortalSuccessView } from "@/components/portal/portal-success-view";
import { PortalChecklist } from "@/components/portal/portal-check-list";
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
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  gradientEnabled?: boolean;
  logoUrl: string | null;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  storageProvider: string | null;
  storageFolderId: string | null;
  storageFolderPath: string | null;
  useClientFolders: boolean;
  password: string | null;
  requireClientName: boolean;
  requireClientEmail: boolean;
  maxFileSize: string;
  allowedFileTypes: string[] | null;
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
  speed?: string;
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
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [textboxValue, setTextboxValue] = useState("");
  const [sentFiles, setSentFiles] = useState<Array<{ name: string; size: number; type: string }>>([]);
  const [failedFiles, setFailedFiles] = useState<Array<{ name: string; size: number; type: string; error?: string }>>([]);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [slotFiles, setSlotFiles] = useState<Record<string, UploadFile[]>>({});

  useEffect(() => {
    fetchPortal();
  }, [slug]);

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

  useEffect(() => {
    if (portal && authenticated && portal.welcomeToastMessage) {
      const delay = portal.welcomeToastDelay || 1000;
      const duration = portal.welcomeToastDuration || 3000;
      const timer = setTimeout(() => {
        toast(portal.welcomeToastMessage, { duration });
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
        setAuthenticated(!p.password);
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
    } catch {
      setPasswordError("Failed to verify password");
    } finally {
      setAuthenticating(false);
    }
  };

  const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split(".").pop() || "";

    const extToCategory: Record<string, string> = {
      mp3: "audio", wav: "audio", ogg: "audio", flac: "audio", aac: "audio",
      m4a: "audio", wma: "audio", opus: "audio", m4b: "audio", m4p: "audio",
      aiff: "audio", alac: "audio",
      mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
      wmv: "video", flv: "video", m4v: "video", "3gp": "video", "3g2": "video",
      mpg: "video", mpeg: "video", h264: "video",
      jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
      svg: "image", bmp: "image", ico: "image", tiff: "image", tif: "image",
      heic: "image", heif: "image", raw: "image", psd: "image", ai: "image", eps: "image",
      zip: "archive", rar: "archive",
      "7z": "archive", tar: "archive",
      gz: "archive", bz2: "archive", xz: "archive",
      pen: "archive", jar: "archive",
      iso: "archive", dmg: "archive",
      pdf: "application/pdf", doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      odt: "application/vnd.oasis.opendocument.text",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odp: "application/vnd.oasis.opendocument.presentation",
      rtf: "application/rtf", pages: "application/x-iwork-pages-sffpages",
      numbers: "application/x-iwork-numbers-sffnumbers",
      key: "application/x-iwork-keynote-sffkey", csv: "text/csv",
      accdb: "application/msaccess", mdb: "application/msaccess",
      mpp: "application/vnd.ms-project", mpt: "application/vnd.ms-project",
      vsd: "application/vnd.visio", vsdx: "application/vnd.ms-visio.drawing",
      one: "application/onenote", onetoc2: "application/onenote",
      dwg: "image/vnd.dwg", dxf: "application/dxf",
      indd: "application/x-indesign", sketch: "application/x-sketch",
      fig: "application/figma", xd: "application/figma",
      epub: "application/epub+zip", mobi: "application/x-mobipocket-ebook",
      azw: "application/x-mobipocket-ebook", azw3: "application/x-mobipocket-ebook",
      exe: "application/x-msdownload", msi: "application/x-msi",
      deb: "application/vnd.debian.binary-package", rpm: "application/x-rpm",
      pkg: "application/x-newton-compatible-pkg", appx: "application/appx",
      apk: "application/vnd.android.package-archive",
      sqlite: "application/x-sqlite3", sqlite3: "application/x-sqlite3",
      db: "application/x-sqlite3", db3: "application/x-sqlite3",
      stl: "model/stl", obj: "model/obj", fbx: "application/octet-stream",
      step: "application/octet-stream", stp: "application/octet-stream",
      iges: "application/octet-stream", igs: "application/octet-stream",
      "3mf": "application/octet-stream", blend: "application/octet-stream",
      glb: "model/gltf-binary", gltf: "model/gltf+json",
    };

    const textExtensions = [
      "txt", "md", "markdown", "js", "jsx", "ts", "tsx", "json", "html",
      "htm", "css", "scss", "sass", "less", "xml", "yaml", "yml", "csv",
      "log", "py", "rb", "php", "java", "c", "cpp", "h", "hpp", "cs",
      "go", "rs", "swift", "kt", "sql", "sh", "bash", "zsh", "ps1", "bat",
      "cmd", "ini", "conf", "cfg", "toml", "env", "gitignore", "dockerfile",
      "lock", "json5", "vtt", "srt",
    ];

    return allowedTypes.some((allowedType) => {
      const allowed = allowedType.toLowerCase().trim();
      if (allowed.endsWith("/*")) {
        const baseType = allowed.replace("/*", "");
        if (baseType === "text") return textExtensions.includes(fileExtension) || fileType.startsWith("text");
        if (baseType === "archive") return extToCategory[fileExtension] === "archive" || fileType.includes("archive");
        if (fileType) return fileType.startsWith(baseType);
        return extToCategory[fileExtension] === baseType;
      }
      const mappedMime = extToCategory[fileExtension];
      if (mappedMime && mappedMime === allowed) return true;
      if (fileType && fileType === allowed) return true;
      if (allowed.startsWith(".")) return fileName.endsWith(allowed);
      if (fileExtension === allowed) return true;
      if (allowed.includes(",")) {
        return allowed.split(",").some((type) => {
          const t = type.trim();
          if (t === fileType) return true;
          if (t === fileExtension || t === `.${fileExtension}`) return true;
          const mapped = extToCategory[fileExtension];
          if (mapped && mapped === t) return true;
          // Handle wildcard patterns in comma-separated types (e.g., "archive/*")
          if (t.endsWith("/*")) {
            const baseType = t.replace("/*", "");
            if (baseType === "archive" && mapped === "archive") return true;
            if (fileType && fileType.startsWith(baseType)) return true;
          }
          return false;
        });
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
      if (portalAllowedTypes.length > 0 && !isFileTypeAllowed(file, portalAllowedTypes)) {
        return { id: Math.random().toString(36).slice(2), file, progress: 0, status: "error" as const, error: "File type not allowed" };
      }
      if (file.size > portalMaxSize) {
        return { id: Math.random().toString(36).slice(2), file, progress: 0, status: "error" as const, error: `Exceeds ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit` };
      }
      return { id: Math.random().toString(36).slice(2), file, progress: 0, status: "pending" as const };
    });
    setFiles((prev) => [...prev, ...newFiles]);
    setUploadStatus("idle");
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setCompletedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSlotFiles = (slotId: string, incoming: FileList) => {
    if (!portal) return;
    const selectedFiles = Array.from(incoming);
    const portalMaxSize = parseInt(portal.maxFileSize);
    const portalAllowedTypes = portal.allowedFileTypes || [];

    const newFiles: UploadFile[] = selectedFiles.map((file) => {
      if (portalAllowedTypes.length > 0 && !isFileTypeAllowed(file, portalAllowedTypes)) {
        return { id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`, file, progress: 0, status: "error" as const, error: "File type not allowed" };
      }
      if (file.size > portalMaxSize) {
        return { id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`, file, progress: 0, status: "error" as const, error: `Exceeds ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit` };
      }
      return { id: `slot_${slotId}_${Date.now()}_${Math.random().toString(36).slice(2)}`, file, progress: 0, status: "pending" as const };
    });
    setSlotFiles((prev) => ({ ...prev, [slotId]: [...(prev[slotId] || []), ...newFiles] }));
  };

  const handleRemoveSlotFile = (slotId: string, fileId: string) => {
    setSlotFiles((prev) => ({ ...prev, [slotId]: prev[slotId].filter((f) => f.id !== fileId) }));
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uploaderEmail)) {
        setErrorMessage("Please enter a valid email address");
        setUploadStatus("error");
        return;
      }
    }
    if (portal.textboxSectionEnabled && portal.textboxSectionRequired && !textboxValue.trim()) {
      setErrorMessage(`Please fill in the ${portal.textboxSectionTitle || "Notes"} field`);
      setUploadStatus("error");
      return;
    }
    if (portal.checklistItems && portal.checklistItems.length > 0) {
      const missingRequired = portal.checklistItems.filter(item => {
        if (!item.required) return false;
        const items = slotFiles[item.id] || [];
        return items.length === 0 || items.every(f => f.status === "error");
      });
      if (missingRequired.length > 0) {
        setErrorMessage(`Please provide files for: ${missingRequired.map(i => i.label).join(", ")}`);
        setUploadStatus("error");
        return;
      }
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

    setFiles((prev) => prev.map((f) => f.status === "pending" ? { ...f, status: "uploading" as const, progress: 0 } : f));
    setSlotFiles((prev) => {
      const next: Record<string, UploadFile[]> = {};
      for (const [slotId, slotList] of Object.entries(prev)) {
        next[slotId] = slotList.map((f) => f.status === "pending" ? { ...f, status: "uploading" as const, progress: 0 } : f);
      }
      return next;
    });

    const successful: Array<{ name: string; size: number; type: string }> = [];
    const failed: Array<{ name: string; size: number; type: string; error?: string }> = [];

    try {
      await uploadFiles(allFiles.map((f) => f.file), {
        portalId: portal.id,
        password: portalPassword || undefined,
        uploaderName: uploaderName.trim(),
        uploaderEmail: uploaderEmail.trim(),
        uploaderNotes: textboxValue.trim() || undefined,
        onFileProgress: (fileIndex, progress, speedStr) => {
          const entry = indexMap[fileIndex];
          if (!entry) return;
          if (entry.isSlot) {
            setSlotFiles((prev) => ({
              ...prev,
              [entry.slotId!]: prev[entry.slotId!].map((sf) => sf.id === entry.fileId ? { ...sf, progress: Math.floor(progress), ...(speedStr ? { speed: speedStr } : {}) } : sf),
            }));
          } else {
            setFiles((prev) => prev.map((f) => f.id === entry.fileId ? { ...f, progress: Math.floor(progress), ...(speedStr ? { speed: speedStr } : {}) } : f));
          }
        },
        onFileComplete: (fileIndex, result) => {
          const entry = indexMap[fileIndex];
          if (!entry) return;
          const allFile = allFiles[fileIndex];
          if (!allFile) return;
          if (result.success) {
            successful.push({ name: allFile.file.name, size: allFile.file.size, type: allFile.file.type });
            if (entry.isSlot) {
              setSlotFiles((prev) => ({ ...prev, [entry.slotId!]: prev[entry.slotId!].map((sf) => sf.id === entry.fileId ? { ...sf, progress: 100, status: "done" as const } : sf) }));
            } else {
              setFiles((prev) => prev.map((f) => f.id === entry.fileId ? { ...f, progress: 100, status: "done" as const } : f));
              setTimeout(() => {
                setFiles((prev) => {
                  const completed = prev.find((f) => f.id === entry.fileId);
                  if (completed) setCompletedFiles((c) => [...c, { ...completed, progress: 100, status: "done" as const }]);
                  return prev.filter((f) => f.id !== entry.fileId);
                });
              }, 600);
            }
          } else {
            failed.push({ name: allFile.file.name, size: allFile.file.size, type: allFile.file.type, error: result.error ?? "Upload failed" });
            if (entry.isSlot) {
              setSlotFiles((prev) => ({ ...prev, [entry.slotId!]: prev[entry.slotId!].map((sf) => sf.id === entry.fileId ? { ...sf, status: "error" as const, error: result.error ?? "Upload failed", progress: 0 } : sf) }));
            } else {
              setFiles((prev) => prev.map((f) => f.id === entry.fileId ? { ...f, status: "error" as const, error: result.error ?? "Upload failed", progress: 0 } : f));
            }
          }
        },
      });

      if (successful.length > 0 || failed.length > 0) {
        setSentFiles(successful);
        setFailedFiles(failed);
        setUploadStatus("success");
      } else {
        setErrorMessage("All uploads failed. Please try again.");
        setUploadStatus("error");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: portal?.backgroundColor || "#f8fafc" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: portal?.primaryColor || "#6366f1" }} />
      </div>
    );
  }

  // ── Blocked state (expired / limit reached) ──
  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: portal?.backgroundColor || "#f8fafc" }}>
        <div className="max-w-md w-full">
          <div className="rounded-xl border shadow-sm backdrop-blur-sm p-8 text-center space-y-4" style={{ backgroundColor: `${portal?.cardBackgroundColor || "#ffffff"}DD`, borderColor: `${portal?.primaryColor || "#6366f1"}20` }}>
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `${portal?.primaryColor || "#6366f1"}10` }}>
              <AlertCircle className="h-7 w-7" style={{ color: portal?.primaryColor || "#6366f1" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: portal?.textColor || "#0f172a" }}>Portal Unavailable</h2>
            <p className="text-sm" style={{ color: `${portal?.textColor || "#0f172a"}99` }}>{blockedReason}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Portal not found ──
  if (!portal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-lg font-bold mb-2" style={{ color: "#0f172a" }}>Portal Unavailable</h1>
          <p className="text-sm text-slate-500 leading-relaxed">This portal is not currently accepting uploads. Please contact the portal owner for assistance.</p>
        </div>
      </div>
    );
  }

  // ── Password protection screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: portal.backgroundColor }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none" style={{ background: portal.primaryColor }} />

        <div className="w-full max-w-md mx-4">
          <div
            className="rounded-xl border shadow-lg relative z-10 backdrop-blur-sm p-8"
            style={{
              backgroundColor: `${portal.cardBackgroundColor}dd`,
              borderColor: `${portal.primaryColor}20`,
            }}
          >
            <div className="text-center mb-8">
              {portal.logoUrl ? (
                <div className="flex justify-center mb-5">
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-black/5">
                    <LogoDisplay logoUrl={portal.logoUrl} alt={portal.name} size="md" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    background: portal.gradientEnabled && portal.secondaryColor
                      ? `linear-gradient(135deg, ${portal.primaryColor}, ${portal.secondaryColor})`
                      : portal.primaryColor,
                  }}
                >
                  <Lock className="w-7 h-7 text-white" />
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: portal.textColor }}>{portal.name}</h1>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest opacity-40" style={{ color: portal.textColor }}>Protected Access</p>
            </div>

            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              <PortalInput
                label="Password Required"
                placeholder="Enter password"
                primaryColor={portal.primaryColor}
                textColor={portal.textColor}
                cardBackgroundColor={portal.cardBackgroundColor}
                type="password"
                autoComplete="current-password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
              />
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs font-semibold text-red-600">{passwordError}</p>
                </div>
              )}
              <PortalButton
                gradientEnabled={portal.gradientEnabled}
                loading={authenticating}
                primaryColor={portal.primaryColor}
                secondaryColor={portal.secondaryColor}
                type="submit"
              >
                Unlock Portal
              </PortalButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Split welcome message ──
  const messageParts = portal.welcomeMessage?.split("\n").filter((line) => line.trim()) || [];
  const heroTitle = messageParts[0] || "Send us your files securely — we'll take it from here.";
  const heroDesc = messageParts.slice(1).join(" ") || "Please upload the required documents below to complete your verification process. Your data is encrypted end-to-end.";

  // ── Checklist completion count ──
  const checklistCompleted = portal.checklistItems.filter((item) => {
    const itemFiles = slotFiles[item.id] || [];
    return itemFiles.length > 0;
  }).length;

  // ── Main upload page ──
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: portal.backgroundColor }}>
      <div className="fixed inset-0 plus-grid pointer-events-none z-0" />

      <div className="absolute -top-[250px] -right-[250px] w-[600px] h-[600px] rounded-full blur-[150px] opacity-8 pointer-events-none" style={{ background: portal.primaryColor }} />
      <div className="absolute -bottom-[300px] -left-[300px] w-[700px] h-[700px] rounded-full blur-[180px] opacity-8 pointer-events-none" style={{ background: portal.secondaryColor || portal.primaryColor }} />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: `${portal.cardBackgroundColor}CC`,
            border: `1px solid ${portal.primaryColor}20`,
            color: portal.textColor,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            backdropFilter: "blur(8px)",
          },
        }}
      />

      <PortalHeader
        name={portal.name}
        logoUrl={portal.logoUrl}
        companyWebsite={portal.companyWebsite}
        companyEmail={portal.companyEmail}
        primaryColor={portal.primaryColor}
        textColor={portal.textColor}
        secondaryColor={portal.secondaryColor}
        gradientEnabled={portal.gradientEnabled}
      />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-6 sm:py-10">
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
              cardBackgroundColor={portal.cardBackgroundColor}
              uploaderEmail={uploaderEmail}
              uploaderName={uploaderName}
              onUploadMore={handleUploadMore}
            />
          ) : (
            <>
              <div className="w-full text-center mb-8 sm:mb-10">
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
                  style={{ color: portal.textColor }}
                >
                  {heroTitle}
                </h1>
                <p
                  className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
                  style={{ color: `${portal.textColor}99` }}
                >
                  {heroDesc}
                </p>
              </div>

              <div
                className="rounded-xl border shadow-sm overflow-hidden backdrop-blur-md"
                style={{
                  backgroundColor: `${portal.cardBackgroundColor}B3`,
                  borderColor: `${portal.primaryColor}15`,
                }}
              >
                <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                  {portal.requireClientName && (
                    <PortalInput
                      required
                      label="Your Name"
                      placeholder="Jane Doe"
                      primaryColor={portal.primaryColor}
                      textColor={portal.textColor}
                      cardBackgroundColor={portal.cardBackgroundColor}
                      type="text"
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                    />
                  )}

                  {portal.requireClientEmail && (
                    <PortalInput
                      required
                      label="Email Address"
                      placeholder="jane@example.com"
                      primaryColor={portal.primaryColor}
                      textColor={portal.textColor}
                      cardBackgroundColor={portal.cardBackgroundColor}
                      type="email"
                      value={uploaderEmail}
                      onChange={(e) => setUploaderEmail(e.target.value)}
                    />
                  )}

                  {portal.textboxSectionEnabled && (
                    <PortalTextarea
                      label="Notes"
                      placeholder={portal.textboxSectionPlaceholder || "Enter any notes or comments..."}
                      primaryColor={portal.primaryColor}
                      required={portal.textboxSectionRequired}
                      rows={4}
                      textColor={portal.textColor}
                      cardBackgroundColor={portal.cardBackgroundColor}
                      value={textboxValue}
                      onChange={(e) => setTextboxValue(e.target.value)}
                    />
                  )}

                  {portal.checklistItems && portal.checklistItems.length > 0 ? (
                    <div className="space-y-5">
                      <PortalChecklist
                        items={portal.checklistItems}
                        primaryColor={portal.primaryColor}
                        slotFiles={slotFiles}
                        textColor={portal.textColor}
                        cardBackgroundColor={portal.cardBackgroundColor}
                        uploading={uploading}
                        onFilesSelected={handleSlotFiles}
                        onRemoveFile={handleRemoveSlotFile}
                      />

                      {(Object.values(slotFiles).some((files) => files.some((f) => f.status === "pending" || f.status === "uploading")) || checklistCompleted > 0) && (
                        <div className="pt-2">
                          <PortalButton
                            gradientEnabled={portal.gradientEnabled}
                            icon={<Upload className="w-4 h-4" />}
                            loading={uploading}
                            disabled={uploading}
                            primaryColor={portal.primaryColor}
                            secondaryColor={portal.secondaryColor}
                            onClick={handleUpload}
                          >
                            {portal.submitButtonText}
                          </PortalButton>
                        </div>
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
                    <div className="space-y-5">
                      <PortalFileList
                        completedFiles={completedFiles}
                        files={files}
                        gradientEnabled={portal.gradientEnabled}
                        primaryColor={portal.primaryColor}
                        secondaryColor={portal.secondaryColor}
                        textColor={portal.textColor}
                        cardBackgroundColor={portal.cardBackgroundColor}
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

                      {files.filter((f) => f.status === "pending" || f.status === "uploading").length > 0 && (
                        <PortalButton
                          gradientEnabled={portal.gradientEnabled}
                          icon={<Upload className="w-4 h-4" />}
                          loading={uploading}
                          disabled={uploading}
                          primaryColor={portal.primaryColor}
                          secondaryColor={portal.secondaryColor}
                          onClick={handleUpload}
                        >
                          {portal.submitButtonText}
                        </PortalButton>
                      )}
                    </div>
                  )}

                  {errorMessage && (uploadStatus === "error" || uploadStatus === "idle") && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                      <p className="text-xs font-semibold text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className="border-t py-3 px-5 sm:px-8 flex items-center justify-center gap-2 text-xs"
                  style={{
                    backgroundColor: `${portal.primaryColor}05`,
                    borderColor: `${portal.primaryColor}10`,
                    color: `${portal.textColor}80`,
                  }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Your files are encrypted and securely stored using AES-256.
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {!portal.isOwnerSubscriber && (
        <footer className="relative z-10 w-full py-5 px-6 border-t flex flex-col items-center gap-1"
          style={{ borderColor: `${portal.textColor}10`, backgroundColor: `${portal.cardBackgroundColor}80` }}
        >
          <span className="text-xs" style={{ color: `${portal.textColor}60` }}>
            Secure file delivery powered by <span className="font-semibold" style={{ color: portal.textColor }}>Dysumcorp</span>
          </span>
          <span className="text-[11px]" style={{ color: `${portal.textColor}40` }}>
            &copy; 2026 Dysumcorp &middot; All rights reserved.
          </span>
        </footer>
      )}
    </div>
  );
}
