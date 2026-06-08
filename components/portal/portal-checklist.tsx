import React from "react";
import { Upload, X, CheckCircle2, FileText, AlertCircle, Plus } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-70" style={{ color: textColor }}>
          Required Documents
        </h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${primaryColor}15`, color: primaryColor }}>
          {items.length} Items
        </span>
      </div>

      <div className="grid gap-3">
        {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => {
          const files = slotFiles[item.id] || [];
          const isCompleted = files.some(f => f.status === "done") || (files.length > 0 && files.every(f => f.status === "pending" || f.status === "done"));
          // For the UI, we'll consider it "ready" if there are pending files
          const hasFiles = files.length > 0;
          const isUploading = files.some(f => f.status === "uploading");
          const isDragging = dragSlot === item.id;

          return (
            <div 
              key={item.id}
              className="group transition-all duration-200"
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
            >
              <div 
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  isDragging ? 'scale-[1.02] shadow-md' : ''
                } ${
                  hasFiles || isDragging ? 'border-opacity-100' : 'border-opacity-40 hover:border-opacity-100'
                }`}
                style={{ 
                  borderColor: (hasFiles || isDragging) ? primaryColor : `${primaryColor}40`,
                  backgroundColor: isDragging ? `${primaryColor}10` : hasFiles ? `${primaryColor}05` : 'transparent'
                }}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : isUploading ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center animate-spin" style={{ color: primaryColor }}>
                        <Upload className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${hasFiles ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                           style={hasFiles ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}>
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Item Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold truncate cursor-pointer" style={{ color: textColor }}>
                        {item.label}
                      </Label>
                      {item.required && <span className="text-red-500 text-xs font-black">*</span>}
                    </div>
                    <p className="text-xs opacity-60 mt-0.5" style={{ color: textColor }}>
                      {files.length > 0 
                        ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                        : item.required ? 'Action required' : 'Optional'
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <input
                      type="file"
                      id={`file-input-${item.id}`}
                      className="hidden"
                      multiple
                      onChange={(e) => e.target.files && onFilesSelected(item.id, e.target.files)}
                      disabled={uploading}
                    />
                    <button
                      onClick={() => document.getElementById(`file-input-${item.id}`)?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                      style={{ 
                        backgroundColor: primaryColor,
                        color: '#fff'
                      }}
                    >
                      {hasFiles ? 'Add More' : 'Select Files'}
                      {!hasFiles && <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* File List for this slot */}
                {files.length > 0 && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="h-px w-full opacity-10 bg-current" style={{ color: textColor }} />
                    <div className="grid gap-2 mt-3">
                      {files.map((f) => (
                        <div 
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/50 border border-black/5 text-xs transition-all"
                        >
                          <div className="shrink-0">
                            {f.status === 'error' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            ) : f.status === 'done' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate opacity-80" style={{ color: textColor }}>{f.file.name}</span>
                              <span className="shrink-0 opacity-40 tabular-nums">{formatBytes(f.file.size)}</span>
                            </div>
                            
                            {f.status === "uploading" && (
                              <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-300"
                                  style={{ width: `${f.progress}%`, backgroundColor: primaryColor }}
                                />
                              </div>
                            )}
                            {f.status === "error" && (
                              <p className="text-[10px] text-red-500 font-bold mt-0.5">{f.error}</p>
                            )}
                          </div>
                          {f.status !== "uploading" && !uploading && (
                            <button 
                              onClick={() => onRemoveFile(item.id, f.id)}
                              className="shrink-0 p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
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
