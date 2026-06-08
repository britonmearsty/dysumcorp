import { CheckCircle, Upload, Send, AlertCircle } from "lucide-react";

import { FileTypeIcon } from "./file-type-icon";
import { PortalButton } from "./portal-button";

interface SentFile {
  name: string;
  size: number;
  type: string;
}

interface FailedFile {
  name: string;
  size: number;
  type: string;
  error?: string;
}

interface PortalSuccessViewProps {
  uploaderName?: string;
  uploaderEmail?: string;
  sentFiles: SentFile[];
  failedFiles?: FailedFile[];
  successMessage: string;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  gradientEnabled?: boolean;
  onUploadMore: () => void;
}

export function PortalSuccessView({
  uploaderName,
  uploaderEmail,
  sentFiles,
  failedFiles = [],
  successMessage,
  primaryColor,
  secondaryColor,
  textColor,
  gradientEnabled = true,
  onUploadMore,
}: PortalSuccessViewProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Success hero */}
      <div className="flex flex-col items-center text-center gap-6 py-4">
        <div className="relative">
          <div 
            className="absolute inset-0 blur-3xl opacity-30 animate-pulse"
            style={{ background: primaryColor }}
          />
          <div
            className="relative flex items-center justify-center w-24 h-24 rounded-[32px] bg-white shadow-2xl border transition-transform hover:scale-105 duration-500"
            style={{
              borderColor: `${primaryColor}20`,
            }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: primaryColor }} />
          </div>
        </div>
        <div>
          <h1
            className="text-4xl font-black tracking-tight mb-3"
            style={{ color: textColor }}
          >
            {successMessage}
          </h1>
          {uploaderName ? (
            <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
              Mission accomplished,{" "}
              <span className="font-bold" style={{ color: primaryColor }}>
                {uploaderName}
              </span>
              ! Your files are secured. 
              {uploaderEmail && (
                <span className="block text-sm mt-2 opacity-60">
                  Confirmation sent to {uploaderEmail}
                </span>
              )}
            </p>
          ) : (
            <p className="text-slate-500 text-lg">
              Your files have been received and are in safe hands.
            </p>
          )}
        </div>
      </div>

      {/* Failed files card */}
      {failedFiles.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-white border border-red-200 shadow-sm">
          {/* Card header */}
          <div className="px-6 py-4 flex items-center gap-2 border-b border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">
              Failed to Upload
            </span>
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">
              {failedFiles.length} {failedFiles.length === 1 ? "file" : "files"}
            </span>
          </div>

          {/* File rows */}
          <div className="p-4 space-y-2">
            {failedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-red-50 border border-red-200"
              >
                <div className="shrink-0">
                  <FileTypeIcon type={f.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-red-800">
                    {f.name}
                  </p>
                  <p className="text-red-500 text-xs mt-0.5">
                    {f.error || "Upload failed"}
                  </p>
                </div>
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent files card */}
      {sentFiles.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          {/* Card header */}
          <div
            className="px-6 py-4 flex items-center gap-2 border-b"
            style={{
              background: `${primaryColor}0D`,
              borderColor: `${primaryColor}40`,
            }}
          >
            <Send className="w-4 h-4" style={{ color: primaryColor }} />
            <span
              className="text-sm font-semibold"
              style={{ color: textColor }}
            >
              Sent Files
            </span>
            <span
              className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-semibold border"
              style={{
                background: `${primaryColor}1A`,
                color: primaryColor,
                borderColor: `${primaryColor}40`,
              }}
            >
              {sentFiles.length} {sentFiles.length === 1 ? "file" : "files"}
            </span>
          </div>

          {/* File rows */}
          <div className="p-4 space-y-2">
            {sentFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50 border border-slate-200"
              >
                <div className="shrink-0">
                  <FileTypeIcon type={f.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: textColor }}
                  >
                    {f.name}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {formatBytes(f.size)}
                  </p>
                </div>
                <CheckCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: primaryColor }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload More button */}
      <PortalButton
        gradientEnabled={gradientEnabled}
        icon={<Upload className="w-4 h-4" />}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onClick={onUploadMore}
      >
        Upload More Files
      </PortalButton>

      <p className="text-center text-slate-400 text-xs">
        Your name and email will be pre-filled when you return to the upload
        form.
      </p>
    </div>
  );
}
