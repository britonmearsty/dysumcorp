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
import { PortalSuccessView } from "@/components/portal/portal-success-view";

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  isActive: boolean;
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
  textboxSectionRequired: boolean;
  userId: string;
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
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [textboxValue, setTextboxValue] = useState("");
  const [sentFiles, setSentFiles] = useState<Array<{ name: string; size: number; type: string }>>([]);

  useEffect(() => {
    fetchPortal();
  }, [slug]);

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

        // Check if portal requires password
        if (p.password) {
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
        }
      } else {
        setErrorMessage("Portal not found");
      }
    } catch (error) {
      console.error("Failed to fetch portal:", error);
      setErrorMessage("Failed to load portal");
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

    const textExtensions = [
      "txt", "md", "markdown", "js", "jsx", "ts", "tsx", "json", "html", "htm",
      "css", "scss", "sass", "less", "xml", "yaml", "yml", "csv", "log", "py",
      "rb", "php", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "swift",
      "kt", "sql", "sh", "bash", "zsh", "ps1", "bat", "cmd", "ini", "conf",
      "cfg", "toml", "env", "gitignore", "dockerfile",
    ];

    return allowedTypes.some((allowedType) => {
      const allowed = allowedType.toLowerCase();

      if (allowed.endsWith("/*")) {
        const baseType = allowed.replace("/*", "");
        if (baseType === "text") {
          return textExtensions.includes(fileExtension) || fileType.startsWith("text");
        }
        return fileType.startsWith(baseType);
      }

      if (fileType === allowed) return true;
      if (allowed.startsWith(".")) return fileName.endsWith(allowed);
      if (fileExtension === allowed) return true;
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
      if (portalAllowedTypes.length > 0 && !isFileTypeAllowed(file, portalAllowedTypes)) {
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
    const validFiles = files.filter((f) => f.status === "pending");
    
    if (validFiles.length === 0) {
      setErrorMessage("Please select at least one valid file");
      setUploadStatus("error");
      return;
    }

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

    if (portal.textboxSectionEnabled && portal.textboxSectionRequired && !textboxValue.trim()) {
      setErrorMessage(`Please fill in the ${portal.textboxSectionTitle || "Notes"} field`);
      setUploadStatus("error");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    const successfulFiles: Array<{ name: string; size: number; type: string }> = [];
    let allCompleted = false;

    try {
      const uploadPromises = validFiles.map(async (uploadFile) => {
        const file = uploadFile.file;
        const portalMaxSize = parseInt(portal.maxFileSize);

        if (file.size > portalMaxSize) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error" as const, error: `Exceeds ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit` }
                : f
            )
          );
          return null;
        }

        console.log(`[Upload] Starting upload for file: ${file.name}`);

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f))
        );

        try {
          // Step 1: Get upload URL/credentials
          const directUploadResponse = await fetch("/api/portals/direct-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
              portalId: portal.id,
              clientName: uploaderName.trim(),
              clientEmail: uploaderEmail.trim(),
            }),
          });

          if (!directUploadResponse.ok) {
            const errorData = await directUploadResponse.json();
            throw new Error(errorData.error || "Failed to prepare upload");
          }

          const uploadData = await directUploadResponse.json();

          console.log(`[Upload] Upload credentials received for ${file.name}, provider: ${uploadData.provider}`);

          // Step 2: Upload to cloud storage via streaming
          let storageUrl = "";
          let storageFileId = "";

          if (uploadData.method === "stream") {
            const chunkSize = uploadData.chunkSize || 4 * 1024 * 1024;
            const totalChunks = Math.ceil(file.size / chunkSize);

            console.log(`[Upload] Streaming ${file.name} in ${totalChunks} chunks`);

            if (uploadData.provider === "google") {
              let fileData = null;

              for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append("chunk", chunk);
                formData.append("provider", "google");
                formData.append("uploadUrl", uploadData.uploadUrl);
                formData.append("chunkStart", start.toString());
                formData.append("chunkEnd", end.toString());
                formData.append("totalSize", file.size.toString());
                formData.append("uploadToken", uploadData.uploadToken);

                const response = await fetch("/api/portals/stream-upload", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.error || "Upload failed");
                }

                const result = await response.json();

                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadFile.id ? { ...f, progress: Math.round((end / file.size) * 100) } : f
                  )
                );

                if (result.complete && result.fileData) {
                  fileData = result.fileData;
                  break;
                }
              }

              if (!fileData?.id) {
                throw new Error("Upload completed but no file data received");
              }

              storageFileId = fileData.id;
              storageUrl = `https://drive.google.com/file/d/${fileData.id}/view`;
              console.log(`[Upload] File uploaded to Google Drive: ${file.name}`);
            } else if (uploadData.provider === "dropbox") {
              const MAX_CONCURRENT_CHUNKS = 8;
              const concurrency = Math.max(1, Math.floor(MAX_CONCURRENT_CHUNKS / validFiles.length));

              console.log(`[Upload] Dropbox parallel upload: ${concurrency} chunks at once for ${file.name}`);

              let sessionId = "";
              let uploadedBytes = 0;

              // Phase 1: Start session with first chunk
              const firstChunk = file.slice(0, Math.min(chunkSize, file.size));
              const startFormData = new FormData();
              startFormData.append("chunk", firstChunk);
              startFormData.append("provider", "dropbox");
              startFormData.append("accessToken", uploadData.accessToken);
              startFormData.append("uploadPath", uploadData.uploadPath);
              startFormData.append("uploadToken", uploadData.uploadToken);
              startFormData.append("isLastChunk", (totalChunks === 1).toString());
              startFormData.append("chunkIndex", "0");

              const startResponse = await fetch("/api/portals/stream-upload", {
                method: "POST",
                body: startFormData,
              });

              if (!startResponse.ok) {
                const error = await startResponse.json();
                throw new Error(error.error || "Failed to start Dropbox session");
              }

              const startResult = await startResponse.json();
              sessionId = startResult.sessionId;
              uploadedBytes = Math.min(chunkSize, file.size);

              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress: Math.round((uploadedBytes / file.size) * 100) } : f
                )
              );

              if (totalChunks === 1 && startResult.complete) {
                storageFileId = startResult.fileData.id;
                storageUrl = startResult.fileData.id;
                console.log(`[Upload] Single chunk file uploaded to Dropbox: ${file.name}`);
              } else {
                // Phase 2: Upload remaining chunks SEQUENTIALLY (Dropbox requires sequential append)
                console.log(`[Upload] Dropbox sequential upload for ${file.name}`);
                
                for (let chunkIndex = 1; chunkIndex < totalChunks; chunkIndex++) {
                  const start = chunkIndex * chunkSize;
                  const end = Math.min(start + chunkSize, file.size);
                  const chunk = file.slice(start, end);
                  const isLastChunk = chunkIndex === totalChunks - 1;

                  const formData = new FormData();
                  formData.append("chunk", chunk);
                  formData.append("provider", "dropbox");
                  formData.append("accessToken", uploadData.accessToken);
                  formData.append("uploadPath", uploadData.uploadPath);
                  formData.append("uploadToken", uploadData.uploadToken);
                  formData.append("isLastChunk", isLastChunk.toString());
                  formData.append("chunkIndex", chunkIndex.toString());
                  formData.append("sessionId", sessionId);
                  formData.append("offset", uploadedBytes.toString());

                  const response = await fetch("/api/portals/stream-upload", {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Chunk ${chunkIndex} failed: ${error.error}`);
                  }

                  const result = await response.json();
                  uploadedBytes += (end - start);

                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === uploadFile.id ? { ...f, progress: Math.round((uploadedBytes / file.size) * 100) } : f
                    )
                  );

                  if (isLastChunk && result.complete && result.fileData) {
                    storageFileId = result.fileData.id;
                    storageUrl = result.fileData.id;
                    console.log(`[Upload] File uploaded to Dropbox: ${file.name}`);
                  }
                }
              }
            } else {
              throw new Error(`Unsupported provider: ${uploadData.provider}`);
            }
          } else {
            throw new Error(`Unsupported upload method: ${uploadData.method}`);
          }

          // Step 3: Confirm upload and save metadata
          const confirmResponse = await fetch("/api/portals/confirm-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portalId: portal.id,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
              storageUrl,
              storageFileId,
              provider: uploadData.provider,
              uploaderName: uploaderName.trim(),
              uploaderEmail: uploaderEmail.trim(),
            }),
          });

          if (!confirmResponse.ok) {
            const errorData = await confirmResponse.json();
            throw new Error(errorData.error || "Failed to confirm upload");
          }

          console.log(`[Upload] Upload confirmed for ${file.name}`);

          // Mark file as done and move to completed
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 100, status: "done" as const } : f))
          );

          // Move to completed drawer after a brief delay
          setTimeout(() => {
            setFiles((prev) => {
              const completed = prev.find((f) => f.id === uploadFile.id);
              if (completed) {
                setCompletedFiles((c) => [...c, completed]);
              }
              return prev.filter((f) => f.id !== uploadFile.id);
            });
          }, 600);

          return {
            name: file.name,
            size: file.size,
            type: file.type,
          };
        } catch (error) {
          console.error(`[Upload] Failed to upload ${file.name}:`, error);
          const errorMsg = error instanceof Error ? error.message : "Upload failed";
          
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: "error" as const, error: errorMsg, progress: 0 } : f
            )
          );
          
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r): r is { name: string; size: number; type: string } => r !== null);
      successfulFiles.push(...successful);

      // Send batch notification
      if (successfulFiles.length > 0) {
        try {
          await fetch("/api/portals/batch-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portalId: portal.id,
              files: successfulFiles,
              uploaderName: uploaderName.trim(),
              uploaderEmail: uploaderEmail.trim(),
            }),
          });
        } catch (notifError) {
          console.error("[Upload] Failed to send notification:", notifError);
        }
      }

      // Check if all files are done (either completed or error)
      allCompleted = true;
      
      if (successfulFiles.length > 0) {
        setSentFiles(successfulFiles);
        setUploadStatus("success");
      } else {
        setErrorMessage("All uploads failed. Please try again.");
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setErrorMessage(errorMsg);
      setUploadStatus("error");
    } finally {
      if (allCompleted) {
        setUploading(false);
      }
    }
  };

  const handleUploadMore = () => {
    setUploadStatus("idle");
    setFiles([]);
    setCompletedFiles([]);
    setSentFiles([]);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: portal?.backgroundColor || "#f1f5f9" }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: portal?.primaryColor || "#6366f1" }} />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f1f5f9" }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Portal Not Found</h1>
          <p className="text-slate-500">{errorMessage}</p>
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
              <img alt={portal.name} className="w-16 h-16 mx-auto mb-4 object-contain" src={portal.logoUrl} />
            )}
            <h1 className="text-2xl font-bold" style={{ color: portal.textColor }}>
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
            {passwordError && <p className="text-sm font-bold text-red-500">{passwordError}</p>}
            <PortalButton
              primaryColor={portal.primaryColor}
              secondaryColor={portal.secondaryColor}
              gradientEnabled={portal.gradientEnabled}
              loading={authenticating}
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
    <div className="min-h-screen flex flex-col" style={{ background: portal.backgroundColor }}>
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
        name={portal.name}
        logoUrl={portal.logoUrl}
        companyWebsite={portal.companyWebsite}
        companyEmail={portal.companyEmail}
        welcomeMessage={portal.welcomeMessage}
        primaryColor={portal.primaryColor}
        secondaryColor={portal.secondaryColor}
        textColor={portal.textColor}
        gradientEnabled={portal.gradientEnabled}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {uploadStatus === "success" ? (
            <PortalSuccessView
              uploaderName={uploaderName}
              uploaderEmail={uploaderEmail}
              sentFiles={sentFiles}
              successMessage={portal.successMessage}
              primaryColor={portal.primaryColor}
              secondaryColor={portal.secondaryColor}
              textColor={portal.textColor}
              gradientEnabled={portal.gradientEnabled}
              onUploadMore={handleUploadMore}
            />
          ) : (
            <div
              className="rounded-2xl overflow-hidden bg-white border shadow-md"
              style={{ borderColor: `${portal.primaryColor}20` }}
            >
              <div className="p-8 space-y-5">
                {/* Name */}
                {portal.requireClientName && (
                  <PortalInput
                    label="Your Name"
                    type="text"
                    placeholder="Jane Doe"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    required
                  />
                )}

                {/* Email */}
                {portal.requireClientEmail && (
                  <PortalInput
                    label="Email Address"
                    type="email"
                    placeholder="jane@example.com"
                    value={uploaderEmail}
                    onChange={(e) => setUploaderEmail(e.target.value)}
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    required
                  />
                )}

                {/* Textbox Section */}
                {portal.textboxSectionEnabled && (
                  <PortalTextarea
                    label={portal.textboxSectionTitle || "Notes"}
                    placeholder="Enter any notes or comments..."
                    rows={4}
                    value={textboxValue}
                    onChange={(e) => setTextboxValue(e.target.value)}
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    required={portal.textboxSectionRequired}
                  />
                )}

                {/* Drop Zone or File List */}
                {files.length === 0 ? (
                  <PortalDropZone
                    onFilesSelected={addFiles}
                    primaryColor={portal.primaryColor}
                    textColor={portal.textColor}
                    maxFileSize={parseInt(portal.maxFileSize)}
                    allowedFileTypes={portal.allowedFileTypes || undefined}
                  />
                ) : (
                  <>
                    <PortalFileList
                      files={files}
                      completedFiles={completedFiles}
                      onRemove={removeFile}
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
                      primaryColor={portal.primaryColor}
                      secondaryColor={portal.secondaryColor}
                      textColor={portal.textColor}
                      gradientEnabled={portal.gradientEnabled}
                      uploading={uploading}
                    />

                    {!uploading && files.filter((f) => f.status === "pending").length > 0 && (
                      <PortalButton
                        primaryColor={portal.primaryColor}
                        secondaryColor={portal.secondaryColor}
                        gradientEnabled={portal.gradientEnabled}
                        onClick={handleUpload}
                        icon={<Upload className="w-4 h-4" />}
                      >
                        {portal.submitButtonText}
                      </PortalButton>
                    )}
                  </>
                )}

                {/* Error Message */}
                {errorMessage && (uploadStatus === "error" || uploadStatus === "idle") && (
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
            <p className="text-sm flex items-center justify-center gap-2" style={{ color: portal.textColor }}>
              <Lock className="w-4 h-4" /> Your files are encrypted and securely stored
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 px-6 border-t border-slate-200 bg-white flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-xs">Secure file delivery powered by</span>
          <span className="text-slate-700 text-xs ml-1 font-bold">Dysumcorp</span>
        </div>
        <span className="text-slate-300 text-xs">© 2026 Dysumcorp · All rights reserved.</span>
      </footer>
    </div>
  );
}
