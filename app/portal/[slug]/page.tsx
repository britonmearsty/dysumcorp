"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Portal {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  whiteLabeled: boolean;
  maxFileSize: string; // BigInt as string
  allowedFileTypes: string[] | null;
  requireClientName: boolean;
  requireClientEmail: boolean;
  welcomeMessage: string | null;
  submitButtonText: string;
  userId: string;
}

export default function PublicPortalPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<number, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");

  useEffect(() => {
    fetchPortal();
  }, [slug]);

  const fetchPortal = async () => {
    try {
      const response = await fetch(`/api/portals/public/${slug}`);

      if (response.ok) {
        const data = await response.json();

        setPortal(data.portal);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("Please select at least one file");
      return;
    }

    if (!uploaderName.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }

    if (!uploaderEmail.trim()) {
      setErrorMessage("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(uploaderEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!portal) {
      setErrorMessage("Portal information not loaded");
      return;
    }

    // Check file sizes against portal limit
    const portalMaxSize = parseInt(portal.maxFileSize);
    const oversizedFiles = files.filter(f => f.size > portalMaxSize);
    
    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`
      ).join(', ');
      
      setErrorMessage(
        `The following files exceed the portal's ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB size limit: ${fileList}`
      );
      return;
    }

    setUploading(true);
    setFileProgress({});
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      // Upload files one by one with direct upload to cloud storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`[Upload] Starting upload for file ${i + 1}/${files.length}: ${file.name}`);
        
        // Step 1: Get upload URL/credentials
        setFileProgress((prev) => ({ ...prev, [i]: 0 }));
        
        const directUploadResponse = await fetch("/api/portals/direct-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            portalId: portal.id,
          }),
        });

        if (!directUploadResponse.ok) {
          const errorData = await directUploadResponse.json();
          throw new Error(errorData.error || "Failed to prepare upload");
        }

        const uploadData = await directUploadResponse.json();
        console.log(`[Upload] Upload credentials received for ${file.name}, provider: ${uploadData.provider}`);

        // Step 2: Upload directly to cloud storage
        let storageUrl: string = "";
        let storageFileId: string = "";

        if (uploadData.provider === "google" && uploadData.method === "chunked") {
          // Google Drive chunked upload through our server
          const chunkSize = uploadData.chunkSize || 4 * 1024 * 1024; // 4MB chunks
          const totalChunks = Math.ceil(file.size / chunkSize);
          const sessionId = `${portal.id}-${Date.now()}-${Math.random()}`;

          console.log(`[Upload] Uploading ${file.name} in ${totalChunks} chunks`);

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
            chunkFormData.append("mimeType", file.type || "application/octet-stream");

            const chunkResponse = await fetch("/api/portals/upload-chunk", {
              method: "POST",
              body: chunkFormData,
            });

            if (!chunkResponse.ok) {
              const errorData = await chunkResponse.json();
              throw new Error(errorData.error || `Failed to upload chunk ${chunkIndex + 1}`);
            }

            const chunkResult = await chunkResponse.json();

            uploadedBytes = end;
            const percentComplete = Math.round((uploadedBytes / file.size) * 100);
            setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));

            if (chunkResult.complete) {
              storageUrl = chunkResult.storageUrl;
              storageFileId = chunkResult.storageFileId;
              console.log(`[Upload] Chunked upload complete for ${file.name}`);
            }
          }
          
          // Ensure we have the values
          if (!storageUrl || !storageFileId) {
            throw new Error("Upload completed but no storage information received");
          }
        } else {
          // Dropbox upload (direct from browser)
          const uploadResponse = await new Promise<{url: string, id: string}>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));
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
            xhr.setRequestHeader("Authorization", `Bearer ${uploadData.accessToken}`);
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            xhr.setRequestHeader("Dropbox-API-Arg", JSON.stringify({
              path: uploadData.path,
              mode: "add",
              autorename: true,
              mute: false,
            }));
            xhr.send(file);
          });

          storageUrl = uploadResponse.url;
          storageFileId = uploadResponse.id;
        }

        console.log(`[Upload] File uploaded to ${uploadData.provider}: ${file.name}`);

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
      const errorMsg = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setErrorMessage(errorMsg);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-mono">Loading portal...</p>
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold font-mono mb-2">
            Portal Not Found
          </h1>
          <p className="text-muted-foreground font-mono">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-mono">{portal.name}</h1>
          <p className="text-muted-foreground font-mono mt-2">
            Secure file upload portal
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {uploadStatus === "success" ? (
            <div className="border border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold font-mono mb-2">
                Upload Successful!
              </h2>
              <p className="text-muted-foreground font-mono mb-6">
                Your files have been securely uploaded. Thank you!
              </p>
              <Button
                className="rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                onClick={() => {
                  setUploadStatus("idle");
                  setFiles([]);
                }}
              >
                UPLOAD MORE FILES
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold font-mono mb-6">
                Upload Your Files
              </h2>

              {/* Client Information */}
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-mono font-medium mb-2"
                    htmlFor="uploaderName"
                  >
                    YOUR NAME *
                  </label>
                  <Input
                    className="rounded-none font-mono border-2"
                    id="uploaderName"
                    placeholder="John Doe"
                    type="text"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-mono font-medium mb-2"
                    htmlFor="uploaderEmail"
                  >
                    YOUR EMAIL *
                  </label>
                  <Input
                    className="rounded-none font-mono border-2"
                    id="uploaderEmail"
                    placeholder="john@example.com"
                    type="email"
                    value={uploaderEmail}
                    onChange={(e) => setUploaderEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center mb-6 hover:border-[rgba(51,65,85,0.5)] transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-mono mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  Maximum file size: {portal ? `${(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB` : 'Loading...'} per file
                </p>
                <Input
                  multiple
                  className="hidden"
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <Button
                  className="rounded-none font-mono"
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
                  <h3 className="font-mono font-semibold mb-3">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((file, index) => {
                      const portalMaxSize = parseInt(portal.maxFileSize);
                      const isOversized = file.size > portalMaxSize;
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 border rounded ${
                            isOversized 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className={`w-5 h-5 ${
                              isOversized ? 'text-red-500' : 'text-[#334155]'
                            }`} />
                            <div className="flex-1">
                              <p className={`font-mono text-sm ${
                                isOversized ? 'text-red-700 dark:text-red-400' : ''
                              }`}>
                                {file.name}
                                {isOversized && (
                                  <span className="ml-2 text-xs font-bold">
                                    ⚠️ TOO LARGE
                                  </span>
                                )}
                              </p>
                              <p className={`text-xs font-mono ${
                                isOversized 
                                  ? 'text-red-600 dark:text-red-400 font-semibold' 
                                  : 'text-muted-foreground'
                              }`}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                {isOversized && ` (Max: ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB)`}
                              </p>
                            </div>
                            {uploading && fileProgress[index] !== undefined && (
                              <span className="text-sm font-mono font-medium">
                                {fileProgress[index]}%
                              </span>
                            )}
                          </div>
                          {uploading && fileProgress[index] !== undefined && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#334155] h-full transition-all duration-300 ease-out"
                                style={{ width: `${fileProgress[index]}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Oversized files warning */}
                  {portal && files.some(f => f.size > parseInt(portal.maxFileSize)) && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-400 font-mono text-xs">
                        ⚠️ Some files exceed the portal's {(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB size limit. Please remove them before uploading.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {uploadStatus === "error" && errorMessage && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-red-700 dark:text-red-400 font-mono text-sm">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <Button
                className="w-full rounded-none bg-[#334155] hover:bg-[rgba(51,65,85,0.9)] font-mono"
                disabled={
                  files.length === 0 ||
                  uploading ||
                  !uploaderName.trim() ||
                  !uploaderEmail.trim() ||
                  (portal && files.some(f => f.size > parseInt(portal.maxFileSize)))
                }
                onClick={handleUpload}
              >
                {uploading ? "UPLOADING..." : "UPLOAD FILES"}
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground font-mono text-center">
              🔒 Your files are encrypted and securely stored. We take your
              privacy seriously.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
