import { X, AlertCircle, CheckCircle } from "lucide-react";

import { FileTypeIcon } from "./file-type-icon";

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface PortalFileListProps {
  files: FileItem[];
  completedFiles?: FileItem[];
  onRemove: (id: string) => void;
  onAddMore: () => void;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  gradientEnabled?: boolean;
  uploading?: boolean;
}

export function PortalFileList({
  files,
  completedFiles = [],
  onRemove,
  onAddMore,
  primaryColor,
  secondaryColor,
  textColor,
  gradientEnabled = true,
  uploading = false,
}: PortalFileListProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const gradientStyle =
    gradientEnabled && secondaryColor
      ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
      : primaryColor;

  const pendingFiles = files.filter((f) => f.status === "pending");
  const uploadingFiles = files.filter((f) => f.status === "uploading");
  const errorFiles = files.filter((f) => f.status === "error");

  return (
    <div className="space-y-4">
      {/* Error Files Section */}
      {errorFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">
              Files with Errors{" "}
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100">
                {errorFiles.length}
              </span>
            </span>
          </div>
          {errorFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3 bg-red-50 border border-red-200"
            >
              <div className="shrink-0">
                <FileTypeIcon type={f.file.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-800">
                  {f.file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-400 text-xs">
                    {formatBytes(f.file.size)}
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-red-600 text-xs font-medium">
                    {f.error}
                  </span>
                </div>
              </div>
              <button
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full hover:bg-red-100 transition-colors group"
                title="Remove file"
                onClick={() => onRemove(f.id)}
              >
                <X className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending/Uploading Files Section */}
      {(pendingFiles.length > 0 || uploadingFiles.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-semibold"
              style={{ color: textColor }}
            >
              Files to Upload{" "}
              <span
                className="ml-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${primaryColor}1A`, color: primaryColor }}
              >
                {pendingFiles.length + uploadingFiles.length}
              </span>
            </span>
            {!uploading && (
              <button
                className="text-xs font-semibold hover:opacity-80 transition-colors"
                style={{ color: primaryColor }}
                onClick={onAddMore}
              >
                + Add more
              </button>
            )}
          </div>

          {[...uploadingFiles, ...pendingFiles].map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50 border border-slate-200"
            >
              <div className="shrink-0">
                <FileTypeIcon type={f.file.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: textColor }}
                >
                  {f.file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-400 text-xs">
                    {formatBytes(f.file.size)}
                  </span>
                  {f.status === "uploading" && (
                    <>
                      <span className="text-slate-300 text-xs">·</span>
                      {f.progress >= 100 ? (
                        <span
                          className="text-xs font-medium animate-pulse"
                          style={{ color: primaryColor }}
                        >
                          Transferring...
                        </span>
                      ) : (
                        <span
                          className="text-xs font-medium"
                          style={{ color: primaryColor }}
                        >
                          {Math.floor(f.progress)}%
                        </span>
                      )}
                    </>
                  )}
                </div>
                {f.status === "uploading" && (
                  <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${f.progress}%`,
                        background: gradientStyle,
                      }}
                    />
                  </div>
                )}
              </div>
              {f.status === "pending" && !uploading && (
                <button
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full hover:bg-red-50 transition-colors group"
                  title="Remove file"
                  onClick={() => onRemove(f.id)}
                >
                  <X className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              )}
              {f.status === "uploading" && (
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: primaryColor,
                      borderTopColor: "transparent",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed Files Drawer */}
      {completedFiles.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
            <span
              className="text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              Completed{" "}
              <span
                className="ml-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${primaryColor}1A`, color: primaryColor }}
              >
                {completedFiles.length}
              </span>
            </span>
          </div>
          {completedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3 border"
              style={{
                background: `${primaryColor}0D`,
                borderColor: `${primaryColor}40`,
              }}
            >
              <div className="shrink-0">
                <FileTypeIcon type={f.file.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-800">
                  {f.file.name}
                </p>
                <span className="text-slate-400 text-xs">
                  {formatBytes(f.file.size)}
                </span>
              </div>
              <CheckCircle
                className="w-5 h-5 shrink-0"
                style={{ color: primaryColor }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
