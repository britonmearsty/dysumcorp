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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && portal) {
      const selectedFiles = Array.from(e.target.files);
      const portalMaxSize = parseInt(portal.maxFileSize);
      const portalAllowedTypes = portal.allowedFileTypes || [];

      // Filter files by allowed types
      let validFiles = selectedFiles;

      if (portalAllowedTypes.length > 0) {
        validFiles = selectedFiles.filter((file) => {
          const fileType = file.type.toLowerCase();
          const fileName = file.name.toLowerCase();

          return portalAllowedTypes.some((allowedType) => {
            // Handle wildcard types like "image/*"
            if (allowedType.endsWith("/*")) {
              const baseType = allowedType.replace("/*", "");

              return fileType.startsWith(baseType);
            }

            // Handle exact MIME types or extensions
            return (
              fileType === allowedType.toLowerCase() ||
              fileName.endsWith(allowedType.toLowerCase().replace(".", ""))
            );
          });
        });

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
          uploadData.method === "chunked"
        ) {
          // Google Drive chunked upload through our server
          const chunkSize = uploadData.chunkSize || 4 * 1024 * 1024;
          const totalChunks = Math.ceil(file.size / chunkSize);
          const sessionId = `${portal.id}-${Date.now()}-${Math.random()}`;

          console.log(
            `[Upload] Uploading ${file.name} in ${totalChunks} chunks`,
          );

          let uploadedBytes = 0;

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const chunkFormData = new FormData();

            chunkFormData.append("chunk", chunk);
            chunkFormData.append("portalId", portal.id);
            chunkFormData.append("fileName", file.name);
            chunkFormData.append("chunkIndex", chunkIndex.toString());
            chunkFormData.append("totalChunks", totalChunks.toString());
            chunkFormData.append("fileSize", file.size.toString());
            chunkFormData.append("sessionId", sessionId);
            chunkFormData.append(
              "mimeType",
              file.type || "application/octet-stream",
            );

            const chunkResponse = await fetch("/api/portals/upload-chunk", {
              method: "POST",
              body: chunkFormData,
            });

            if (!chunkResponse.ok) {
              const errorData = await chunkResponse.json();

              throw new Error(
                errorData.error || `Failed to upload chunk ${chunkIndex + 1}`,
              );
            }

            const chunkResult = await chunkResponse.json();

            uploadedBytes = end;
            const percentComplete = Math.round(
              (uploadedBytes / file.size) * 100,
            );

            setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));

            if (chunkResult.complete) {
              storageUrl = chunkResult.storageUrl;
              storageFileId = chunkResult.storageFileId;
              console.log(`[Upload] Chunked upload complete for ${file.name}`);
            }
          }

          if (!storageUrl || !storageFileId) {
            throw new Error(
              "Upload completed but no storage information received",
            );
          }
        } else {
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
              className="text-2xl font-bold"
              style={{ color: portal.textColor }}
            >
              {portal.name}
            </h1>
            <p className="mt-2 opacity-60" style={{ color: portal.textColor }}>
              This portal is password protected
            </p>
          </div>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50"
                style={{ color: portal.textColor }}
              />
              <input
                className="w-full pl-12 pr-4 py-3 rounded-xl border"
                placeholder="Enter password"
                style={{
                  backgroundColor: portal.backgroundColor,
                  borderColor: portal.primaryColor + "30",
                  color: portal.textColor,
                }}
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
            <Button
              className="w-full rounded-xl"
              disabled={authenticating}
              style={{ backgroundColor: portal.primaryColor }}
              type="submit"
            >
              {authenticating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
    <div className="min-h-screen" style={getBrandingStyles()}>
      {/* Header */}
      <header
        className="border-b py-6 px-4 md:px-8"
        style={{
          backgroundColor: portal.backgroundColor,
          borderColor: portal.primaryColor + "20",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {portal.logoUrl && (
              <img
                alt={portal.name}
                className="w-12 h-12 object-contain"
                src={portal.logoUrl}
              />
            )}
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: portal.textColor }}
              >
                {portal.name}
              </h1>
              {portal.welcomeMessage && (
                <p
                  className="mt-2 text-lg opacity-80"
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
        className="py-12 px-4 md:px-8"
        style={{ backgroundColor: portal.backgroundColor }}
      >
        <div className="max-w-4xl mx-auto">
          {uploadStatus === "success" ? (
            <div
              className="rounded-2xl p-8 text-center border"
              style={{
                backgroundColor: portal.cardBackgroundColor,
                borderColor: portal.primaryColor + "30",
              }}
            >
              <CheckCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: portal.primaryColor }}
              />
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: portal.textColor }}
              >
                {portal.successMessage}
              </h2>
              <p
                className="opacity-60 mb-6"
                style={{ color: portal.textColor }}
              >
                Your files have been securely uploaded. Thank you!
              </p>
              <Button
                className="rounded-xl"
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
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: portal.cardBackgroundColor,
                borderColor: portal.primaryColor + "20",
              }}
            >
              <div className="p-6 md:p-8">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: portal.textColor }}
                >
                  Upload Your Files
                </h2>

                {/* Client Information */}
                {(portal.requireClientName || portal.requireClientEmail) && (
                  <div className="space-y-4 mb-6">
                    {portal.requireClientName && (
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: portal.textColor }}
                        >
                          YOUR NAME *
                        </label>
                        <Input
                          className="rounded-xl"
                          placeholder="John Doe"
                          style={{
                            borderColor: portal.primaryColor + "30",
                            color: portal.textColor,
                          }}
                          type="text"
                          value={uploaderName}
                          onChange={(e) => setUploaderName(e.target.value)}
                        />
                      </div>
                    )}
                    {portal.requireClientEmail && (
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: portal.textColor }}
                        >
                          YOUR EMAIL *
                        </label>
                        <Input
                          className="rounded-xl"
                          placeholder="john@example.com"
                          style={{
                            borderColor: portal.primaryColor + "30",
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

                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-colors"
                  style={{
                    borderColor: portal.primaryColor + "30",
                  }}
                >
                  <Upload
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                    style={{ color: portal.primaryColor }}
                  />
                  <p
                    className="text-lg mb-2"
                    style={{ color: portal.textColor }}
                  >
                    Drag and drop files here, or click to select
                  </p>
                  <p
                    className="text-sm opacity-60 mb-4"
                    style={{ color: portal.textColor }}
                  >
                    Maximum file size:{" "}
                    {portal
                      ? `${(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB`
                      : "Loading..."}{" "}
                    per file
                  </p>
                  {portal.allowedFileTypes &&
                    portal.allowedFileTypes.length > 0 && (
                      <p
                        className="text-xs opacity-50 mb-4"
                        style={{ color: portal.textColor }}
                      >
                        Allowed:{" "}
                        {portal.allowedFileTypes
                          .map((t) => t.split(",")[0])
                          .join(", ")}
                      </p>
                    )}
                  <input
                    multiple
                    className="hidden"
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <Button
                    className="rounded-xl"
                    style={{
                      borderColor: portal.primaryColor,
                      color: portal.primaryColor,
                    }}
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    SELECT FILES
                  </Button>
                </div>

                {/* Selected Files */}
                {files.length > 0 && portal && (
                  <div className="mb-6">
                    <h3
                      className="font-semibold mb-3"
                      style={{ color: portal.textColor }}
                    >
                      Selected Files ({files.length})
                    </h3>
                    <div className="space-y-2">
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
                                  className="text-sm truncate"
                                  style={{ color: portal.textColor }}
                                >
                                  {file.name}
                                  {isOversized && (
                                    <span className="ml-2 text-xs font-bold text-red-500">
                                      TOO LARGE
                                    </span>
                                  )}
                                </p>
                                <p
                                  className="text-xs opacity-60"
                                  style={{ color: portal.textColor }}
                                >
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {uploading &&
                                fileProgress[index] !== undefined && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{ color: portal.primaryColor }}
                                  >
                                    {fileProgress[index]}%
                                  </span>
                                )}
                              <button
                                className="p-1 hover:bg-red-50 rounded"
                                disabled={uploading}
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-4 h-4 text-red-500" />
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
                  <div
                    className="mb-6 p-4 rounded-xl border border-red-200"
                    style={{ backgroundColor: "#fef2f2" }}
                  >
                    <p className="text-red-600 text-sm">{errorMessage}</p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  className="w-full rounded-xl"
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
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
            className="mt-8 p-4 rounded-xl border text-center"
            style={{
              backgroundColor: portal.cardBackgroundColor,
              borderColor: portal.primaryColor + "20",
            }}
          >
            <p
              className="text-sm opacity-60"
              style={{ color: portal.textColor }}
            >
              🔒 Your files are encrypted and securely stored. We take your
              privacy seriously.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
