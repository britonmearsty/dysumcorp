/**
 * Upload Manager — R2 + Cloudflare Worker flow
 *
 * Flow:
 *  1. POST /api/portals/r2-presign  → presignedUrl, uploadToken, stagingKey, workerUrl
 *  2. XHR PUT presignedUrl          → file bytes go directly to R2 (progress 0–80%)
 *  3. POST workerUrl/transfer       → Worker picks up from R2, streams to Drive/Dropbox
 *  4. Poll /api/portals/r2-status   → wait for Worker callback (progress 80–100%)
 *
 * Vercel never touches file bytes.
 */

export interface UploadOptions {
  file: File;
  portalId: string;
  password?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  uploaderNotes?: string;
  onProgress?: (progress: number) => void;
  skipNotification?: boolean;
}

export interface BatchUploadOptions extends Omit<UploadOptions, "file"> {
  /** Called with (fileIndex, progress 0-100) for each file individually */
  onFileProgress?: (fileIndex: number, progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  file?: any;
  error?: string;
  method: "r2";
}

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 60; // 120 s total

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a file via R2 presigned PUT + Cloudflare Worker transfer.
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  return uploadViaR2(options);
}

async function uploadViaR2(options: UploadOptions): Promise<UploadResult> {
  const {
    file,
    portalId,
    password,
    uploaderName,
    uploaderEmail,
    uploaderNotes,
    onProgress,
    skipNotification,
  } = options;

  // ── Step 1: Get presigned URL from Vercel ──────────────────────────────────
  let presignedUrl: string;
  let uploadToken: string;
  let stagingKey: string;
  let workerUrl: string;

  try {
    const res = await fetch("/api/portals/r2-presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        uploaderName,
        uploaderEmail,
        uploaderNotes,
        password,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as any).error ?? "Failed to get upload URL", method: "r2" };
    }

    const data = await res.json();
    presignedUrl = data.presignedUrl;
    uploadToken = data.uploadToken;
    stagingKey = data.stagingKey;
    workerUrl = data.workerUrl;
  } catch (err) {
    return { success: false, error: "Network error during presign", method: "r2" };
  }

  // ── Step 2: PUT file directly to R2 (with retries + progress 0–80%) ────────
  let putAttempt = 0;
  let putSuccess = false;

  while (putAttempt < MAX_RETRIES && !putSuccess) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.floor((e.loaded / e.total) * 80));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`R2 PUT failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during R2 PUT")));

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      putSuccess = true;
    } catch (err) {
      putAttempt++;
      if (putAttempt >= MAX_RETRIES) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "R2 upload failed after retries",
          method: "r2",
        };
      }
      await sleep(1000 * Math.pow(2, putAttempt - 1)); // 1s, 2s, 4s
    }
  }

  // ── Step 3: Trigger Worker transfer ────────────────────────────────────────
  const callbackUrl = `${window.location.origin}/api/portals/r2-confirm`;

  try {
    const res = await fetch(`${workerUrl}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadToken,
        stagingKey,
        portalId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        uploaderName,
        uploaderEmail,
        uploaderNotes,
        callbackUrl,
        skipNotification,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as any).error ?? "Worker rejected transfer", method: "r2" };
    }
  } catch (err) {
    return { success: false, error: "Failed to reach transfer worker", method: "r2" };
  }

  if (onProgress) onProgress(80);

  // ── Step 4: Poll r2-status until completed / failed / timeout ──────────────
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const params = new URLSearchParams({ stagingKey, uploadToken });
      const res = await fetch(`/api/portals/r2-status?${params}`);

      if (!res.ok) continue;

      const data = await res.json();

      if (onProgress) {
        // Map poll progress 80 → 99 (whole numbers only)
        onProgress(Math.floor(80 + (attempt / POLL_MAX_ATTEMPTS) * 19));
      }

      if (data.status === "completed") {
        if (onProgress) onProgress(100);
        return { success: true, file: data.file, method: "r2" };
      }

      if (data.status === "failed") {
        return { success: false, error: "Transfer failed in worker", method: "r2" };
      }
    } catch {
      // transient poll error — keep trying
    }
  }

  return { success: false, error: "Transfer timed out after 120s", method: "r2" };
}

/**
 * Upload multiple files and send a single batch notification report.
 */
export async function uploadFiles(
  files: File[],
  options: BatchUploadOptions,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const successfulFiles: Array<{ name: string; size: number }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile({
      ...options,
      file,
      skipNotification: true, // suppress per-file emails; send one batch email below
      onProgress: options.onFileProgress
        ? (progress) => options.onFileProgress!(i, progress)
        : options.onProgress,
    });

    results.push(result);

    if (result.success) {
      successfulFiles.push({ name: file.name, size: file.size });
    }
  }

  if (successfulFiles.length > 0) {
    try {
      await fetch("/api/portals/batch-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: options.portalId,
          files: successfulFiles,
          uploaderName: options.uploaderName,
          uploaderEmail: options.uploaderEmail,
        }),
      });
    } catch (err) {
      console.error("[Upload Manager] Batch notification failed:", err);
    }
  }

  return results;
}
