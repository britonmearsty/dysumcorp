import { X, AlertCircle, CheckCircle, FileText, Image, FileArchive, Film, Music, ShieldCheck, Plus, Zap } from "lucide-react";

import { FileTypeIcon } from "./file-type-icon";

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  /** Upload speed string e.g. "4.2 MB/s" — shown under progress bar */
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

  const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "uploading");
  const errorFiles = files.filter((f) => f.status === "error");
  const hasActiveUploads = files.some((f) => f.status === "uploading");

  // Group files by type
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
      {/* ── Main card — same shape/border/bg as PortalChecklist items ── */}
      <div
        className="relative overflow-hidden rounded-[20px] sm:rounded-2xl border transition-all duration-300"
        style={{
          borderColor: hasActiveUploads ? primaryColor : `${primaryColor}40`,
          backgroundColor: hasActiveUploads ? `${primaryColor}05` : `${primaryColor}05`,
        }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-black/5 bg-white/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Circular spinner when uploading — matches checklist's isUploading indicator */}
            {hasActiveUploads ? (
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                />
              </div>
            ) : (
              <div className="flex -space-x-2 shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white">
                  <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                </div>
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black truncate" style={{ color: textColor }}>
                {hasActiveUploads ? "Uploading…" : "Files staged"}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                {hasActiveUploads ? (
                  <>
                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-amber-500 truncate">
                      {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} in progress
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 truncate">
                      Secured · {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!uploading && (
            <button
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: primaryColor, color: "#fff" }}
              onClick={onAddMore}
            >
              <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>

        {/* File list body */}
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-5">
          {/* Error Files */}
          {errorFiles.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-red-600">
                  Errors ({errorFiles.length})
                </span>
              </div>
              {errorFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-3 bg-red-50/50 border border-red-100 overflow-hidden"
                >
                  <FileTypeIcon type={f.file.type} size="w-4 h-4 sm:w-5 h-5" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-[11px] sm:text-xs font-bold truncate text-slate-800">
                      {f.file.name}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-red-600 font-black mt-0.5 uppercase">
                      {f.error}
                    </p>
                  </div>
                  <button
                    className="shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors"
                    onClick={() => onRemove(f.id)}
                  >
                    <X className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Grouped Files */}
          {Object.entries(fileGroups).map(([groupName, groupFiles]) => (
            <div key={groupName} className="space-y-1.5 sm:space-y-2">
              <div className="px-1 flex items-center justify-between">
                <span
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
                  style={{ color: textColor }}
                >
                  {groupName} ({groupFiles.length})
                </span>
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                {groupFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 bg-white/50 border border-black/5 transition-all duration-200 overflow-hidden"
                  >
                    {/* Left status — matches checklist file icon slot */}
                    <div className="shrink-0">
                      {f.status === "uploading" ? (
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}15` }}
                        >
                          <div
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                          />
                        </div>
                      ) : (
                        <FileTypeIcon type={f.file.type} size="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] sm:text-xs font-bold truncate" style={{ color: textColor }}>
                          {f.file.name}
                        </p>
                        <span className="text-[8px] sm:text-[10px] font-black opacity-30 tabular-nums shrink-0">
                          {formatBytes(f.file.size)}
                        </span>
                      </div>

                      {f.status === "uploading" && (
                        <>
                          {/* Progress bar */}
                          <div className="mt-1.5 h-1 w-full rounded-full overflow-hidden bg-black/5">
                            <div
                              className="h-full transition-all duration-300"
                              style={{ width: `${f.progress}%`, background: gradientStyle }}
                            />
                          </div>
                          {/* Speed + percent row */}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] font-black tabular-nums" style={{ color: primaryColor }}>
                              {f.progress}%
                            </span>
                            {f.speed && (
                              <span className="flex items-center gap-0.5 text-[9px] font-black tabular-nums text-slate-400">
                                <Zap className="w-2 h-2" />
                                {f.speed}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Remove button (pending only) */}
                    {f.status === "pending" && !uploading && (
                      <button
                        className="shrink-0 p-1 rounded-lg hover:bg-red-50 transition-colors group"
                        onClick={() => onRemove(f.id)}
                      >
                        <X className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-300 group-hover:text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {pendingFiles.length === 0 && errorFiles.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm font-medium opacity-40" style={{ color: textColor }}>
                No files staged yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Files — same separator style as checklist */}
      {completedFiles.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Handed Off ({completedFiles.length})
            </span>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            {completedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-3 bg-emerald-50/30 border border-emerald-100/50 overflow-hidden"
              >
                <FileTypeIcon type={f.file.type} />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs font-bold truncate text-slate-700">{f.file.name}</p>
                  <span className="text-[10px] opacity-40 font-medium">{formatBytes(f.file.size)}</span>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
