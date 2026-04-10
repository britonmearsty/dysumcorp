import { Upload } from "lucide-react";
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
  allowedFileTypes,
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
      className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-14 gap-3 cursor-pointer transition-all"
      style={{
        borderColor: dragging ? primaryColor : `${primaryColor}40`,
        background: dragging ? `${primaryColor}0D` : "#f8faff",
      }}
      onClick={handleClick}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{ background: `${primaryColor}1A` }}
      >
        <Upload className="w-7 h-7" style={{ color: primaryColor }} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: textColor }}>
          Click to browse or drag & drop files
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {maxFileSize &&
            `Max ${(maxFileSize / 1024 / 1024).toFixed(0)}MB per file`}
          {maxFileSize &&
            allowedFileTypes &&
            allowedFileTypes.length > 0 &&
            " · "}
          {allowedFileTypes && allowedFileTypes.length > 0 && "Any file type"}
        </p>
      </div>
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
