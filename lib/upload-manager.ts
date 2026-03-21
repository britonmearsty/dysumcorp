/**
 * Upload Manager — R2 multipart + parallel transfer
 *
 * Flow:
 *  1. POST /api/portals/r2-presign  → single presignedUrl OR multipart {uploadId, partUrls[]}
 *  2a. (small)  XHR PUT presignedUrl          → file goes to R2 in one shot
 *  2b. (large)  XHR PUT each partUrl in parallel (6 at a time) → collect ETags
 *               POST /api/portals/r2-complete → R2 assembles the object
 *  3. POST workerUrl/transfer       → Worker picks up from R2, streams to Drive/Dropbox
 *  4. Poll /api/portals/r2-status   → wait for Worker callback (progress 80–100%)
 *
 * Parallelism:
 *  - PART_CONCURRENCY (6): simultaneous part uploads within one file.
 *    6 × 10 MB = 60 MB in-flight per file — saturates any realistic upstream.
 *    Beyond 6 you fragment bandwidth without gain.
 *  - FILE_CONCURRENCY (3): simultaneous files uploading at once.
 *    3 files × 6 parts = 18 XHRs max. Beyond 3 you just slice the pipe thinner.
 *  Both are tunable constants below.
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
  /** Called immediately when a single file finishes (success or failure), before all files are done */
  onFileComplete?: (fileIndex: number, result: UploadResult) => void;
}

export interface UploadResult {
  success: boolean;
  file?: any;
  error?: string;
  method: "r2";
}

// ── Tunable constants ──────────────────────────────────────────────────────────
/** Max simultaneous part uploads within a single file */
const PART_CONCURRENCY = 6;
/**
 * Max simultaneous files for large files (>= 10 MB, multipart).
 * Each large file runs up to 6 part uploads — 3 × 6 = 18 XHRs max.
 */
const FILE_CONCURRENCY_LARGE = 3;
/**
 * Max simultaneous files for small files (< 10 MB, single-shot).
 * Each small file is one XHR — 8 concurrent is fine.
 */
const FILE_CONCURRENCY_SMALL = 8;
/** Threshold that matches r2-presign MULTIPART_THRESHOLD */
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10 MB

/**
 * Compute per-file concurrency dynamically.
 * Each file slot "costs" based on its size:
 *   - large file (multipart) costs PART_CONCURRENCY slots
 *   - small file costs 1 slot
 * We cap total in-flight XHRs at MAX_TOTAL_XHRS.
 * For a mixed batch this naturally gives small files more parallelism
 * while large files still get their 6 part slots each.
 */
const MAX_TOTAL_XHRS = 18;

function computeFileConcurrency(files: File[]): number {
  const largeCount = files.filter((f) => f.size >= MULTIPART_THRESHOLD).length;
  const smallCount = files.length - largeCount;

  if (largeCount === 0) return FILE_CONCURRENCY_SMALL; // all small → 8
  if (smallCount === 0) return FILE_CONCURRENCY_LARGE; // all large → 3

  // Mixed: budget MAX_TOTAL_XHRS across large + small files.
  // Each large file consumes PART_CONCURRENCY slots, each small file consumes 1.
  // Solve: largeSlots * PART_CONCURRENCY + smallSlots * 1 <= MAX_TOTAL_XHRS
  // Simple heuristic: allow up to FILE_CONCURRENCY_LARGE large files, rest of
  // the XHR budget goes to small files.
  const xhrsUsedByLarge = Math.min(largeCount, FILE_CONCURRENCY_LARGE) * PART_CONCURRENCY;
  const remainingXhrs = Math.max(1, MAX_TOTAL_XHRS - xhrsUsedByLarge);
  const smallConcurrency = Math.min(smallCount, remainingXhrs);
  // Total file concurrency = large slots + small slots
  return Math.min(largeCount, FILE_CONCURRENCY_LARGE) + smallConcurrency;
}

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 90; // 180 s total — large files need more time in worker

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Upload a single XHR part, returns the ETag from the response headers. */
function uploadPart(
  url: string,
  data: Blob,
  onProgress?: (loaded: number, total: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // R2 returns ETag in the response header
        const etag = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag") ?? "";
        resolve(etag);
      } else {
        reject(new Error(`Part upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during part upload")));
    xhr.addEventListener("abort", () => reject(new Error("Part upload aborted")));

    xhr.open("PUT", url);
    // Do NOT set Content-Type on parts — presigned URL already encodes it
    xhr.send(data);
  });
}

/**
 * Run an array of async tasks with a max concurrency limit.
 * Returns results in the same order as the input tasks.
 */
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Main upload entry points ───────────────────────────────────────────────────

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

  const t0 = performance.now();
  const elapsed = () => `${Math.round(performance.now() - t0)}ms`;
  console.log(`[upload] START file="${file.name}" size=${file.size}`);

  // ── Step 1: Get presign response ───────────────────────────────────────────
  let presignData: any;
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

    presignData = await res.json();
    console.log(`[upload] ✓ presign (${elapsed()}) type=${presignData.uploadType} stagingKey=${presignData.stagingKey}`);
  } catch (err) {
    return { success: false, error: "Network error during presign", method: "r2" };
  }

  const { uploadToken, stagingKey, workerUrl } = presignData;

  // ── Step 2: Upload to R2 ───────────────────────────────────────────────────
  if (presignData.uploadType === "multipart") {
    const result = await uploadMultipart(file, presignData, onProgress, elapsed);
    if (!result.ok) return { success: false, error: result.error, method: "r2" };
  } else {
    const result = await uploadSingleShot(file, presignData.presignedUrl, onProgress, elapsed);
    if (!result.ok) return { success: false, error: result.error, method: "r2" };
  }

  // ── Step 3: Trigger Worker transfer ───────────────────────────────────────
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
        callbackUrl: `${window.location.origin}/api/portals/r2-confirm`,
        skipNotification,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as any).error ?? "Worker rejected transfer", method: "r2" };
    }
    console.log(`[upload] ✓ worker accepted (${elapsed()})`);
  } catch (err) {
    return { success: false, error: "Failed to reach transfer worker", method: "r2" };
  }

  if (onProgress) onProgress(80);

  // ── Step 4: Poll for completion ────────────────────────────────────────────
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const params = new URLSearchParams({ stagingKey, uploadToken });
      const res = await fetch(`/api/portals/r2-status?${params}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (onProgress) onProgress(Math.floor(80 + (attempt / POLL_MAX_ATTEMPTS) * 19));

      if (data.status === "completed") {
        if (onProgress) onProgress(100);
        console.log(`[upload] ✓ DONE file="${file.name}" total=${elapsed()}`);
        return { success: true, file: data.file, method: "r2" };
      }
      if (data.status === "failed") {
        return { success: false, error: "Transfer failed in worker", method: "r2" };
      }
    } catch {
      // transient poll error — keep trying
    }
  }

  return { success: false, error: "Transfer timed out", method: "r2" };
}

// ── Single-shot upload (< 10 MB) ──────────────────────────────────────────────

async function uploadSingleShot(
  file: File,
  presignedUrl: string,
  onProgress: ((p: number) => void) | undefined,
  elapsed: () => string,
): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let last = 0;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const p = Math.floor((e.loaded / e.total) * 78);
            if (p !== last) { last = p; if (onProgress) onProgress(p); }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 PUT failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during R2 PUT")));
        xhr.addEventListener("abort", () => reject(new Error("R2 PUT aborted")));

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      console.log(`[upload] ✓ single-shot PUT complete (${elapsed()})`);
      if (onProgress) onProgress(78);
      return { ok: true };
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        return { ok: false, error: err instanceof Error ? err.message : "R2 upload failed" };
      }
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return { ok: false, error: "R2 upload failed" };
}

// ── Multipart upload (>= 10 MB) ───────────────────────────────────────────────

async function uploadMultipart(
  file: File,
  presignData: {
    uploadId: string;
    partUrls: string[];
    partSize: number;
    partCount: number;
    stagingKey: string;
    uploadToken: string;
  },
  onProgress: ((p: number) => void) | undefined,
  elapsed: () => string,
): Promise<{ ok: boolean; error?: string }> {
  const { uploadId, partUrls, partSize, partCount, stagingKey, uploadToken } = presignData;

  console.log(`[upload] multipart: ${partCount} parts × ${partSize / 1024 / 1024} MB, concurrency=${PART_CONCURRENCY}`);

  // Track bytes uploaded across all parts for aggregate progress (0–78%)
  const partLoaded = new Array(partCount).fill(0);
  const totalBytes = file.size;

  function reportProgress() {
    if (!onProgress) return;
    const loaded = partLoaded.reduce((a, b) => a + b, 0);
    onProgress(Math.floor((loaded / totalBytes) * 78));
  }

  // Build one task per part
  const tasks = partUrls.map((url, i) => async () => {
    const start = i * partSize;
    const end = Math.min(start + partSize, file.size);
    const blob = file.slice(start, end);
    const partNumber = i + 1;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const etag = await uploadPart(url, blob, (loaded) => {
          partLoaded[i] = loaded;
          reportProgress();
        });
        console.log(`[upload] ✓ part ${partNumber}/${partCount} etag=${etag} (${elapsed()})`);
        return { partNumber, etag };
      } catch (err) {
        if (attempt >= MAX_RETRIES) throw err;
        console.warn(`[upload] part ${partNumber} attempt ${attempt} failed, retrying...`);
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
    throw new Error(`Part ${partNumber} failed after ${MAX_RETRIES} retries`);
  });

  let parts: { partNumber: number; etag: string }[];
  try {
    parts = await pLimit(tasks, PART_CONCURRENCY);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Multipart upload failed" };
  }

  if (onProgress) onProgress(78);

  // Finalize
  try {
    const res = await fetch("/api/portals/r2-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken, stagingKey, uploadId, parts }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as any).error ?? "Failed to complete multipart upload" };
    }

    console.log(`[upload] ✓ multipart complete (${elapsed()})`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Network error during multipart complete" };
  }
}

// ── Batch upload (parallel files) ─────────────────────────────────────────────

export async function uploadFiles(
  files: File[],
  options: BatchUploadOptions,
): Promise<UploadResult[]> {
  const concurrency = computeFileConcurrency(files);
  console.log(`[uploadFiles] BATCH START: ${files.length} files, concurrency=${concurrency}`);

  const results: UploadResult[] = new Array(files.length);
  const successfulFiles: Array<{ name: string; size: number }> = [];

  // Build per-file tasks
  const tasks = files.map((file, i) => async () => {
    console.log(`[uploadFiles] starting file ${i + 1}/${files.length}: "${file.name}"`);
    const result = await uploadFile({
      ...options,
      file,
      skipNotification: true,
      onProgress: options.onFileProgress
        ? (progress) => options.onFileProgress!(i, progress)
        : options.onProgress,
    });
    results[i] = result;
    if (result.success) {
      successfulFiles.push({ name: file.name, size: file.size });
      console.log(`[uploadFiles] ✓ file ${i + 1} done`);
    } else {
      console.error(`[uploadFiles] ❌ file ${i + 1} failed: ${result.error}`);
    }
    // Fire immediately so the UI can move this file to the completed drawer
    // without waiting for the rest of the batch to finish.
    options.onFileComplete?.(i, result);
    return result;
  });

  await pLimit(tasks, concurrency);

  console.log(`[uploadFiles] BATCH COMPLETE: ${successfulFiles.length}/${files.length} succeeded`);

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
      console.error("[uploadFiles] batch notification failed:", err);
    }
  }

  return results;
}
