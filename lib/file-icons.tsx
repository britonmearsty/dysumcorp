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
  FileJson,
} from "lucide-react";

/**
 * Extract file extension from filename or mime type
 */
function getExtension(input: string): string {
  // If it looks like a MIME type, try to extract a common extension
  if (input.includes("/")) {
    const mimeToExt: Record<string, string> = {
      "text/x-python": "py",
      "text/x-c": "c",
      "text/x-c++": "cpp",
      "text/x-java": "java",
      "text/x-ruby": "rb",
      "text/x-go": "go",
      "text/x-rust": "rs",
      "text/x-php": "php",
      "text/x-shellscript": "sh",
      "text/markdown": "md",
      "text/plain": "txt",
      "text/x-sql": "sql",
      "application/x-yaml": "yaml",
      "application/x-toml": "toml",
      "application/javascript": "js",
      "text/javascript": "js",
      "application/x-executable": "exe",
    };
    return mimeToExt[input.toLowerCase()] || "";
  }

  // Otherwise treat as filename/extension
  const parts = input.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Get professional icon component for file type based on MIME type or extension
 */
export function getFileIcon(mimeType: string, className: string = "w-5 h-5") {
  const ext = getExtension(mimeType).toLowerCase();
  const input = mimeType.toLowerCase();

  // Images (standard MIME types)
  if (input.startsWith("image/")) {
    // Handle specific image formats
    if (input.includes("svg")) {
      return <FileCode className={className} />;
    }
    return <FileImage className={className} />;
  }

  // Custom image extensions (SVG, PSD, AI, Sketch, Figma)
  if (["svg", "psd", "ai", "sketch", "fig"].includes(ext)) {
    return <FileImage className={className} />;
  }

  // Videos
  if (input.startsWith("video/")) {
    return <FileVideo className={className} />;
  }

  // Audio
  if (input.startsWith("audio/")) {
    return <FileAudio className={className} />;
  }

  // PDFs
  if (input.includes("pdf")) {
    return <FileText className={className} />;
  }

  // Word documents
  if (input.includes("word") || input.includes("document")) {
    return <FileText className={className} />;
  }

  // Excel/Spreadsheets
  if (input.includes("sheet") || input.includes("excel")) {
    return <FileSpreadsheet className={className} />;
  }

  // PowerPoint/Presentations
  if (input.includes("presentation") || input.includes("powerpoint")) {
    return <Presentation className={className} />;
  }

  // Archives (zip, rar, 7z, tar, gz, etc.)
  if (
    input.includes("zip") ||
    input.includes("rar") ||
    input.includes("archive") ||
    input.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)
  ) {
    return <FileArchive className={className} />;
  }

  // Executables and disk images
  if (["exe", "app", "dmg", "msi", "deb", "rpm", "apk"].includes(ext)) {
    return <File className={className} />;
  }

  // JSON files
  if (input.includes("json") || ext === "json") {
    return <FileJson className={className} />;
  }

  // Code files - Python
  if (["py", "pyw", "pyx"].includes(ext)) {
    return <FileCode className={className} />;
  }

  // Code files - JavaScript/TypeScript
  if (
    input.includes("javascript") ||
    input.includes("typescript") ||
    input.includes("js") ||
    input.includes("ts") ||
    ["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)
  ) {
    return <FileCode className={className} />;
  }

  // Code files - Web (HTML, CSS, XML)
  if (
    input.includes("html") ||
    input.includes("css") ||
    input.includes("xml") ||
    ["html", "htm", "css", "xml", "svg"].includes(ext)
  ) {
    return <FileCode className={className} />;
  }

  // Code files - Other programming languages
  if (
    [
      "rb",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "php",
      "swift",
      "kt",
      "scala",
      "cs",
    ].includes(ext)
  ) {
    return <FileCode className={className} />;
  }

  // Shell scripts
  if (["sh", "bash", "zsh", "fish"].includes(ext)) {
    return <FileCode className={className} />;
  }

  // SQL files
  if (input.includes("sql") || ext === "sql") {
    return <FileCode className={className} />;
  }

  // Markdown and documentation
  if (
    input.includes("markdown") ||
    ["md", "markdown", "txt", "rst"].includes(ext)
  ) {
    return <FileText className={className} />;
  }

  // Config files - YAML, TOML, ENV
  if (
    input.includes("yaml") ||
    input.includes("toml") ||
    input.includes("env") ||
    ["yaml", "yml", "toml", "env", "ini", "cfg", "conf"].includes(ext)
  ) {
    return <FileText className={className} />;
  }

  // Default file icon
  return <File className={className} />;
}

/**
 * Get color class for file type icon
 */
export function getFileIconColor(mimeType: string): string {
  const ext = getExtension(mimeType).toLowerCase();
  const input = mimeType.toLowerCase();

  // Images
  if (input.startsWith("image/")) return "text-purple-500";
  if (["svg", "psd", "ai", "sketch", "fig"].includes(ext))
    return "text-purple-500";

  // Videos
  if (input.startsWith("video/")) return "text-red-500";

  // Audio
  if (input.startsWith("audio/")) return "text-green-500";

  // PDFs
  if (input.includes("pdf")) return "text-red-600";

  // Word documents
  if (input.includes("word") || input.includes("document"))
    return "text-blue-500";

  // Excel/Spreadsheets
  if (input.includes("sheet") || input.includes("excel"))
    return "text-emerald-600";

  // PowerPoint/Presentations
  if (input.includes("presentation") || input.includes("powerpoint"))
    return "text-orange-500";

  // Archives
  if (
    input.includes("zip") ||
    input.includes("rar") ||
    input.includes("archive") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(ext)
  )
    return "text-yellow-600";

  // Executables
  if (["exe", "app", "dmg", "msi", "deb", "rpm", "apk"].includes(ext))
    return "text-gray-500";

  // JSON
  if (input.includes("json") || ext === "json") return "text-yellow-500";

  // Python
  if (["py", "pyw", "pyx"].includes(ext)) return "text-blue-500";

  // JavaScript/TypeScript
  if (
    input.includes("javascript") ||
    input.includes("typescript") ||
    input.includes("js") ||
    input.includes("ts") ||
    ["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)
  )
    return "text-yellow-500";

  // Web (HTML, CSS, XML)
  if (
    input.includes("html") ||
    input.includes("css") ||
    input.includes("xml") ||
    ["html", "htm", "css", "xml", "svg"].includes(ext)
  )
    return "text-orange-500";

  // Other programming languages
  if (
    [
      "rb",
      "go",
      "rs",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "php",
      "swift",
      "kt",
      "scala",
      "cs",
    ].includes(ext)
  )
    return "text-indigo-500";

  // Shell scripts
  if (["sh", "bash", "zsh", "fish"].includes(ext)) return "text-green-600";

  // SQL
  if (input.includes("sql") || ext === "sql") return "text-orange-500";

  // Markdown and documentation
  if (
    input.includes("markdown") ||
    ["md", "markdown", "txt", "rst"].includes(ext)
  )
    return "text-slate-500";

  // Config files (YAML, TOML, ENV)
  if (
    input.includes("yaml") ||
    input.includes("toml") ||
    input.includes("env") ||
    ["yaml", "yml", "toml", "env", "ini", "cfg", "conf"].includes(ext)
  )
    return "text-slate-500";

  return "text-muted-foreground";
}
