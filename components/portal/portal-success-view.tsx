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
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 py-2 sm:py-4">
        <div className="relative">
          <div 
            className="absolute inset-0 blur-3xl opacity-30 animate-pulse"
            style={{ background: primaryColor }}
          />
          <div
            className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] sm:rounded-[32px] bg-white shadow-2xl border transition-transform hover:scale-105 duration-500"
            style={{
              borderColor: `${primaryColor}20`,
            }}
          >
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: primaryColor }} />
          </div>
        </div>
        <div>
          <h1
            className="text-2xl sm:text-4xl font-black tracking-tight mb-2 sm:mb-3 px-4"
            style={{ color: textColor }}
          >
            {successMessage}
          </h1>
          {uploaderName ? (
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto px-6">
              Mission accomplished,{" "}
              <span className="font-bold" style={{ color: primaryColor }}>
                {uploaderName}
              </span>
              ! Your files are secured. 
              {uploaderEmail && (
                <span className="block text-xs sm:text-sm mt-1 sm:mt-2 opacity-60">
                  Confirmation sent to {uploaderEmail}
                </span>
              )}
            </p>
          ) : (
            <p className="text-slate-500 text-base sm:text-lg px-6">
              Your files have been received and are in safe hands.
            </p>
          )}
        </div>
      </div>

      {/* Failed files card */}
      {failedFiles.length > 0 && (
        <div className="rounded-[20px] sm:rounded-2xl overflow-hidden bg-white border border-red-200 shadow-sm mx-1 sm:mx-0">
          {/* Card header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 border-b border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-red-700">
              Failed to Upload
            </span>
            <span className="ml-auto text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-black bg-red-100 text-red-600">
              {failedFiles.length}
            </span>
          </div>

          {/* File rows */}
          <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            {failedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-3 bg-red-50/50 border border-red-100 overflow-hidden"
              >
                <div className="shrink-0">
                  <FileTypeIcon type={f.type} size="w-4 h-4 sm:w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs sm:text-sm font-bold truncate text-red-800">
                    {f.name}
                  </p>
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {f.error || "Upload failed"}
                  </p>
                </div>
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-red-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent files card */}
      {sentFiles.length > 0 && (
        <div className="rounded-[20px] sm:rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm mx-1 sm:mx-0">
          {/* Card header */}
          <div
            className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 border-b"
            style={{
              background: `${primaryColor}0D`,
              borderColor: `${primaryColor}40`,
            }}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: primaryColor }} />
            <span
              className="text-xs sm:text-sm font-black uppercase tracking-wider"
              style={{ color: textColor }}
            >
              Sent Files
            </span>
            <span
              className="ml-auto text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-black border"
              style={{
                background: `${primaryColor}1A`,
                color: primaryColor,
                borderColor: `${primaryColor}40`,
              }}
            >
              {sentFiles.length}
            </span>
          </div>

          {/* File rows */}
          <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            {sentFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-200 overflow-hidden"
              >
                <div className="shrink-0">
                  <FileTypeIcon type={f.type} size="w-4 h-4 sm:w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p
                    className="text-xs sm:text-sm font-bold truncate"
                    style={{ color: textColor }}
                  >
                    {f.name}
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">
                    {formatBytes(f.size)}
                  </p>
                </div>
                <CheckCircle
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
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
    </div>
  );
}
