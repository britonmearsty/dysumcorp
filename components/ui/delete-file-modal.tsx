"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";

import { type StorageDeleteBehavior } from "@/lib/use-storage-delete-behavior";

interface DeleteFileModalProps {
  open: boolean;
  fileName: string;
  behavior: StorageDeleteBehavior;
  onConfirm: (deleteFromStorage: boolean) => void;
  onCancel: () => void;
  /** Label shown for the storage provider, e.g. "Google Drive" or "Dropbox" */
  storageLabel?: string;
}

export function DeleteFileModal({
  open,
  fileName,
  behavior,
  onConfirm,
  onCancel,
  storageLabel = "connected storage",
}: DeleteFileModalProps) {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (behavior === "always") onConfirm(true);
    else if (behavior === "never") onConfirm(false);
    else onConfirm(checked);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-500/20 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Delete File</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-foreground mb-4">
          Are you sure you want to delete{" "}
          <span className="font-semibold">&quot;{fileName}&quot;</span>?
        </p>

        {/* Storage deletion notice */}
        {behavior === "always" && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
            <ExternalLink className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              This file will also be permanently deleted from your {storageLabel}.
            </p>
          </div>
        )}

        {behavior === "never" && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-muted border border-border rounded-xl">
            <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              The file listing will be removed from the app only. The file in your {storageLabel} will not be affected.
            </p>
          </div>
        )}

        {behavior === "ask" && (
          <label className="flex items-start gap-3 p-3 mb-4 bg-muted border border-border rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
            <input
              checked={checked}
              className="mt-0.5 accent-red-500 w-4 h-4 flex-shrink-0"
              type="checkbox"
              onChange={(e) => setChecked(e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Also delete from {storageLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {checked
                  ? `The file will be permanently deleted from your ${storageLabel}.`
                  : "Only the file listing will be removed from the app."}
              </p>
            </div>
          </label>
        )}

        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm"
            onClick={handleConfirm}
          >
            Delete
          </button>
        </div>

        {behavior === "ask" && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You can set a default in{" "}
            <a className="underline hover:text-foreground" href="/dashboard/settings?tab=storage">
              Settings → Storage Deletion
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
