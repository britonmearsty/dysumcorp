import { Upload, FileText } from "lucide-react";
import { useRef, useState } from "react";

interface PortalDropZoneProps {
  onFilesSelected: (files: FileList) => void;
  primaryColor: string;
  textColor: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export function PortalDropZone({
  onFilesSelected,
  primaryColor,
  textColor,
  maxFileSize,
}: PortalDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      className="relative rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center py-12 sm:py-16 gap-4 cursor-pointer transition-all duration-200"
      style={{
        borderColor: dragging ? primaryColor : `${primaryColor}20`,
        backgroundColor: dragging ? `${primaryColor}08` : `${primaryColor}03`,
      }}
      onClick={handleClick}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full transition-transform duration-200"
        style={{
          backgroundColor: `${primaryColor}10`,
          color: primaryColor,
        }}
      >
        <Upload className="w-5 h-5" />
      </div>
      <div className="text-center max-w-sm px-4">
        <p
          className="text-base font-semibold"
          style={{ color: textColor }}
        >
          Drop files to upload
        </p>
        <p
          className="mt-1.5 text-sm"
          style={{ color: `${textColor}80` }}
        >
          or click to browse your device
        </p>
      </div>
      {maxFileSize && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            backgroundColor: `${primaryColor}08`,
            color: `${textColor}70`,
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file
        </div>
      )}
      <input
        ref={fileInputRef}
        multiple
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </div>
  );
}
