"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  X,
  FileText,
  Calendar,
  Mail,
  Copy,
  Check,
  Download,
  ExternalLink,
  Trash2,
  MessageSquare,
} from "lucide-react";

import { getFileIcon, getFileIconColor } from "@/lib/file-icons";
import { useToast } from "@/lib/toast";
import { useStorageDeleteBehavior } from "@/lib/use-storage-delete-behavior";
import { DeleteFileModal } from "@/components/ui/delete-file-modal";
import { useSession } from "@/lib/auth-client";

interface UploadGroup {
  id: string; // Upload session ID
  uploaderName: string;
  uploaderEmail: string;
  uploaderNotes: string | null;
  totalFiles: number;
  totalSize: string;
  uploadedAt: string;
  portalName: string;
  portalSlug: string;
  files: FileItem[];
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  downloads: number;
  passwordHash?: string | null;
  expiresAt?: string | null;
  uploaderEmail?: string | null;
  uploaderName?: string | null;
  uploadSessionId?: string | null;
  portal: {
    id: string;
    name: string;
    slug: string;
  };
  uploadSession?: {
    id: string;
    uploaderName: string | null;
    uploaderEmail: string | null;
    uploaderNotes: string | null;
    uploadedAt: string;
    fileCount: number;
    totalSize: string;
  } | null;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<UploadGroup | null>(
    null,
  );
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { showToast } = useToast();
  const { data: session, isPending } = useSession();
  const { behavior: deleteBehavior } = useStorageDeleteBehavior();

  const fetchUploads = useCallback(async () => {
    try {
      const response = await fetch("/api/files");

      if (response.ok) {
        const data = await response.json();
        const files = data.files || [];

        // Group files by upload session
        const groupedMap = new Map<string, UploadGroup>();

        files.forEach((file: FileItem) => {
          // Use uploadSessionId if available, otherwise create a fallback key for legacy files
          const sessionKey =
            file.uploadSessionId ||
            `legacy-${file.uploaderEmail || file.uploaderName || "anonymous"}-${file.uploadedAt}`;

          if (groupedMap.has(sessionKey)) {
            const group = groupedMap.get(sessionKey)!;

            group.files.push(file);
            // Always recalculate counts from actual files
            group.totalFiles = group.files.length;
            group.totalSize = group.files
              .reduce((sum, f) => sum + BigInt(f.size), BigInt(0))
              .toString();
          } else {
            // Create new group from upload session data or file data
            if (file.uploadSession) {
              groupedMap.set(sessionKey, {
                id: file.uploadSession.id,
                uploaderName: file.uploadSession.uploaderName || "Anonymous",
                uploaderEmail: file.uploadSession.uploaderEmail || "",
                uploaderNotes: file.uploadSession.uploaderNotes || null,
                totalFiles: 1, // Start with 1, will be recalculated as more files are added
                totalSize: file.size,
                uploadedAt: file.uploadSession.uploadedAt,
                portalName: file.portal.name,
                portalSlug: file.portal.slug,
                files: [file],
              });
            } else {
              // Legacy file without session
              groupedMap.set(sessionKey, {
                id: sessionKey,
                uploaderName: file.uploaderName || "Anonymous",
                uploaderEmail: file.uploaderEmail || "",
                uploaderNotes: null, // Legacy files don't have notes
                totalFiles: 1,
                totalSize: file.size,
                uploadedAt: file.uploadedAt,
                portalName: file.portal.name,
                portalSlug: file.portal.slug,
                files: [file],
              });
            }
          }
        });

        // Convert map to array and sort by date (newest first)
        const groupedArray = Array.from(groupedMap.values()).sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );

        setUploads(groupedArray);
      } else {
        const errorData = await response.json();

        console.error("Failed to fetch uploads:", errorData);
        showToast(errorData.error || "Failed to fetch uploads", "error");
      }
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      showToast("Failed to fetch uploads", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (session) {
      fetchUploads();
    }
  }, [session, fetchUploads]);

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );

    const timeString = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return `Today, ${timeString}`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return `Yesterday, ${timeString}`;
    } else {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getDayCategory = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Today";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const handleUploadClick = (upload: UploadGroup) => {
    setSelectedUpload(upload);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      let filePassword = "";

      if (file.passwordHash) {
        const promptPassword = prompt(
          "This file is password protected. Please enter the password:",
        );

        if (!promptPassword) return;
        filePassword = promptPassword;
      }
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: file.passwordHash ? { "x-file-password": filePassword } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.status === 401) {
        showToast("Invalid password. Please try again.", "error");
      } else {
        try {
          const errorData = await response.json();

          showToast(errorData.error || "Failed to download file", "error");
        } catch {
          showToast("Failed to download file", "error");
        }
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      showToast("Failed to download file", "error");
    }
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteFile = async (deleteFromStorage: boolean) => {
    if (!fileToDelete) return;
    setDeleteModalOpen(false);
    setDeletingFile(fileToDelete.id);
    try {
      const response = await fetch(`/api/files/${fileToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteFromStorage }),
      });

      if (response.ok) {
        // Remove file from selected upload
        if (selectedUpload) {
          const updatedFiles = selectedUpload.files.filter(
            (f) => f.id !== fileToDelete.id,
          );

          if (updatedFiles.length === 0) {
            // If no files left, close modal and refresh
            setSelectedUpload(null);
            fetchUploads();
          } else {
            setSelectedUpload({
              ...selectedUpload,
              files: updatedFiles,
              totalFiles: updatedFiles.length,
            });
          }
        }
        // Refresh uploads list
        fetchUploads();
        showToast("File deleted successfully", "success");
      } else {
        showToast("Failed to delete file", "error");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      showToast("Failed to delete file", "error");
    } finally {
      setDeletingFile(null);
      setFileToDelete(null);
    }
  };

  const filteredUploads = uploads.filter(
    (u) =>
      u.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uploaderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.portalName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group uploads by day
  const uploadsByDay = filteredUploads.reduce(
    (acc, upload) => {
      const dayCategory = getDayCategory(upload.uploadedAt);

      if (!acc[dayCategory]) {
        acc[dayCategory] = [];
      }
      acc[dayCategory].push(upload);

      return acc;
    },
    {} as Record<string, UploadGroup[]>,
  );

  // Sort day categories (Today first, then Yesterday, then chronological)
  const sortedDays = Object.keys(uploadsByDay).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    // For other days, sort by the first upload's date in each category
    const dateA = new Date(uploadsByDay[a][0].uploadedAt);
    const dateB = new Date(uploadsByDay[b][0].uploadedAt);

    return dateB.getTime() - dateA.getTime();
  });

  if (isPending || loading) {
    return (
      <div className="w-full overflow-hidden">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Uploads
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-lg">
            Loading...
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Uploads
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-lg">
          View all file uploads from your portals, organized by upload session.
        </p>
      </div>

      <div className="w-full overflow-hidden">
        <div className="bg-bg-card rounded-[14px] border border-border overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                All Uploads
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                {uploads.length} upload session{uploads.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none text-sm text-foreground"
                placeholder="Search uploads..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="p-0">
            {filteredUploads.length > 0 ? (
              sortedDays.map((dayCategory) => (
                <div key={dayCategory}>
                  {/* Day Category Header */}
                  <div className="px-4 sm:px-6 py-2 bg-muted/50 border-b border-border">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {dayCategory}
                    </h3>
                  </div>

                  {/* Uploads for this day */}
                  <div className="divide-y divide-border">
                    {uploadsByDay[dayCategory].map((upload) => (
                      <button
                        key={upload.id}
                        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-5 text-left hover:bg-muted/50 transition-colors group"
                        onClick={() => handleUploadClick(upload)}
                      >
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors flex-shrink-0">
                          <Upload className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground truncate text-sm sm:text-base">
                              {upload.uploaderName}
                            </span>
                            {upload.uploaderNotes && (
                              <span className="bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                Notes
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {upload.uploaderEmail || "No email provided"} •{" "}
                            {upload.portalName}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-start sm:items-end gap-1 sm:gap-1 sm:px-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              {upload.totalFiles} file
                              {upload.totalFiles !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDate(upload.uploadedAt)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 sm:py-20 px-4 sm:px-6">
                <div className="p-3 sm:p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                  <Upload className="w-6 sm:w-8 h-6 sm:w-8 text-muted-foreground" />
                </div>
                <h4 className="text-foreground font-semibold mb-1">
                  {searchQuery ? "No uploads found" : "No uploads yet"}
                </h4>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {searchQuery
                    ? "We couldn't find any uploads matching your search."
                    : "Uploads will appear here when clients upload files to your portals."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Detail Modal */}
      <AnimatePresence>
        {selectedUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/40 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setSelectedUpload(null)}
            />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-2xl bg-bg-card rounded-[14px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-2"
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="p-4 sm:p-6 lg:p-8 border-b border-border bg-muted/50 flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/30 shadow-sm border border-blue-200 dark:border-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-2xl font-bold text-foreground leading-tight truncate">
                      {selectedUpload.uploaderName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedUpload.uploaderEmail && (
                        <>
                          <p className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {selectedUpload.uploaderEmail}
                            </span>
                          </p>
                          <button
                            className={`p-1.5 rounded-lg transition-all border flex-shrink-0 ${
                              copiedEmail
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30"
                                : "bg-card text-muted-foreground hover:text-foreground hover:border-border border-border"
                            }`}
                            title="Copy email address"
                            onClick={() =>
                              copyToClipboard(selectedUpload.uploaderEmail!)
                            }
                          >
                            {copiedEmail ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="p-1.5 sm:p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                  type="button"
                  onClick={() => setSelectedUpload(null)}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
                {/* Upload Info */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="bg-bg-card p-3 sm:p-4 rounded-[14px] border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Total Files
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {selectedUpload.totalFiles}
                    </p>
                  </div>
                  <div className="bg-bg-card p-3 sm:p-4 rounded-[14px] border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Total Size
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {formatFileSize(selectedUpload.totalSize)}
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedUpload.uploaderNotes && (
                  <div className="mb-6 sm:mb-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Client Notes
                      </h4>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                      {selectedUpload.uploaderNotes}
                    </p>
                  </div>
                )}

                {/* Files List */}
                <h4 className="text-sm font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Uploaded Files
                </h4>

                <div className="space-y-2">
                  {selectedUpload.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted rounded-xl border border-border hover:bg-bg-card transition-colors"
                    >
                      <span
                        className={`flex-shrink-0 ${getFileIconColor(file.mimeType)}`}
                      >
                        {getFileIcon(file.mimeType, "w-4 h-4 sm:w-5 sm:h-5")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(file.uploadedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                          title="Download"
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                          title="Open file"
                          type="button"
                          onClick={() => window.open(file.storageUrl, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-50"
                          disabled={deletingFile === file.id}
                          title="Delete"
                          type="button"
                          onClick={() => handleDeleteFile(file.id, file.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-muted border-t border-border flex justify-end">
                <button
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-card border border-border rounded-xl sm:rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                  type="button"
                  onClick={() => setSelectedUpload(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteFileModal
        behavior={deleteBehavior}
        fileName={fileToDelete?.name ?? ""}
        open={deleteModalOpen && !!fileToDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDeleteFile}
      />
    </div>
  );
}
