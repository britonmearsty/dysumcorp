import { Upload, FileText, Image, FileArchive, Film, Music, File } from "lucide-react";
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

  // Helper to get icons for allowed types
  const getAllowedIcons = () => {
    if (!allowedFileTypes || allowedFileTypes.length === 0) return null;
    
    const icons: JSX.Element[] = [];
    const seen = new Set<string>();

    allowedFileTypes.forEach(type => {
      const t = type.toLowerCase();
      if (t.includes('image') && !seen.has('image')) {
        icons.push(<Image key="image" className="w-5 h-5 text-blue-500/60" />);
        seen.add('image');
      } else if ((t.includes('video') || t.includes('mp4')) && !seen.has('video')) {
        icons.push(<Film key="video" className="w-5 h-5 text-violet-500/60" />);
        seen.add('video');
      } else if (t.includes('audio') && !seen.has('audio')) {
        icons.push(<Music key="audio" className="w-5 h-5 text-pink-500/60" />);
        seen.add('audio');
      } else if ((t.includes('archive') || t.includes('zip') || t.includes('rar')) && !seen.has('archive')) {
        icons.push(<FileArchive key="archive" className="w-5 h-5 text-amber-500/60" />);
        seen.add('archive');
      } else if ((t.includes('pdf') || t.includes('text') || t.includes('doc')) && !seen.has('doc')) {
        icons.push(<FileText key="doc" className="w-5 h-5 text-emerald-600/60" />);
        seen.add('doc');
      }
    });

    if (icons.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-white/50 border border-slate-100">
        {icons}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Accepted Formats</span>
      </div>
    );
  };

  return (
    <div
      className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-3 cursor-pointer transition-all duration-300 group"
      style={{
        borderColor: dragging ? primaryColor : `${primaryColor}30`,
        background: dragging ? `${primaryColor}0D` : "#f8faff",
      }}
      onClick={handleClick}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${primaryColor}1A` }}
      >
        <Upload className="w-7 h-7" style={{ color: primaryColor }} />
      </div>
      <div className="text-center flex flex-col items-center">
        <p className="font-bold text-lg" style={{ color: textColor }}>
          Drop files here to upload
        </p>
        <p className="text-slate-400 text-sm mt-1 font-medium">
          or click to browse from your device
        </p>
        
        {getAllowedIcons()}

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold opacity-50" style={{ color: textColor }}>
          {maxFileSize && (
            <span>Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file</span>
          )}
        </div>
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
