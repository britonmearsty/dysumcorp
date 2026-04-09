/**
 * Upload Manager — R2 multipart + parallel transfer
 *
 * Flow:
 *  1. POST /api/portals/r2-presign  → single presignedUrl OR multipart {uploadId, partUrls[]}
 *  2a. (small)  XHR PUT presignedUrl          → file goes to R2 in one shot
 *  2b. (large)  XHR PUT each partUrl in parallel (2–4 at a time, scales with size) → collect ETags
 *               POST /api/portals/r2-complete → R2 assembles the object
 *  3. POST workerUrl/transfer       → Worker picks up from R2, streams to Drive/Dropbox
 *  4. Poll /api/portals/r2-status   → wait for Worker callback (progress 80–100%)
 *
 * Parallelism:
 *  - Part concurrency scales with file size: 2 parts for ≥200 MB, 3 for ≥50 MB, 4 for smaller.
 *    At 25 MB/part, 2–3 concurrent parts already saturates most upstreams.
 *    More parts fragment bandwidth via TCP contention without throughput gain.
 *  - FILE_CONCURRENCY_LARGE (2): simultaneous large files uploading at once.
 *    2 files × 2–3 parts = 4–6 XHRs max. Keeps the pipe full without
 *    fragmenting bandwidth across too many competing streams.
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
  /** Pre-resolved session ID — shared across all files in a batch */
  uploadSessionId?: string;
  /** Pre-resolved destination folder ID — skips folder creation race in worker */
  parentFolderId?: string;
  /** Pre-resolved folder path — passed alongside parentFolderId */
  folderPath?: string;
  /** Cached presign response — avoids a redundant presign call for the first file */
  cachedPresignData?: any;
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
/** Threshold that matches r2-presign MULTIPART_THRESHOLD */
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50 MB

/**
 * Part concurrency scales with file size.
 * Larger files use bigger parts (50–100 MB), so fewer concurrent parts are needed.
 * For smaller files with 25MB parts, we can push harder.
 */
function computePartConcurrency(fileSizeBytes: number): number {
  if (fileSizeBytes >= 2 * 1024 * 1024 * 1024) return 4; // ≥2GB use 4 concurrent parts
  if (fileSizeBytes >= 500 * 1024 * 1024) return 4;
  if (fileSizeBytes >= 200 * 1024 * 1024) return 5;
  if (fileSizeBytes >= 50 * 1024 * 1024) return 6;

  return 8; // Smaller files - push harder
}

/**
 * Max simultaneous files for large files (>= 10 MB, multipart).
 * Modern browsers can handle 4-6 concurrent large file uploads.
 */
const FILE_CONCURRENCY_LARGE = 4;
/**
 * Max simultaneous files for small files (< 10 MB, single-shot).
 * Each small file is one XHR — 10 concurrent is fine.
 */
const FILE_CONCURRENCY_SMALL = 10;

/**
 * Total in-flight XHR budget. Used for mixed-batch concurrency calculation.
 * With modern networks, we can push to 16.
 */
const MAX_TOTAL_XHRS = 16;

function computeFileConcurrency(files: File[]): number {
  const largeCount = files.filter((f) => f.size >= MULTIPART_THRESHOLD).length;
  const smallCount = files.length - largeCount;

  if (largeCount === 0) return FILE_CONCURRENCY_SMALL; // all small → 6
  if (smallCount === 0) return FILE_CONCURRENCY_LARGE; // all large → 2

  // Mixed: cap total in-flight XHRs at MAX_TOTAL_XHRS.
  // Large files use 2–3 part slots each; small files use 1 slot each.
  const xhrsUsedByLarge = Math.min(largeCount, FILE_CONCURRENCY_LARGE) * 3; // assume 3 parts avg
  const remainingXhrs = Math.max(1, MAX_TOTAL_XHRS - xhrsUsedByLarge);
  const smallConcurrency = Math.min(smallCount, remainingXhrs);

  return Math.min(largeCount, FILE_CONCURRENCY_LARGE) + smallConcurrency;
}

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;

/**
 * Compute how many poll attempts to allow based on file size.
 * The worker transfers from R2 to Drive/Dropbox — budget ~2 Mbps sustained
 * (conservative for Drive API) plus a fixed overhead for worker startup.
 *
 * Formula: overhead (60s) + transfer time at 2 Mbps, minimum 90 attempts (180s).
 * Each attempt = POLL_INTERVAL_MS (2s).
 *
 * Examples:
 *   10 MB  → ~100 attempts (200s)
 *   100 MB → ~250 attempts (500s)
 *   500 MB → ~1060 attempts (~35 min)
 *   1 GB   → ~2090 attempts (~70 min)
 */
function computePollAttempts(fileSizeBytes: number): number {
  const OVERHEAD_S = 60; // worker startup + Drive auth
  const TRANSFER_MBPS = 2; // conservative Drive/Dropbox sustained write
  const transferSeconds = fileSizeBytes / (1024 * 1024) / TRANSFER_MBPS;
  const totalSeconds = OVERHEAD_S + transferSeconds;
  const attempts = Math.ceil(totalSeconds / (POLL_INTERVAL_MS / 1000));

  return Math.max(90, attempts); // floor at 180s for small files
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Wall-clock timestamp prefix for logs: HH:MM:SS.mmm */
function ts(): string {
  const d = new Date();

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

/** Format bytes/s as human-readable speed string */
function fmtSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1024 * 1024)
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;

  return `${bytesPerSec.toFixed(0)} B/s`;
}

/** Upload a single XHR part, returns the ETag from the response headers. */
function uploadPart(
  url: string,
  data: Blob,
  label: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const partStart = performance.now();
    let lastLoaded = 0;
    let lastSampleTime = partStart;

    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      if (onProgress) onProgress(e.loaded, e.total);

      // Log speed sample every ~2s
      const now = performance.now();
      const dt = now - lastSampleTime;

      if (dt >= 2000) {
        const bytesInWindow = e.loaded - lastLoaded;
        const speed = bytesInWindow / (dt / 1000);
        const pct = Math.floor((e.loaded / e.total) * 100);

        console.log(
          `[upload:spd] ${ts()} ${label} ${pct}% — ${fmtSpeed(speed)} (${(e.loaded / 1024 / 1024).toFixed(1)}/${(e.total / 1024 / 1024).toFixed(1)} MB)`,
        );
        lastLoaded = e.loaded;
        lastSampleTime = now;
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const duration = Math.round(performance.now() - partStart);
        const avgSpeed = data.size / (duration / 1000);

        console.log(
          `[upload:spd] ${ts()} ${label} DONE — avg ${fmtSpeed(avgSpeed)} in ${duration}ms`,
        );
        const etag =
          xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag") ?? "";

        resolve(etag);
      } else {
        reject(
          new Error(`Part upload failed: ${xhr.status} ${xhr.statusText}`),
        );
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during part upload")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Part upload aborted")),
    );

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

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    worker,
  );

  await Promise.all(workers);

  return results;
}

// ── Main upload entry points ───────────────────────────────────────────────────

/** Single-file upload — used when calling uploadFile directly (not via batch). */
export async function uploadFile(
  options: UploadOptions,
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve) => {
    uploadViaR2WithDetachedPoll({
      ...options,
      onPollResult: resolve,
    });
  });
}

// ── Single-shot upload (< 10 MB) ──────────────────────────────────────────────

async function uploadSingleShot(
  file: File,
  presignedUrl: string,
  onProgress: ((p: number) => void) | undefined,
  elapsed: () => string,
): Promise<{ ok: boolean; error?: string }> {
  const label = `"${file.name}"`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const attemptStart = performance.now();

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let last = 0;
        let lastLoaded = 0;
        let lastSampleTime = performance.now();

        xhr.upload.addEventListener("progress", (e) => {
          if (!e.lengthComputable) return;
          const p = Math.floor((e.loaded / e.total) * 100);

          if (p !== last) {
            last = p;
            if (onProgress) onProgress(p);
          }

          // Speed sample every ~2s
          const now = performance.now();
          const dt = now - lastSampleTime;

          if (dt >= 2000) {
            const speed = (e.loaded - lastLoaded) / (dt / 1000);
            const pct = Math.floor((e.loaded / e.total) * 100);

            console.log(
              `[upload:spd] ${ts()} ${label} single ${pct}% — ${fmtSpeed(speed)} (${(e.loaded / 1024 / 1024).toFixed(1)}/${(e.total / 1024 / 1024).toFixed(1)} MB)`,
            );
            lastLoaded = e.loaded;
            lastSampleTime = now;
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 PUT failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Network error during R2 PUT")),
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("R2 PUT aborted")),
        );

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        );
        xhr.send(file);
      });

      const duration = Math.round(performance.now() - attemptStart);
      const avgSpeed = file.size / (duration / 1000);

      console.log(
        `[upload] ✓ single-shot PUT complete — avg ${fmtSpeed(avgSpeed)} (${elapsed()})`,
      );
      // Report 100% — UI shows "transferring" state separately during worker phase
      if (onProgress) onProgress(100);

      return { ok: true };
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "R2 upload failed",
        };
      }
      console.warn(
        `[upload] ${ts()} ${label} single-shot attempt ${attempt} failed, retrying...`,
      );
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
  const { uploadId, partUrls, partSize, partCount, stagingKey, uploadToken } =
    presignData;
  const partConcurrency = computePartConcurrency(file.size);

  console.log(
    `[upload] ${ts()} multipart START "${file.name}" ${partCount} parts × ${partSize / 1024 / 1024} MB, concurrency=${partConcurrency}`,
  );

  // Track bytes uploaded to R2 (0-100% of file). When it hits 100%, UI shows
  // "Transferring..." while worker handles the remaining transfer phase.
  const partLoaded = new Array(partCount).fill(0);
  const totalBytes = file.size;

  function reportProgress() {
    if (!onProgress) return;
    const loaded = partLoaded.reduce((a, b) => a + b, 0);

    onProgress(Math.floor((loaded / totalBytes) * 100));
  }

  // Build one task per part
  const tasks = partUrls.map((url, i) => async () => {
    const start = i * partSize;
    const end = Math.min(start + partSize, file.size);
    const blob = file.slice(start, end);
    const partNumber = i + 1;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const label = `"${file.name}" part ${partNumber}/${partCount}`;
        const etag = await uploadPart(url, blob, label, (loaded) => {
          partLoaded[i] = loaded;
          reportProgress();
        });

        console.log(
          `[upload] ${ts()} ✓ part ${partNumber}/${partCount} etag=${etag} (${elapsed()})`,
        );

        return { partNumber, etag };
      } catch (err) {
        if (attempt >= MAX_RETRIES) throw err;
        console.warn(
          `[upload] part ${partNumber} attempt ${attempt} failed, retrying...`,
        );
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
    throw new Error(`Part ${partNumber} failed after ${MAX_RETRIES} retries`);
  });

  let parts: { partNumber: number; etag: string }[];

  try {
    parts = await pLimit(tasks, partConcurrency);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Multipart upload failed",
    };
  }

  // Note: we don't call onProgress here — the R2 multipart upload already reports
  // 0-100% via reportProgress(), and when it hits 100%, UI shows "Transferring..."
  // while worker handles the remaining transfer via polling.

  // Finalize
  try {
    const res = await fetch("/api/portals/r2-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken, stagingKey, uploadId, parts }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      return {
        ok: false,
        error: (data as any).error ?? "Failed to complete multipart upload",
      };
    }

    console.log(
      `[upload] ${ts()} ✓ multipart complete "${file.name}" (${elapsed()})`,
    );

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
  // ── Step 0: Pre-create upload session + pre-resolve destination folder ──────
  // Both must happen BEFORE any file starts uploading so all files share the
  // same session ID and the same folder — preventing the race condition where
  // concurrent worker calls each try to create the same Drive/Dropbox folder.

  let sharedSessionId: string | undefined;
  let sharedParentFolderId: string | undefined;
  let sharedFolderPath: string | undefined;
  // Cache the presign result for the first file so we don't presign it twice
  let firstFilePresignCache: { fileIndex: number; data: any } | undefined;

  // Pre-create the UploadSession (one per batch, not one per file)
  try {
    const sessionRes = await fetch("/api/portals/create-upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId: options.portalId,
        uploaderName: options.uploaderName,
        uploaderEmail: options.uploaderEmail,
        uploaderNotes: options.uploaderNotes,
      }),
    });

    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();

      sharedSessionId = sessionData.uploadSessionId;
      console.log(
        `[uploadFiles] ${ts()} ✓ pre-created session: ${sharedSessionId}`,
      );
    } else {
      console.warn(
        `[uploadFiles] ${ts()} ⚠️ session pre-create failed (${sessionRes.status}), will fall back to per-file sessions`,
      );
    }
  } catch (err) {
    console.warn(
      `[uploadFiles] ${ts()} ⚠️ session pre-create error (non-fatal):`,
      err,
    );
  }

  // Pre-resolve the destination folder. We presign the first file (in sort order) to get a
  // valid upload token, then call r2-worker-context once. The presign result is cached so
  // that file doesn't get presigned again in the task loop.
  //
  // Note: sort happens below, so we use files[0] here (unsorted). The cache is keyed on
  // the original index of whichever file ends up first after sorting.
  if (files.length > 0) {
    // Sort to find which file will be processed first (smallest first)
    const sortedForPreresolve = files
      .map((file, originalIndex) => ({ file, originalIndex }))
      .sort((a, b) => a.file.size - b.file.size);
    const firstSorted = sortedForPreresolve[0];

    try {
      const presignRes = await fetch("/api/portals/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: options.portalId,
          fileName: firstSorted.file.name,
          fileSize: firstSorted.file.size,
          mimeType: firstSorted.file.type || "application/octet-stream",
          uploaderName: options.uploaderName,
          uploaderEmail: options.uploaderEmail,
          uploaderNotes: options.uploaderNotes,
          password: options.password,
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();

        // Cache keyed on the original index of the first-sorted file
        firstFilePresignCache = {
          fileIndex: firstSorted.originalIndex,
          data: presignData,
        };

        // Use the token to pre-resolve the folder once for all files
        const ctxRes = await fetch("/api/portals/r2-worker-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadToken: presignData.uploadToken,
            uploaderName: options.uploaderName,
          }),
        });

        if (ctxRes.ok) {
          const ctx = await ctxRes.json();

          sharedParentFolderId = ctx.parentFolderId;
          sharedFolderPath = ctx.folderPath;
          console.log(
            `[uploadFiles] ${ts()} ✓ pre-resolved folder: ${sharedParentFolderId} (${sharedFolderPath})`,
          );
        } else {
          console.warn(
            `[uploadFiles] ${ts()} ⚠️ folder pre-resolve failed (${ctxRes.status}), worker will resolve per-file`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `[uploadFiles] ${ts()} ⚠️ folder pre-resolve error (non-fatal):`,
        err,
      );
    }
  }

  // ── Sort + concurrency setup ───────────────────────────────────────────────
  const sortedEntries = files
    .map((file, originalIndex) => ({ file, originalIndex }))
    .sort((a, b) => a.file.size - b.file.size);

  const sortedFiles = sortedEntries.map((e) => e.file);
  const concurrency = computeFileConcurrency(sortedFiles);

  console.log(
    `[uploadFiles] ${ts()} BATCH START: ${files.length} files, concurrency=${concurrency} (sorted small→large)`,
  );

  const results: UploadResult[] = new Array(files.length);
  const successfulFiles: Array<{ name: string; size: number }> = [];

  // Collect poll promises so we can await them all at the end without
  // holding a concurrency slot during the worker-transfer phase.
  const pollPromises: Promise<void>[] = [];

  const tasks = sortedEntries.map(({ file, originalIndex }) => async () => {
    const i = originalIndex;

    console.log(
      `[uploadFiles] ${ts()} starting "${file.name}" ${(file.size / 1024 / 1024).toFixed(2)} MB (original index ${i})`,
    );

    const onPollResult = (result: UploadResult) => {
      results[i] = result;
      if (result.success) {
        successfulFiles.push({ name: file.name, size: file.size });
        console.log(`[uploadFiles] ${ts()} ✓ done: "${file.name}"`);
      } else {
        console.error(
          `[uploadFiles] ${ts()} ❌ failed: "${file.name}" — ${result.error}`,
        );
      }
      options.onFileComplete?.(i, result);
    };

    // Pass cached presign data for the first file (originalIndex 0) to avoid re-presigning
    const cachedPresignData =
      firstFilePresignCache && firstFilePresignCache.fileIndex === i
        ? firstFilePresignCache.data
        : undefined;

    const r2Result = await uploadViaR2Internal({
      ...options,
      file,
      skipNotification: true,
      uploadSessionId: sharedSessionId,
      parentFolderId: sharedParentFolderId,
      folderPath: sharedFolderPath,
      cachedPresignData,
      onProgress: options.onFileProgress
        ? (progress) => options.onFileProgress!(i, progress)
        : options.onProgress,
    });

    if (!r2Result.pollContext) {
      onPollResult({ success: false, error: r2Result.error, method: "r2" });

      return;
    }

    const pollPromise = runPoll(r2Result.pollContext, onPollResult);

    pollPromises.push(pollPromise);
  });

  await pLimit(tasks, concurrency);
  await Promise.all(pollPromises);

  console.log(
    `[uploadFiles] ${ts()} BATCH COMPLETE: ${successfulFiles.length}/${files.length} succeeded`,
  );

  return results;
}

/**
 * Polls r2-status until the worker transfer completes or times out.
 * Resolves when done (success or failure) — never rejects.
 */
async function runPoll(
  pollContext: {
    stagingKey: string;
    uploadToken: string;
    file: File;
    onProgress: ((p: number) => void) | undefined;
    t0: number;
  },
  onPollResult: (result: UploadResult) => void,
): Promise<void> {
  const { stagingKey, uploadToken, file, onProgress, t0 } = pollContext;
  const pollMaxAttempts = computePollAttempts(file.size);
  const elapsed = () => `${Math.round(performance.now() - t0)}ms`;

  console.log(
    `[upload] ${ts()} polling "${file.name}" up to ${pollMaxAttempts} attempts (~${Math.round((pollMaxAttempts * POLL_INTERVAL_MS) / 1000)}s) for ${(file.size / 1024 / 1024).toFixed(1)} MB`,
  );

  for (let attempt = 0; attempt < pollMaxAttempts; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const params = new URLSearchParams({ stagingKey, uploadToken });
      const res = await fetch(`/api/portals/r2-status?${params}`);

      if (!res.ok) continue;

      const data = await res.json();

      if (data.status === "completed") {
        console.log(
          `[upload] ${ts()} ✓ DONE "${file.name}" total=${elapsed()}`,
        );
        onPollResult({ success: true, file: data.file, method: "r2" });

        return;
      }
      if (data.status === "failed") {
        onPollResult({
          success: false,
          error: "Transfer failed in worker",
          method: "r2",
        });

        return;
      }
      // Don't report progress during polling — UI shows "transferring" state separately
      // when progress reached 100% and worker is still processing
    } catch {
      // transient poll error — keep trying
    }
  }

  const finalParams = new URLSearchParams({ stagingKey, uploadToken });
  const finalRes = await fetch(`/api/portals/r2-status?${finalParams}`).catch(
    () => null,
  );

  if (finalRes?.ok) {
    const finalData = await finalRes.json().catch(() => ({}));
    if (finalData.status === "completed") {
      if (onProgress) onProgress(100);
      onPollResult({ success: true, file: finalData.file, method: "r2" });
      return;
    }
    if (finalData.status === "failed") {
      onPollResult({
        success: false,
        error: "Transfer failed in worker",
        method: "r2",
      });
      return;
    }
  }

  if (onProgress) onProgress(100);
  onPollResult({
    success: true,
    file: { name: file.name, size: file.size, type: file.type },
    method: "r2",
  });
}

/**
 * Like uploadViaR2 but returns a Promise<void> that resolves when the poll
 * completes. Used by the single-file uploadFile() path.
 */
async function uploadViaR2WithDetachedPoll(
  options: UploadOptions & { onPollResult: (result: UploadResult) => void },
): Promise<void> {
  const { onPollResult, ...uploadOptions } = options;

  const result = await uploadViaR2Internal(uploadOptions);

  if (!result.pollContext) {
    onPollResult({ success: false, error: result.error, method: "r2" });

    return;
  }

  await runPoll(result.pollContext, onPollResult);
}

/** Internal: runs presign + R2 upload + worker trigger. Returns poll context on success. */
async function uploadViaR2Internal(options: UploadOptions): Promise<
  | {
      pollContext: {
        stagingKey: string;
        uploadToken: string;
        file: File;
        onProgress: ((p: number) => void) | undefined;
        t0: number;
      };
    }
  | { pollContext: null; error: string }
> {
  const {
    file,
    portalId,
    password,
    uploaderName,
    uploaderEmail,
    uploaderNotes,
    onProgress,
    skipNotification,
    uploadSessionId,
    parentFolderId,
    folderPath,
    cachedPresignData,
  } = options;

  const t0 = performance.now();
  const elapsed = () => `${Math.round(performance.now() - t0)}ms`;

  console.log(
    `[upload] ${ts()} START "${file.name}" ${(file.size / 1024 / 1024).toFixed(2)} MB type=${file.size >= MULTIPART_THRESHOLD ? "multipart" : "single-shot"}`,
  );

  // Step 1: Presign (use cached result if available — avoids double-presigning the first file)
  let presignData: any;

  if (cachedPresignData) {
    presignData = cachedPresignData;
    console.log(
      `[upload] ${ts()} ✓ presign (cached) type=${presignData.uploadType} stagingKey=${presignData.stagingKey}`,
    );
  } else {
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

        return {
          pollContext: null,
          error: (data as any).error ?? "Failed to get upload URL",
        };
      }

      presignData = await res.json();
      console.log(
        `[upload] ${ts()} ✓ presign (${elapsed()}) type=${presignData.uploadType} stagingKey=${presignData.stagingKey}`,
      );
    } catch {
      return { pollContext: null, error: "Network error during presign" };
    }
  }

  const { uploadToken, stagingKey, workerUrl } = presignData;

  // Step 2: Upload to R2
  if (presignData.uploadType === "multipart") {
    const result = await uploadMultipart(
      file,
      presignData,
      onProgress,
      elapsed,
    );

    if (!result.ok)
      return {
        pollContext: null,
        error: result.error ?? "Multipart upload failed",
      };
  } else {
    const result = await uploadSingleShot(
      file,
      presignData.presignedUrl,
      onProgress,
      elapsed,
    );

    if (!result.ok)
      return {
        pollContext: null,
        error: result.error ?? "Single-shot upload failed",
      };

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const completeRes = await fetch(
      `${origin}/api/portals/r2-single-complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadToken, stagingKey }),
      },
    );

    if (!completeRes.ok) {
      console.warn(
        `[upload] ${ts()} ⚠️ r2-single-complete failed (non-fatal), worker will proceed`,
      );
    }
  }

  // Step 3: Trigger worker
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
        uploadSessionId,
        parentFolderId,
        folderPath,
        callbackUrl: `${window.location.origin}/api/portals/r2-confirm`,
        skipNotification,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      return {
        pollContext: null,
        error: (data as any).error ?? "Worker rejected transfer",
      };
    }
    console.log(`[upload] ${ts()} ✓ worker accepted (${elapsed()})`);
  } catch {
    return { pollContext: null, error: "Failed to reach transfer worker" };
  }

  return { pollContext: { stagingKey, uploadToken, file, onProgress, t0 } };
}
