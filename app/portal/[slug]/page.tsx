"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  Loader2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  isActive: boolean;
  // Branding
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  logoUrl: string | null;
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
  submitButtonText: string;
  successMessage: string;
  textboxSectionEnabled: boolean;
  textboxSectionTitle: string | null;
  textboxSectionRequired: boolean;
  userId: string;
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
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<number, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [clientFolderName, setClientFolderName] = useState("");
  const [textboxValue, setTextboxValue] = useState("");

  useEffect(() => {
    fetchPortal();
  }, [slug]);

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

    // Common text-based extensions that browsers might not recognize properly
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
      const allowed = allowedType.toLowerCase();

      // Handle wildcard types like "image/*", "text/*", "video/*", "audio/*"
      if (allowed.endsWith("/*")) {
        const baseType = allowed.replace("/*", "");

        // For text/*, also check common text extensions
        if (baseType === "text") {
          return (
            textExtensions.includes(fileExtension) ||
            fileType.startsWith("text")
          );
        }

        return fileType.startsWith(baseType);
      }

      // Handle exact MIME types
      if (fileType === allowed) {
        return true;
      }

      // Handle extensions (with or without dot)
      if (allowed.startsWith(".")) {
        return fileName.endsWith(allowed);
      }

      // Check if the allowed type matches the extension
      if (fileExtension === allowed) {
        return true;
      }

      // Check if it's a comma-separated list of MIME types
      if (allowed.includes(",")) {
        return allowed.split(",").some((type) => type.trim() === fileType);
      }

      return false;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && portal) {
      const selectedFiles = Array.from(e.target.files);
      const portalMaxSize = parseInt(portal.maxFileSize);
      const portalAllowedTypes = portal.allowedFileTypes || [];

      // Filter files by allowed types
      let validFiles = selectedFiles;

      if (portalAllowedTypes.length > 0) {
        validFiles = selectedFiles.filter((file) =>
          isFileTypeAllowed(file, portalAllowedTypes),
        );

        if (validFiles.length < selectedFiles.length) {
          setErrorMessage(
            "Some files were removed due to allowed file type restrictions",
          );
          setTimeout(() => setErrorMessage(""), 3000);
        }
      }

      // Filter by size
      const oversizedFiles = validFiles.filter((f) => f.size > portalMaxSize);

      if (oversizedFiles.length > 0) {
        setErrorMessage(
          `Some files exceed the ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB limit`,
        );
        setTimeout(() => setErrorMessage(""), 3000);
        validFiles = validFiles.filter((f) => f.size <= portalMaxSize);
      }

      setFiles(validFiles);
      setUploadStatus("idle");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("Please select at least one file");

      return;
    }

    if (!portal) {
      setErrorMessage("Portal information not loaded");

      return;
    }

    // Validate required fields based on portal config
    if (portal.requireClientName && !uploaderName.trim()) {
      setErrorMessage("Please enter your name");

      return;
    }

    if (portal.requireClientEmail) {
      if (!uploaderEmail.trim()) {
        setErrorMessage("Please enter your email");

        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(uploaderEmail)) {
        setErrorMessage("Please enter a valid email address");

        return;
      }
    }

    setUploading(true);
    setFileProgress({});
    setUploadStatus("idle");
    setErrorMessage("");

    const successfulFiles: Array<{ name: string; size: number }> = [];

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const portalMaxSize = parseInt(portal.maxFileSize);

        // Double-check size
        if (file.size > portalMaxSize) {
          throw new Error(`${file.name} exceeds the portal's size limit`);
        }

        console.log(
          `[Upload] Starting upload for file ${i + 1}/${files.length}: ${file.name}`,
        );

        setFileProgress((prev) => ({ ...prev, [i]: 0 }));

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

        console.log(
          `[Upload] Upload credentials received for ${file.name}, provider: ${uploadData.provider}`,
        );

        // Step 2: Upload directly to cloud storage
        let storageUrl = "";
        let storageFileId = "";

        if (
          uploadData.provider === "google" &&
          uploadData.method === "direct"
        ) {
          // Google Drive direct upload (resumable upload to Google Drive)
          // Google Drive direct upload (resumable upload)
          const uploadResult = await new Promise<{ id: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));
              }
            });

            xhr.addEventListener("load", () => {
              console.log(`[Upload] Google Drive response status: ${xhr.status}`);
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  console.log(`[Upload] File uploaded, ID: ${response.id}`);
                  resolve(response);
                } catch (e) {
                  console.error(`[Upload] Parse error:`, e);
                  reject(new Error("Failed to parse upload response"));
                }
              } else {
                console.error(`[Upload] Upload failed:`, xhr.status, xhr.responseText.substring(0, 200));
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener("error", () => {
              console.error(`[Upload] Network error`);
              reject(new Error("Network error during upload"));
            });

            console.log(`[Upload] Uploading ${file.size} bytes directly to Google Drive`);
            xhr.open("PUT", uploadData.uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
            xhr.send(file);
          });

          storageFileId = uploadResult.id;
          storageUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;
          console.log(`[Upload] File uploaded to Google Drive: ${file.name}`);
        } else if (uploadData.provider === "dropbox" && uploadData.method === "direct") {
          // Dropbox upload (direct from browser)
          const uploadResponse = await new Promise<{ url: string; id: string }>(
            (resolve, reject) => {
              const xhr = new XMLHttpRequest();

              xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                  const percentComplete = Math.round(
                    (e.loaded / e.total) * 100,
                  );

                  setFileProgress((prev) => ({
                    ...prev,
                    [i]: percentComplete,
                  }));
                }
              });

              xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const response = JSON.parse(xhr.responseText);

                    resolve({
                      url: response.id,
                      id: response.id,
                    });
                  } catch (e) {
                    reject(new Error("Failed to parse upload response"));
                  }
                } else {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              });

              xhr.addEventListener("error", () => {
                reject(new Error("Network error during upload"));
              });

              xhr.open("POST", "https://content.dropboxapi.com/2/files/upload");
              xhr.setRequestHeader(
                "Authorization",
                `Bearer ${uploadData.accessToken}`,
              );
              xhr.setRequestHeader("Content-Type", "application/octet-stream");
              xhr.setRequestHeader(
                "Dropbox-API-Arg",
                JSON.stringify({
                  path: uploadData.path,
                  mode: "add",
                  autorename: true,
                  mute: false,
                }),
              );
              xhr.send(file);
            },
          );

          storageUrl = uploadResponse.url;
          storageFileId = uploadResponse.id;
        } else {
          throw new Error(`Unsupported upload method: ${uploadData.method} for provider: ${uploadData.provider}`);
        }

        console.log(
          `[Upload] File uploaded to ${uploadData.provider}: ${file.name}`,
        );

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
        setFileProgress((prev) => ({ ...prev, [i]: 100 }));

        successfulFiles.push({
          name: file.name,
          size: file.size,
        });
      }

      // Send batch notification after all files are uploaded
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
          // Don't fail the upload if notification fails
        }
      }

      // All files uploaded successfully
      setUploadStatus("success");
      setFiles([]);
      setUploaderName("");
      setUploaderEmail("");
      setFileProgress({});
    } catch (error) {
      console.error("Upload failed:", error);
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

  // Apply branding styles
  const getBrandingStyles = () => {
    if (!portal) return {};

    return {
      "--primary-color": portal.primaryColor || "#3b82f6",
      "--text-color": portal.textColor || "#0f172a",
      "--background-color": portal.backgroundColor || "#ffffff",
      "--card-background-color": portal.cardBackgroundColor || "#ffffff",
    } as React.CSSProperties;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={getBrandingStyles()}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: portal?.primaryColor }}
        />
      </div>
    );
  }

  if (!portal) {
    const defaultColors = { primaryColor: "#3b82f6", textColor: "#0f172a" };

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={getBrandingStyles()}
      >
        <div className="text-center">
          <AlertCircle
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: defaultColors.primaryColor }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: defaultColors.textColor }}
          >
            Portal Not Found
          </h1>
          <p className="opacity-60">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Password protection screen
  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={getBrandingStyles()}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl border"
          style={{
            backgroundColor: portal.cardBackgroundColor,
            borderColor: portal.primaryColor + "30",
          }}
        >
          <div className="text-center mb-6">
            {portal.logoUrl && (
              <img
                alt={portal.name}
                className="w-16 h-16 mx-auto mb-4 object-contain"
                src={portal.logoUrl}
              />
            )}
            <h1
              className="text-2xl md:text-3xl font-bold serif-font"
              style={{ color: portal.textColor }}
            >
              {portal.name}
            </h1>
            <p
              className="mt-2 text-stone-600 font-medium"
              style={{ color: portal.textColor }}
            >
              This portal is password protected
            </p>
          </div>

          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                style={{ color: portal.textColor }}
              />
              <input
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-200 outline-none focus:border-[#1c1917] transition-all font-medium"
                placeholder="Enter password"
                style={{
                  backgroundColor: portal.backgroundColor,
                  color: portal.textColor,
                }}
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <p className="text-sm font-bold text-red-500">{passwordError}</p>
            )}
            <Button
              className="w-full py-6 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-base hover:bg-stone-800 transition-all premium-shadow"
              disabled={authenticating}
              style={{ backgroundColor: portal.primaryColor }}
              type="submit"
            >
              {authenticating ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Access Portal"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen selection:bg-stone-200"
      style={getBrandingStyles()}
    >
      {/* Header */}
      <header
        className="border-b py-8 px-4 md:px-8 bg-white/50 backdrop-blur-sm"
        style={{
          borderColor: portal.primaryColor + "20",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            {portal.logoUrl && (
              <div className="w-16 h-16 bg-white rounded-2xl border border-stone-100 flex items-center justify-center p-2 premium-shadow-sm">
                <img
                  alt={portal.name}
                  className="w-full h-full object-contain"
                  src={portal.logoUrl}
                />
              </div>
            )}
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold serif-font text-[#1c1917]"
                style={{ color: portal.textColor }}
              >
                {portal.name}
              </h1>
              {portal.welcomeMessage && (
                <p
                  className="mt-2 text-lg text-stone-600 font-medium"
                  style={{ color: portal.textColor }}
                >
                  {portal.welcomeMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="py-16 px-4 md:px-8 bg-[#fafaf9]"
        style={{ backgroundColor: portal.backgroundColor }}
      >
        <div className="max-w-4xl mx-auto">
          {uploadStatus === "success" ? (
            <div
              className="rounded-[2.5rem] p-12 text-center bg-white border border-stone-100 premium-shadow"
              style={{
                borderColor: portal.primaryColor + "30",
              }}
            >
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle
                  className="w-10 h-10 text-emerald-500"
                  style={{ color: portal.primaryColor }}
                />
              </div>
              <h2
                className="text-3xl font-bold serif-font mb-4 text-[#1c1917]"
                style={{ color: portal.textColor }}
              >
                {portal.successMessage}
              </h2>
              <p
                className="text-lg text-stone-600 font-medium mb-10"
                style={{ color: portal.textColor }}
              >
                Your files have been securely uploaded. Thank you!
              </p>
              <Button
                className="px-8 py-5 bg-[#1c1917] text-stone-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow"
                style={{ backgroundColor: portal.primaryColor }}
                onClick={() => {
                  setUploadStatus("idle");
                  setFiles([]);
                }}
              >
                UPLOAD MORE FILES
              </Button>
            </div>
          ) : (
            <div
              className="rounded-[2.5rem] bg-white border border-stone-100 premium-shadow overflow-hidden"
              style={{
                borderColor: portal.primaryColor + "20",
              }}
            >
              <div className="p-8 md:p-12">
                <h2
                  className="text-2xl md:text-3xl font-bold mb-8 serif-font text-[#1c1917]"
                  style={{ color: portal.textColor }}
                >
                  Upload Your Files
                </h2>

                {/* Client Information */}
                {(portal.requireClientName || portal.requireClientEmail) && (
                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    {portal.requireClientName && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                          YOUR NAME *
                        </label>
                        <Input
                          className="h-14 rounded-xl border-stone-200 focus:border-[#1c1917] font-medium transition-all"
                          placeholder="John Doe"
                          style={{
                            color: portal.textColor,
                          }}
                          type="text"
                          value={uploaderName}
                          onChange={(e) => setUploaderName(e.target.value)}
                        />
                      </div>
                    )}
                    {portal.requireClientEmail && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                          YOUR EMAIL *
                        </label>
                        <Input
                          className="h-14 rounded-xl border-stone-200 focus:border-[#1c1917] font-medium transition-all"
                          placeholder="john@example.com"
                          style={{
                            color: portal.textColor,
                          }}
                          type="email"
                          value={uploaderEmail}
                          onChange={(e) => setUploaderEmail(e.target.value)}
                        />
                      </div>
                      )}
                    </div>
                  )}

                  {/* Textbox Section */}
                  {portal.textboxSectionEnabled && (
                    <div className="mb-10">
                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                          {portal.textboxSectionTitle || "Notes"}
                          {portal.textboxSectionRequired && " *"}
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border-stone-200 focus:border-[#1c1917] font-medium transition-all bg-white resize-none"
                          style={{
                            color: portal.textColor,
                          }}
                          placeholder="Enter any notes or comments..."
                          rows={3}
                          value={textboxValue}
                          onChange={(e) => setTextboxValue(e.target.value)}
                          required={portal.textboxSectionRequired}
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload Area */}
                <div
                  className="border-2 border-dashed rounded-[2rem] p-12 md:p-20 text-center mb-10 transition-all bg-[#fafaf9] hover:bg-stone-50 group cursor-pointer"
                  style={{
                    borderColor: portal.primaryColor || "#e2e8f0",
                  }}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 premium-shadow-sm group-hover:scale-110 transition-transform">
                    <Upload
                      className="w-8 h-8 text-[#1c1917]"
                      style={{ color: portal.primaryColor }}
                    />
                  </div>
                  <p
                    className="text-xl font-bold text-[#1c1917] mb-2 serif-font"
                    style={{ color: portal.textColor }}
                  >
                    Drag and drop files here
                  </p>
                  <p
                    className="text-stone-500 font-medium mb-8"
                    style={{ color: portal.textColor }}
                  >
                    Or click to browse your computer
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <span className="px-4 py-1.5 bg-white rounded-full border border-stone-100 text-xs font-bold text-stone-500 uppercase tracking-widest shadow-sm">
                      Max{" "}
                      {portal
                        ? `${(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB`
                        : "..."}
                    </span>
                    {portal.allowedFileTypes &&
                      portal.allowedFileTypes.length > 0 && (
                        <span className="px-4 py-1.5 bg-white rounded-full border border-stone-100 text-xs font-bold text-stone-500 uppercase tracking-widest shadow-sm">
                          {portal.allowedFileTypes.length} Types Allowed
                        </span>
                      )}
                  </div>
                  <input
                    multiple
                    className="hidden"
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Selected Files */}
                {files.length > 0 && portal && (
                  <div className="mb-10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4">
                      Selected Files ({files.length})
                    </h3>
                    <div className="space-y-3">
                      {files.map((file, index) => {
                        const portalMaxSize = parseInt(portal.maxFileSize);
                        const isOversized = file.size > portalMaxSize;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-xl border"
                            style={{
                              borderColor: isOversized
                                ? "#ef4444"
                                : portal.primaryColor + "20",
                              backgroundColor: portal.backgroundColor,
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText
                                className={`w-5 h-5 flex-shrink-0 ${
                                  isOversized ? "text-red-500" : ""
                                }`}
                                style={{
                                  color: isOversized
                                    ? "#ef4444"
                                    : portal.primaryColor,
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-bold truncate text-[#1c1917]"
                                  style={{ color: portal.textColor }}
                                >
                                  {file.name}
                                  {isOversized && (
                                    <span className="ml-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                      TOO LARGE
                                    </span>
                                  )}
                                </p>
                                <p
                                  className="text-xs font-medium text-stone-500"
                                  style={{ color: portal.textColor }}
                                >
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {uploading &&
                                fileProgress[index] !== undefined && (
                                  <span
                                    className="text-sm font-bold text-[#1c1917]"
                                    style={{ color: portal.primaryColor }}
                                  >
                                    {fileProgress[index]}%
                                  </span>
                                )}
                              <button
                                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                                disabled={uploading}
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-5 h-5 text-stone-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {uploadStatus === "error" && errorMessage && (
                  <div className="mb-8 p-6 rounded-2xl border border-red-100 bg-red-50/50">
                    <p className="text-red-600 text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {errorMessage}
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  className="w-full py-8 bg-[#1c1917] text-stone-50 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all premium-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    files.length === 0 ||
                    uploading ||
                    (portal.requireClientName && !uploaderName.trim()) ||
                    (portal.requireClientEmail && !uploaderEmail.trim())
                  }
                  style={{ backgroundColor: portal.primaryColor }}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      UPLOADING...
                    </>
                  ) : (
                    portal.submitButtonText || "UPLOAD FILES"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div
            className="mt-12 p-6 rounded-3xl border border-stone-100 bg-white/50 premium-shadow-sm text-center"
            style={{
              borderColor: portal.primaryColor + "20",
            }}
          >
            <p
              className="text-sm font-medium text-stone-500 flex items-center justify-center gap-2"
              style={{ color: portal.textColor }}
            >
              <Lock className="w-4 h-4" /> Your files are encrypted and securely
              stored. We take your privacy seriously.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-12 px-4 md:px-8 lg:px-16 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <div className="w-8 h-8 bg-[#1c1917] flex items-center justify-center rounded-lg">
              <span className="text-stone-50 font-bold text-sm">D</span>
            </div>
            <span className="serif-font font-bold text-[#1c1917]">
              dysumcorp
            </span>
          </div>
          <span className="text-sm font-medium text-stone-400 italic">
            Powered by Dysumcorp. Securely collect files.
          </span>
        </div>
      </footer>
    </div>
  );
}
