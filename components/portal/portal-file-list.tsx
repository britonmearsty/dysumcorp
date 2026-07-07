import { X, AlertCircle, CheckCircle, FileText, Plus, Zap } from "lucide-react";
import { FileTypeIcon } from "./file-type-icon";

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  speed?: string;
}

interface PortalFileListProps {
  files: FileItem[];
  completedFiles?: FileItem[];
  onRemove: (id: string) => void;
  onAddMore: () => void;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  cardBackgroundColor?: string;
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
  cardBackgroundColor = "#ffffff",
  gradientEnabled = true,
  uploading = false,
}: PortalFileListProps) {
  // Derive a nested-card bg: slightly more opaque than the outer card so it's
  // distinguishable but still part of the same palette.
  const innerCardBg = `${cardBackgroundColor}CC`;
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const gradientStyle =
    gradientEnabled && secondaryColor
      ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
      : primaryColor;

  const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "uploading");
  const errorFiles = files.filter((f) => f.status === "error");
  const hasActiveUploads = files.some((f) => f.status === "uploading");

  const groupFiles = (fileList: FileItem[]) => {
    const groups: Record<string, FileItem[]> = {};
    fileList.forEach(f => {
      let group = "Other";
      const t = f.file.type.toLowerCase();
      if (t.startsWith("image/")) group = "Images";
      else if (t.startsWith("video/")) group = "Videos";
      else if (t.startsWith("audio/")) group = "Audio";
      else if (t.includes("zip") || t.includes("rar") || t.includes("tar")) group = "Archives";
      else if (t.includes("pdf") || t.includes("text") || t.includes("doc")) group = "Documents";
      if (!groups[group]) groups[group] = [];
      groups[group].push(f);
    });
    return groups;
  };

  const fileGroups = groupFiles(pendingFiles);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className="rounded-xl border transition-all duration-200 overflow-hidden"
        style={{
          borderColor: hasActiveUploads ? primaryColor : `${primaryColor}15`,
          backgroundColor: innerCardBg,
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${textColor}10`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              {hasActiveUploads ? (
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                />
              ) : (
                <FileText className="w-4 h-4" style={{ color: primaryColor }} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textColor }}>
                {hasActiveUploads ? "Uploading..." : "Selected Files"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: `${textColor}60` }}>
                {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""}
                {hasActiveUploads && " in progress"}
              </p>
            </div>
          </div>
          {!uploading && (
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: `${primaryColor}10`,
                color: primaryColor,
              }}
              onClick={onAddMore}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>

        <div className="p-3 space-y-3">
          {errorFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider px-1">
                Errors ({errorFiles.length})
              </p>
              {errorFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 bg-red-50/50 border border-red-100"
                >
                  <FileTypeIcon type={f.file.type} size="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-red-800">{f.file.name}</p>
                    <p className="text-[10px] text-red-600 mt-0.5">{f.error}</p>
                  </div>
                  <button
                    className="shrink-0 p-0.5 rounded hover:bg-red-100 transition-colors"
                    onClick={() => onRemove(f.id)}
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {Object.entries(fileGroups).map(([groupName, groupFiles]) => (
            <div key={groupName} className="space-y-1.5">
              {pendingFiles.length > 0 && (
                <p className="text-[11px] font-medium px-1" style={{ color: `${textColor}50` }}>
                  {groupName} ({groupFiles.length})
                </p>
              )}
              {groupFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 border"
                  style={{
                    backgroundColor: `${primaryColor}03`,
                    borderColor: `${textColor}08`,
                  }}
                >
                  <div className="shrink-0">
                    {f.status === "uploading" ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <div
                          className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                        />
                      </div>
                    ) : (
                      <FileTypeIcon type={f.file.type} size="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate" style={{ color: textColor }}>
                        {f.file.name}
                      </p>
                      <span className="text-[10px] shrink-0" style={{ color: `${textColor}50` }}>
                        {formatBytes(f.file.size)}
                      </span>
                    </div>

                    {f.status === "uploading" && (
                      <div className="mt-1.5 space-y-1">
                        <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{ width: `${f.progress}%`, background: gradientStyle }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium" style={{ color: primaryColor }}>
                            {f.progress}%
                          </span>
                          {f.speed && (
                            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: `${textColor}50` }}>
                              <Zap className="w-2.5 h-2.5" />
                              {f.speed}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {f.status === "pending" && !uploading && (
                    <button
                      className="shrink-0 p-0.5 rounded hover:bg-red-100 transition-colors"
                      onClick={() => onRemove(f.id)}
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

          {pendingFiles.length === 0 && errorFiles.length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: `${textColor}40` }}>
              No files selected yet
            </p>
          )}
        </div>
      </div>

      {completedFiles.length > 0 && (
        <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${textColor}10` }}>
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-xs font-semibold" style={{ color: primaryColor }}>
              Completed ({completedFiles.length})
            </span>
          </div>
          {completedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 border"
              style={{
                backgroundColor: `${primaryColor}05`,
                borderColor: `${primaryColor}10`,
              }}
            >
              <FileTypeIcon type={f.file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: textColor }}>{f.file.name}</p>
                <span className="text-[10px]" style={{ color: `${textColor}50` }}>{formatBytes(f.file.size)}</span>
              </div>
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
