"use client";

import { useState } from "react";
import { Select, SelectItem, Progress } from "@heroui/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFile } from "@/lib/upload-manager";

type StorageProvider = "google" | "dropbox";

export function StorageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<StorageProvider>("google");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");

      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const res = await uploadFile({
        file,
        portalId: "temp-portal-id", // In a real app, this would be passed as a prop
        onProgress: (p) => setProgress(p),
      });

      if (!res.success) {
        throw new Error(res.error || "Upload failed");
      }

      setResult(res.file);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-4 sm:border rounded-lg border-border">
      <h2 className="text-lg sm:text-2xl font-bold">Resilient Cloud Upload</h2>
      <p className="text-sm text-muted-foreground">
        Large files are split into chunks with automatic retries for maximum
        reliability.
      </p>

      <div className="space-y-2">
        <Label htmlFor="provider">Storage Provider</Label>
        <Select
          isDisabled={uploading}
          label="Storage Provider"
          selectedKeys={[provider]}
          onChange={(e) => setProvider(e.target.value as StorageProvider)}
        >
          <SelectItem key="google">Google Drive</SelectItem>
          <SelectItem key="dropbox">Dropbox</SelectItem>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Select File</Label>
        <Input
          disabled={uploading}
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            aria-label="Upload progress"
            color="primary"
            size="sm"
            value={progress}
          />
        </div>
      )}

      <Button
        className="w-full sm:w-auto"
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? "Uploading..." : "Upload File"}
      </Button>

      {error && (
        <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs sm:text-sm">
          <strong>Upload Error:</strong> {error}
          <p className="mt-1 opacity-80">
            The system will automatically retry failed chunks before giving up.
          </p>
        </div>
      )}

      {result && (
        <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded">
          <p className="font-semibold text-green-600 text-sm">
            ✓ Upload successful!
          </p>
          <pre className="mt-2 text-xs sm:text-sm overflow-auto text-muted-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
