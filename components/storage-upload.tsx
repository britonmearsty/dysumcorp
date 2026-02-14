"use client";

import { useState } from "react";
import { Select, SelectItem } from "@heroui/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StorageProvider = "google" | "dropbox";

export function StorageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<StorageProvider>("google");
  const [uploading, setUploading] = useState(false);
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

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("provider", provider);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-2xl font-bold">Upload to Cloud Storage</h2>

      <div className="space-y-2">
        <Label htmlFor="provider">Storage Provider</Label>
        <Select
          disabled={uploading}
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

      <Button disabled={!file || uploading} onClick={handleUpload}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="font-semibold text-green-700">Upload successful!</p>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
