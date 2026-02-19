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

    // Check file sizes
    // Note: Portal allows up to portal.maxFileSize, but current implementation
    // is limited by Vercel's 4.5MB API route body size limit
    // TODO: Implement direct upload to cloud storage for files > 4MB
    const portalMaxSize = parseInt(portal.maxFileSize); // in bytes
    const apiRouteLimit = 4 * 1024 * 1024; // 4MB - Vercel's limit
    const effectiveLimit = Math.min(portalMaxSize, apiRouteLimit);
    
    const oversizedForPortal = files.filter(f => f.size > portalMaxSize);
    const oversizedForApi = files.filter(f => f.size > apiRouteLimit && f.size <= portalMaxSize);
    
    if (oversizedForPortal.length > 0) {
      const fileList = oversizedForPortal.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`
      ).join(', ');
      
      setErrorMessage(
        `The following files exceed the portal's ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB size limit: ${fileList}`
      );
      return;
    }
    
    if (oversizedForApi.length > 0) {
      const fileList = oversizedForApi.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`
      ).join(', ');
      
      setErrorMessage(
        `The following files exceed the current 4MB upload limit: ${fileList}. ` +
        `This portal allows files up to ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB, but the upload system ` +
        `currently supports files up to 4MB. Please contact the portal owner for alternative upload methods.`
      );
      return;
    }

    setUploading(true);
    setFileProgress({});
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      // Upload files one by one with individual progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();

        formData.append("files", file);
        formData.append("portalId", portal!.id);
        formData.append("uploaderName", uploaderName.trim());
        formData.append("uploaderEmail", uploaderEmail.trim());

        // Use XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);

              setFileProgress((prev) => ({ ...prev, [i]: percentComplete }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFileProgress((prev) => ({ ...prev, [i]: 100 }));
              resolve();
            } else {
              try {
                const data = JSON.parse(xhr.responseText);

                setErrorMessage(data.error || `Failed to upload ${file.name}`);
              } catch {
                setErrorMessage(`Failed to upload ${file.name}`);
              }
              setUploadStatus("error");
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => {
            setErrorMessage(`Failed to upload ${file.name}. Please try again.`);
            setUploadStatus("error");
            reject(new Error("Upload failed"));
          });

          xhr.open("POST", "/api/portals/upload");
          xhr.send(formData);
        });
      }

      // All files uploaded successfully
      setUploadStatus("success");
      setFiles([]);
      setUploaderName("");
      setUploaderEmail("");
      setFileProgress({});
    } catch (error) {
      console.error("Upload failed:", error);
      if (uploadStatus !== "error") {
        setErrorMessage("Upload failed. Please try again.");
        setUploadStatus("error");
      }
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
                  Maximum file size: {portal ? `${(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB` : '4MB'} per file
                  {portal && parseInt(portal.maxFileSize) > 4 * 1024 * 1024 && (
                    <span className="block text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                      (Current upload system supports up to 4MB)
                    </span>
                  )}
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
                      const apiRouteLimit = 4 * 1024 * 1024; // 4MB
                      const isOversizedForPortal = file.size > portalMaxSize;
                      const isOversizedForApi = file.size > apiRouteLimit && file.size <= portalMaxSize;
                      const isOversized = isOversizedForPortal || isOversizedForApi;
                      
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
                                {isOversizedForPortal && ` (Portal Max: ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB)`}
                                {isOversizedForApi && ` (Current Limit: 4MB, Portal Allows: ${(portalMaxSize / 1024 / 1024).toFixed(0)}MB)`}
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
                  {portal && files.some(f => {
                    const portalMaxSize = parseInt(portal.maxFileSize);
                    const apiRouteLimit = 4 * 1024 * 1024;
                    return f.size > portalMaxSize || (f.size > apiRouteLimit && f.size <= portalMaxSize);
                  }) && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-400 font-mono text-xs">
                        ⚠️ Some files exceed size limits. 
                        {files.some(f => f.size > parseInt(portal.maxFileSize)) && 
                          ` Portal maximum: ${(parseInt(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB.`
                        }
                        {files.some(f => f.size > 4 * 1024 * 1024 && f.size <= parseInt(portal.maxFileSize)) && 
                          ` Current upload system supports up to 4MB. Contact portal owner for larger files.`
                        }
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
                  (portal && files.some(f => {
                    const portalMaxSize = parseInt(portal.maxFileSize);
                    const apiRouteLimit = 4 * 1024 * 1024;
                    return f.size > portalMaxSize || f.size > apiRouteLimit;
                  }))
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
