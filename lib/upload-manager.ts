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

  const t0 = performance.now();
  const elapsed = () => `${Math.round(performance.now() - t0)}ms`;
  console.log(`[upload] ═══════════════════════════════════════════════════════`);
  console.log(`[upload] START file="${file.name}" size=${file.size} type="${file.type}"`);
  console.log(`[upload] portalId="${portalId}" uploaderName="${uploaderName}" uploaderEmail="${uploaderEmail}"`);
  console.log(`[upload] password provided: ${!!password}`);

  // ── Step 1: Get presigned URL from Vercel ──────────────────────────────────
  let presignedUrl: string;
  let uploadToken: string;
  let stagingKey: string;
  let workerUrl: string;

  try {
    console.log(`[upload] STEP 1: Requesting presigned URL from /api/portals/r2-presign`);
    const presignBody = {
      portalId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      uploaderName,
      uploaderEmail,
      uploaderNotes,
      password,
    };
    console.log(`[upload] presign request body:`, JSON.stringify(presignBody, null, 2));

    const res = await fetch("/api/portals/r2-presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presignBody),
    });

    console.log(`[upload] presign response status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`[upload] ❌ STEP 1 FAILED: presign rejected`, data);
      return { success: false, error: (data as any).error ?? "Failed to get upload URL", method: "r2" };
    }

    const data = await res.json();
    presignedUrl = data.presignedUrl;
    uploadToken = data.uploadToken;
    stagingKey = data.stagingKey;
    workerUrl = data.workerUrl;
    console.log(`[upload] ✓ STEP 1 SUCCESS (${elapsed()})`);
    console.log(`[upload] stagingKey: ${stagingKey}`);
    console.log(`[upload] workerUrl: ${workerUrl}`);
    console.log(`[upload] presignedUrl length: ${presignedUrl.length} chars`);
    console.log(`[upload] uploadToken length: ${uploadToken.length} chars`);
  } catch (err) {
    console.error(`[upload] ❌ STEP 1 EXCEPTION:`, err);
    return { success: false, error: "Network error during presign", method: "r2" };
  }

  // ── Step 2: PUT file directly to R2 (with retries + progress 0–80%) ────────
  let putAttempt = 0;
  let putSuccess = false;
  const tPut = performance.now();

  console.log(`[upload] ───────────────────────────────────────────────────────`);
  console.log(`[upload] STEP 2: Direct PUT to R2 (max ${MAX_RETRIES} attempts)`);

  while (putAttempt < MAX_RETRIES && !putSuccess) {
    putAttempt++;
    console.log(`[upload] STEP 2 attempt ${putAttempt}/${MAX_RETRIES} starting...`);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastProgress = 0;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.floor((e.loaded / e.total) * 80);
            if (progress !== lastProgress) {
              console.log(`[upload] R2 PUT progress: ${progress}% (${e.loaded}/${e.total} bytes)`);
              lastProgress = progress;
            }
            if (onProgress) {
              onProgress(progress);
            }
          }
        });

        xhr.addEventListener("load", () => {
          console.log(`[upload] R2 PUT XHR load event: status=${xhr.status} statusText="${xhr.statusText}"`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`[upload] R2 PUT response headers:`, xhr.getAllResponseHeaders());
            resolve();
          } else {
            console.error(`[upload] ❌ R2 PUT failed with status ${xhr.status}`);
            console.error(`[upload] Response text:`, xhr.responseText);
            reject(new Error(`R2 PUT failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          console.error(`[upload] ❌ R2 PUT network error (XHR error event)`);
          reject(new Error("Network error during R2 PUT"));
        });

        xhr.addEventListener("abort", () => {
          console.error(`[upload] ❌ R2 PUT aborted`);
          reject(new Error("R2 PUT aborted"));
        });

        console.log(`[upload] Opening XHR PUT to presigned URL (length: ${presignedUrl.length})`);
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        console.log(`[upload] Sending file bytes (${file.size} bytes)...`);
        xhr.send(file);
      });

      putSuccess = true;
      console.log(`[upload] ✓ STEP 2 SUCCESS: R2 PUT completed (${elapsed()}, r2=${Math.round(performance.now() - tPut)}ms)`);
    } catch (err) {
      console.error(`[upload] ❌ STEP 2 attempt ${putAttempt} FAILED:`, err);
      if (putAttempt >= MAX_RETRIES) {
        console.error(`[upload] ❌ STEP 2 EXHAUSTED all ${MAX_RETRIES} retries`);
        return {
          success: false,
          error: err instanceof Error ? err.message : "R2 upload failed after retries",
          method: "r2",
        };
      }
      const backoffMs = 1000 * Math.pow(2, putAttempt - 1);
      console.log(`[upload] Retrying after ${backoffMs}ms backoff...`);
      await sleep(backoffMs);
    }
  }

  // ── Step 3: Trigger Worker transfer ────────────────────────────────────────
  const callbackUrl = `${window.location.origin}/api/portals/r2-confirm`;
  const tWorker = performance.now();

  console.log(`[upload] ───────────────────────────────────────────────────────`);
  console.log(`[upload] STEP 3: Triggering Worker transfer`);
  console.log(`[upload] workerUrl: ${workerUrl}`);
  console.log(`[upload] callbackUrl: ${callbackUrl}`);

  const transferBody = {
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
  };
  console.log(`[upload] transfer request body:`, JSON.stringify(transferBody, null, 2));

  try {
    const res = await fetch(`${workerUrl}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transferBody),
    });

    console.log(`[upload] worker response status: ${res.status} ${res.statusText}`);
    console.log(`[upload] worker response headers:`, Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`[upload] ❌ STEP 3 FAILED: Worker rejected transfer`, data);
      return { success: false, error: (data as any).error ?? "Worker rejected transfer", method: "r2" };
    }

    const responseData = await res.json();
    console.log(`[upload] ✓ STEP 3 SUCCESS: Worker accepted (${elapsed()}, dispatch=${Math.round(performance.now() - tWorker)}ms)`);
    console.log(`[upload] worker response data:`, responseData);
  } catch (err) {
    console.error(`[upload] ❌ STEP 3 EXCEPTION:`, err);
    return { success: false, error: "Failed to reach transfer worker", method: "r2" };
  }

  if (onProgress) {
    console.log(`[upload] Setting progress to 80% (worker accepted)`);
    onProgress(80);
  }

  // ── Step 4: Poll r2-status until completed / failed / timeout ──────────────
  const tPoll = performance.now();
  console.log(`[upload] ───────────────────────────────────────────────────────`);
  console.log(`[upload] STEP 4: Polling /api/portals/r2-status (every ${POLL_INTERVAL_MS}ms, max ${POLL_MAX_ATTEMPTS} attempts = ${POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000}s)`);

  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const pollAttemptNum = attempt + 1;
    console.log(`[upload] Poll attempt ${pollAttemptNum}/${POLL_MAX_ATTEMPTS} (${elapsed()})...`);

    try {
      const params = new URLSearchParams({ stagingKey, uploadToken });
      const statusUrl = `/api/portals/r2-status?${params}`;
      console.log(`[upload] Fetching: ${statusUrl}`);

      const res = await fetch(statusUrl);
      console.log(`[upload] Poll response: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        console.warn(`[upload] ⚠️ Poll attempt ${pollAttemptNum} returned ${res.status}, continuing...`);
        continue;
      }

      const data = await res.json();
      console.log(`[upload] Poll data:`, JSON.stringify(data, null, 2));

      const currentProgress = Math.floor(80 + (attempt / POLL_MAX_ATTEMPTS) * 19);
      if (onProgress) {
        console.log(`[upload] Updating progress to ${currentProgress}%`);
        onProgress(currentProgress);
      }

      if (data.status === "completed") {
        if (onProgress) {
          console.log(`[upload] Setting progress to 100% (completed)`);
          onProgress(100);
        }
        console.log(`[upload] ✓ STEP 4 SUCCESS: Transfer completed`);
        console.log(`[upload] ═══════════════════════════════════════════════════════`);
        console.log(`[upload] ✓✓✓ DONE ✓✓✓ file="${file.name}" total=${elapsed()} poll=${Math.round(performance.now() - tPoll)}ms attempts=${pollAttemptNum}`);
        console.log(`[upload] File record:`, data.file);
        return { success: true, file: data.file, method: "r2" };
      }

      if (data.status === "failed") {
        console.error(`[upload] ❌ STEP 4 FAILED: Worker reported transfer failed`);
        console.error(`[upload] Failed after ${elapsed()}, poll attempts: ${pollAttemptNum}`);
        return { success: false, error: "Transfer failed in worker", method: "r2" };
      }

      console.log(`[upload] Status still "${data.status}", continuing to poll...`);
    } catch (pollErr) {
      console.error(`[upload] ⚠️ Poll attempt ${pollAttemptNum} exception (non-fatal):`, pollErr);
      // transient poll error — keep trying
    }
  }

  console.error(`[upload] ❌ STEP 4 TIMEOUT: No completion after ${POLL_MAX_ATTEMPTS} attempts (${elapsed()})`);
  console.error(`[upload] ═══════════════════════════════════════════════════════`);
  return { success: false, error: "Transfer timed out after 120s", method: "r2" };
}

/**
 * Upload multiple files and send a single batch notification report.
 */
export async function uploadFiles(
  files: File[],
  options: BatchUploadOptions,
): Promise<UploadResult[]> {
  console.log(`[uploadFiles] ═══════════════════════════════════════════════════════`);
  console.log(`[uploadFiles] BATCH START: ${files.length} files`);
  console.log(`[uploadFiles] Files:`, files.map(f => `${f.name} (${f.size} bytes)`));

  const results: UploadResult[] = [];
  const successfulFiles: Array<{ name: string; size: number }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[uploadFiles] ───────────────────────────────────────────────────────`);
    console.log(`[uploadFiles] Processing file ${i + 1}/${files.length}: "${file.name}"`);

    const result = await uploadFile({
      ...options,
      file,
      skipNotification: true, // suppress per-file emails; send one batch email below
      onProgress: options.onFileProgress
        ? (progress) => {
            console.log(`[uploadFiles] File ${i + 1} progress: ${progress}%`);
            options.onFileProgress!(i, progress);
          }
        : options.onProgress,
    });

    results.push(result);

    if (result.success) {
      console.log(`[uploadFiles] ✓ File ${i + 1} SUCCESS`);
      successfulFiles.push({ name: file.name, size: file.size });
    } else {
      console.error(`[uploadFiles] ❌ File ${i + 1} FAILED:`, result.error);
    }
  }

  console.log(`[uploadFiles] ───────────────────────────────────────────────────────`);
  console.log(`[uploadFiles] BATCH COMPLETE: ${successfulFiles.length}/${files.length} succeeded`);

  if (successfulFiles.length > 0) {
    console.log(`[uploadFiles] Sending batch notification for ${successfulFiles.length} files...`);
    try {
      const notifRes = await fetch("/api/portals/batch-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: options.portalId,
          files: successfulFiles,
          uploaderName: options.uploaderName,
          uploaderEmail: options.uploaderEmail,
        }),
      });
      console.log(`[uploadFiles] Batch notification response: ${notifRes.status}`);
    } catch (err) {
      console.error("[uploadFiles] ❌ Batch notification failed:", err);
    }
  }

  console.log(`[uploadFiles] ═══════════════════════════════════════════════════════`);
  return results;
}
