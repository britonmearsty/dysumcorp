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
      <div className="flex flex-col items-center text-center gap-4 sm:gap-5 py-4 sm:py-6">
        <div className="relative">
          <div
            className="absolute inset-0 blur-2xl opacity-20"
            style={{ background: primaryColor }}
          />
          <div
            className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md border"
            style={{ borderColor: `${primaryColor}15` }}
          >
            <CheckCircle
              className="w-8 h-8 sm:w-10 sm:h-10"
              style={{ color: primaryColor }}
            />
          </div>
        </div>
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-tight mb-2 px-4"
            style={{ color: textColor }}
          >
            {successMessage}
          </h1>
          {uploaderName ? (
            <p
              className="text-sm leading-relaxed max-w-md mx-auto px-6"
              style={{ color: `${textColor}80` }}
            >
              Thanks,{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                {uploaderName}
              </span>
              ! Your files are secured.
              {uploaderEmail && (
                <span className="block mt-1.5 opacity-60">
                  Confirmation sent to {uploaderEmail}
                </span>
              )}
            </p>
          ) : (
            <p
              className="text-sm px-6"
              style={{ color: `${textColor}80` }}
            >
              Your files have been received and are in safe hands.
            </p>
          )}
        </div>
      </div>

      {failedFiles.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-red-200 bg-white shadow-sm">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-red-100 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">
              Failed to Upload
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
              {failedFiles.length}
            </span>
          </div>
          <div className="p-3 space-y-1.5">
            {failedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-red-50/50 border border-red-100"
              >
                <FileTypeIcon type={f.type} size="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-red-800">
                    {f.name}
                  </p>
                  <p className="text-[11px] text-red-500 mt-0.5">
                    {f.error || "Upload failed"}
                  </p>
                </div>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {sentFiles.length > 0 && (
        <div className="rounded-xl overflow-hidden border shadow-sm bg-white"
          style={{ borderColor: `${primaryColor}15` }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2 border-b"
            style={{
              backgroundColor: `${primaryColor}06`,
              borderColor: `${primaryColor}15`,
            }}
          >
            <Send
              className="w-4 h-4"
              style={{ color: primaryColor }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: textColor }}
            >
              Sent Files
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${primaryColor}10`,
                color: primaryColor,
              }}
            >
              {sentFiles.length}
            </span>
          </div>
          <div className="p-3 space-y-1.5">
            {sentFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: `${primaryColor}03` }}
              >
                <FileTypeIcon type={f.type} size="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: textColor }}
                  >
                    {f.name}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: `${textColor}60` }}
                  >
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
