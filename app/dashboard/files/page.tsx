"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  HardDrive,
  ExternalLink,
} from "lucide-react";

interface File {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  downloads: number;
  portal: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPortal, setFilterPortal] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== id));
      } else {
        alert("Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      // If it's a cloud storage URL, open in new tab
      if (file.storageUrl.startsWith("http")) {
        window.open(file.storageUrl, "_blank");
      } else {
        // For local files, download via API
        const response = await fetch(`/api/files/${file.id}/download`);
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
        }
      }
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file");
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive")) return "📦";
    return "📎";
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPortal = filterPortal === "all" || file.portal.id === filterPortal;
    return matchesSearch && matchesPortal;
  });

  const uniquePortals = Array.from(new Set(files.map((f) => f.portal.id))).map((id) => {
    const file = files.find((f) => f.portal.id === id);
    return file?.portal;
  });

  const totalSize = files.reduce((acc, file) => acc + Number(file.size), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-mono">Files</h1>
          <p className="text-muted-foreground mt-2">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Files</h1>
          <p className="text-muted-foreground mt-2">Manage all uploaded files</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-mono">Total Storage</p>
            <p className="text-lg font-mono font-bold">{formatFileSize(totalSize.toString())}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#FF6B2C]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">Total Files</p>
              <p className="text-2xl font-mono font-bold">{files.length}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-[#FF6B2C]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">Storage Used</p>
              <p className="text-2xl font-mono font-bold">{formatFileSize(totalSize.toString())}</p>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-[#FF6B2C]" />
            <div>
              <p className="text-sm text-muted-foreground font-mono">Total Downloads</p>
              <p className="text-2xl font-mono font-bold">
                {files.reduce((acc, f) => acc + f.downloads, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-none font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterPortal}
            onChange={(e) => setFilterPortal(e.target.value)}
            className="px-3 py-2 border-2 border-border bg-muted/30 font-mono text-sm rounded-md focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20"
          >
            <option value="all">All Portals</option>
            {uniquePortals.map((portal) => (
              <option key={portal?.id} value={portal?.id}>
                {portal?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-mono font-semibold text-lg mb-2">
            {searchQuery || filterPortal !== "all" ? "No files found" : "No files yet"}
          </h3>
          <p className="text-muted-foreground font-mono text-sm">
            {searchQuery || filterPortal !== "all"
              ? "Try adjusting your search or filters"
              : "Files uploaded to your portals will appear here"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left p-4 font-mono text-sm font-semibold">File</th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">Portal</th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">Size</th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">Uploaded</th>
                  <th className="text-left p-4 font-mono text-sm font-semibold">Downloads</th>
                  <th className="text-right p-4 font-mono text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <div>
                          <p className="font-mono font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {file.mimeType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{file.portal.name}</span>
                        <a
                          href={`/portal/${file.portal.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF6B2C] hover:text-[#FF6B2C]/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{formatFileSize(file.size)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{formatDate(file.uploadedAt)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{file.downloads}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none font-mono"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(file.id, file.name)}
                          disabled={deleting === file.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
