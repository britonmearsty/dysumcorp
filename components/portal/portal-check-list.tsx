import React from "react";
import { Upload, X, CheckCircle2, FileText, AlertCircle, Plus, Shield, Home, FileUp } from "lucide-react";
import { Label } from "@/components/ui/label";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  sortOrder: number;
}

interface PortalChecklistProps {
  items: ChecklistItem[];
  slotFiles: Record<string, UploadFile[]>;
  uploading: boolean;
  primaryColor: string;
  textColor: string;
  onFilesSelected: (itemId: string, files: FileList) => void;
  onRemoveFile: (itemId: string, fileId: string) => void;
}

const itemIcons: Record<string, React.ElementType> = {
  business: Shield,
  address: Home,
  default: FileText,
};

function getIconForLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("business") || lower.includes("licence") || lower.includes("license")) return Shield;
  if (lower.includes("address") || lower.includes("proof")) return Home;
  return FileText;
}

export function PortalChecklist({
  items,
  slotFiles,
  uploading,
  primaryColor,
  textColor,
  onFilesSelected,
  onRemoveFile,
}: PortalChecklistProps) {
  const [dragSlot, setDragSlot] = React.useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (!uploading) setDragSlot(itemId);
  };

  const handleDragLeave = () => {
    setDragSlot(null);
  };

  const handleDrop = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    setDragSlot(null);
    if (!uploading && e.dataTransfer.files) {
      onFilesSelected(itemId, e.dataTransfer.files);
    }
  };

  const completedCount = items.filter((item) => {
    const files = slotFiles[item.id] || [];
    return files.length > 0 && files.every((f) => f.status === "done" || f.status === "pending");
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-sm font-semibold tracking-tight"
          style={{ color: textColor }}
        >
          Required Documents
        </h3>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${primaryColor}10`,
            color: primaryColor,
          }}
        >
          {completedCount} of {items.length} Uploaded
        </span>
      </div>

      <div className="space-y-3">
        {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => {
          const files = slotFiles[item.id] || [];
          const hasFiles = files.length > 0;
          const isUploading = files.some((f) => f.status === "uploading");
          const isCompleted = files.every((f) => f.status === "done" || f.status === "pending");
          const isDragging = dragSlot === item.id;
          const Icon = getIconForLabel(item.label);
          const isLast = items.length === 0;

          return (
            <div
              key={item.id}
              className="group transition-all duration-200"
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
            >
              <div
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isDragging ? "scale-[1.01]" : ""
                }`}
                style={{
                  borderColor: hasFiles || isDragging ? primaryColor : `${primaryColor}15`,
                  backgroundColor: isDragging
                    ? `${primaryColor}08`
                    : hasFiles
                      ? `${primaryColor}03`
                      : "white",
                }}
              >
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                      color: primaryColor,
                    }}
                  >
                    {isUploading ? (
                      <div
                        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                      />
                    ) : isCompleted && hasFiles ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Label
                        className="text-sm font-medium truncate cursor-pointer leading-tight"
                        style={{ color: textColor }}
                      >
                        {item.label}
                      </Label>
                      {item.required && (
                        <span
                          className="text-xs"
                          style={{ color: primaryColor }}
                        >
                          *
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: `${textColor}99` }}
                    >
                      {files.length > 0
                        ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                        : item.required
                          ? "Required"
                          : "Optional"}
                    </p>
                  </div>

                  <input
                    type="file"
                    id={`file-input-${item.id}`}
                    className="hidden"
                    multiple
                    onChange={(e) =>
                      e.target.files && onFilesSelected(item.id, e.target.files)
                    }
                    disabled={uploading}
                  />
                  <button
                    onClick={() =>
                      document.getElementById(`file-input-${item.id}`)?.click()
                    }
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                    style={{
                      backgroundColor: hasFiles ? `${primaryColor}10` : primaryColor,
                      color: hasFiles ? primaryColor : "white",
                    }}
                  >
                    {hasFiles ? (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </>
                    )}
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="px-4 pb-3 space-y-1.5">
                    <div
                      className="h-px w-full"
                      style={{ backgroundColor: `${textColor}10` }}
                    />
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                        style={{
                          backgroundColor: f.status === "error" ? "#fef2f2" : `${primaryColor}05`,
                        }}
                      >
                        {f.status === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : f.status === "done" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
                        ) : (
                          <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: `${textColor}50` }} />
                        )}
                        <span
                          className="flex-1 truncate font-medium"
                          style={{ color: textColor }}
                        >
                          {f.file.name}
                        </span>
                        <span
                          className="shrink-0"
                          style={{ color: `${textColor}60` }}
                        >
                          {formatBytes(f.file.size)}
                        </span>
                        {f.status !== "uploading" && !uploading && (
                          <button
                            onClick={() => onRemoveFile(item.id, f.id)}
                            className="p-0.5 rounded hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                        {f.status === "uploading" && (
                          <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                            style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
