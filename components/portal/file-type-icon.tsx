import { FileText, File, Image, FileArchive, Film, Music } from "lucide-react";

interface FileTypeIconProps {
  type: string;
  size?: string;
}

export function FileTypeIcon({ type, size = "w-5 h-5" }: FileTypeIconProps) {
  const t = type.toLowerCase();

  if (t.startsWith("image/")) {
    return <Image className={`${size} text-blue-500`} />;
  }
  if (t.startsWith("video/")) {
    return <Film className={`${size} text-violet-500`} />;
  }
  if (t.startsWith("audio/")) {
    return <Music className={`${size} text-pink-500`} />;
  }
  if (t.includes("zip") || t.includes("rar") || t.includes("tar")) {
    return <FileArchive className={`${size} text-amber-500`} />;
  }
  if (t.includes("pdf") || t.includes("text") || t.includes("doc")) {
    return <FileText className={`${size} text-emerald-600`} />;
  }

  return <File className={`${size} text-slate-400`} />;
}
