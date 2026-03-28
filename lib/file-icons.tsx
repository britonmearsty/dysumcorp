import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  File,
  Presentation,
} from "lucide-react";

/**
 * Get professional icon component for file type based on MIME type
 */
export function getFileIcon(mimeType: string, className: string = "w-5 h-5") {
  // Images
  if (mimeType.startsWith("image/")) {
    return <FileImage className={className} />;
  }

  // Videos
  if (mimeType.startsWith("video/")) {
    return <FileVideo className={className} />;
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return <FileAudio className={className} />;
  }

  // PDFs
  if (mimeType.includes("pdf")) {
    return <FileText className={className} />;
  }

  // Word documents
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className={className} />;
  }

  // Excel/Spreadsheets
  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className={className} />;
  }

  // PowerPoint/Presentations
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return <Presentation className={className} />;
  }

  // Archives (zip, rar, etc.)
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  ) {
    return <FileArchive className={className} />;
  }

  // Code files
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("xml")
  ) {
    return <FileCode className={className} />;
  }

  // Default file icon
  return <File className={className} />;
}

/**
 * Get color class for file type icon
 */
export function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "text-purple-500";
  if (mimeType.startsWith("video/")) return "text-red-500";
  if (mimeType.startsWith("audio/")) return "text-green-500";
  if (mimeType.includes("pdf")) return "text-red-600";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "text-blue-500";
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return "text-emerald-600";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "text-orange-500";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return "text-yellow-600";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("xml")
  )
    return "text-yellow-500";

  return "text-muted-foreground";
}
