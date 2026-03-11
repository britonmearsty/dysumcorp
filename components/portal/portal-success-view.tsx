import { CheckCircle, Upload, Send } from "lucide-react";
import { FileTypeIcon } from "./file-type-icon";
import { PortalButton } from "./portal-button";

interface SentFile {
  name: string;
  size: number;
  type: string;
}

interface PortalSuccessViewProps {
  uploaderName?: string;
  uploaderEmail?: string;
  sentFiles: SentFile[];
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
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full"
          style={{
            background: `${primaryColor}1A`,
            border: `2px solid ${primaryColor}`,
            boxShadow: `0 0 0 6px ${primaryColor}0D`,
          }}
        >
          <CheckCircle className="w-9 h-9" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: textColor }}>
            {successMessage}
          </h1>
          {uploaderName ? (
            <p className="text-slate-500">
              Thank you,{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                {uploaderName}
              </span>
              . We'll be in touch
              {uploaderEmail && (
                <>
                  {" at "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {uploaderEmail}
                  </span>
                </>
              )}
              .
            </p>
          ) : (
            <p className="text-slate-500">Your files have been received and are in safe hands.</p>
          )}
        </div>
      </div>

      {/* Sent files card */}
      {sentFiles.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          {/* Card header */}
          <div
            className="px-6 py-4 flex items-center gap-2 border-b"
            style={{ background: `${primaryColor}0D`, borderColor: `${primaryColor}40` }}
          >
            <Send className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="text-sm font-semibold" style={{ color: textColor }}>
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
                  <p className="text-sm font-medium truncate" style={{ color: textColor }}>
                    {f.name}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">{formatBytes(f.size)}</p>
                </div>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload More button */}
      <PortalButton
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        gradientEnabled={gradientEnabled}
        onClick={onUploadMore}
        icon={<Upload className="w-4 h-4" />}
      >
        Upload More Files
      </PortalButton>

      <p className="text-center text-slate-400 text-xs">
        Your name and email will be pre-filled when you return to the upload form.
      </p>
    </div>
  );
}
