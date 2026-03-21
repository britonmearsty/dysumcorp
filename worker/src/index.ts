/**
 * Dysumcorp Transfer Worker
 *
 * Handles POST /transfer:
 *  1. Validates the upload token (HMAC-SHA256, same logic as Vercel)
 *  2. Returns 202 immediately
 *  3. In ctx.waitUntil: fetches storage credentials from Vercel,
 *     streams R2 object → Google Drive or Dropbox, deletes from R2,
 *     POSTs result back to Vercel /api/portals/r2-confirm
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  WORKER_SECRET: string;
  BETTER_AUTH_SECRET: string;
  VERCEL_APP_URL: string;
}

// ── Token validation ──────────────────────────────────────────────────────────

interface UploadToken {
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes?: string;
  stagingKey?: string;
  expiresAt: number;
  signature: string;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function validateUploadToken(
  encoded: string,
  secret: string,
): Promise<UploadToken | null> {
  const validationId = Math.random().toString(36).slice(2, 8);
  console.log(`[token:${validationId}] ═══════════════════════════════════════════════════════`);
  console.log(`[token:${validationId}] Validating upload token...`);
  console.log(`[token:${validationId}] Token length: ${encoded.length}`);
  console.log(`[token:${validationId}] Secret present: ${!!secret} (length: ${secret?.length})`);

  try {
    console.log(`[token:${validationId}] Decoding base64...`);
    const json = atob(encoded);
    console.log(`[token:${validationId}] ✓ Base64 decoded, JSON length: ${json.length}`);

    const token: UploadToken = JSON.parse(json);
    console.log(`[token:${validationId}] ✓ JSON parsed`);
    console.log(`[token:${validationId}] Token data:`, {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      stagingKey: token.stagingKey,
      expiresAt: new Date(token.expiresAt).toISOString(),
    });

    const now = Date.now();
    console.log(`[token:${validationId}] Checking expiry: now=${now}, expiresAt=${token.expiresAt}`);
    if (now > token.expiresAt) {
      console.error(`[token:${validationId}] ❌ Token expired`);
      console.error(`[token:${validationId}] Expired at: ${new Date(token.expiresAt).toISOString()}`);
      console.error(`[token:${validationId}] Current time: ${new Date(now).toISOString()}`);
      console.error(`[token:${validationId}] Expired by: ${Math.round((now - token.expiresAt) / 1000)}s`);
      return null;
    }
    console.log(`[token:${validationId}] ✓ Token not expired (${Math.round((token.expiresAt - now) / 1000)}s remaining)`);

    const dataToSign = {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      mimeType: token.mimeType,
      uploaderEmail: token.uploaderEmail,
      uploaderName: token.uploaderName,
      uploaderNotes: token.uploaderNotes,
      stagingKey: token.stagingKey,
      expiresAt: token.expiresAt,
    };

    console.log(`[token:${validationId}] Computing HMAC signature...`);
    // Use sorted keys for consistent serialization across Node.js and Workers
    const sortedKeys = Object.keys(dataToSign).sort();
    const canonicalJson = JSON.stringify(dataToSign, sortedKeys);
    console.log(`[token:${validationId}] Canonical JSON (first 200 chars): ${canonicalJson.slice(0, 200)}`);

    const expected = await hmacSign(secret, canonicalJson);
    console.log(`[token:${validationId}] Expected signature: ${expected.slice(0, 16)}...`);
    console.log(`[token:${validationId}] Token signature:   ${token.signature.slice(0, 16)}...`);

    if (token.signature !== expected) {
      console.error(`[token:${validationId}] ❌ Signature mismatch`);
      console.error(`[token:${validationId}] Full expected: ${expected}`);
      console.error(`[token:${validationId}] Full received: ${token.signature}`);
      console.error(`[token:${validationId}] Canonical JSON used for signing:`);
      console.error(`[token:${validationId}] ${canonicalJson}`);
      return null;
    }

    console.log(`[token:${validationId}] ✓✓✓ Token validation SUCCESS`);
    console.log(`[token:${validationId}] ═══════════════════════════════════════════════════════`);
    return token;
  } catch (e) {
    console.error(`[token:${validationId}] ❌❌ Token validation exception:`, e);
    console.error(`[token:${validationId}] Error name:`, e instanceof Error ? e.name : "Unknown");
    console.error(`[token:${validationId}] Error message:`, e instanceof Error ? e.message : String(e));
    console.error(`[token:${validationId}] ═══════════════════════════════════════════════════════`);
    return null;
  }
}

// ── Google Drive resumable chunked upload ─────────────────────────────────────

const DRIVE_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB — Google's minimum resumable chunk size

async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
  body: ReadableStream<Uint8Array>,
  fileSize: number,
): Promise<{ id: string; webViewLink?: string }> {
  const uploadId = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;

  console.log(`[drive:${uploadId}] ═══════════════════════════════════════════════════════`);
  console.log(`[drive:${uploadId}] GOOGLE DRIVE UPLOAD START`);
  console.log(`[drive:${uploadId}] fileName: "${fileName}"`);
  console.log(`[drive:${uploadId}] mimeType: ${mimeType}`);
  console.log(`[drive:${uploadId}] fileSize: ${fileSize} bytes`);
  console.log(`[drive:${uploadId}] parentFolderId: ${parentFolderId}`);
  console.log(`[drive:${uploadId}] accessToken length: ${accessToken.length}`);

  console.log(`[drive:${uploadId}] Initiating resumable upload...`);
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileSize),
      },
      body: JSON.stringify({ name: fileName, parents: [parentFolderId] }),
    },
  );

  console.log(`[drive:${uploadId}] Init response: ${initRes.status} ${initRes.statusText} (${elapsed()})`);
  console.log(`[drive:${uploadId}] Init response headers:`, Object.fromEntries(initRes.headers.entries()));

  if (!initRes.ok) {
    const text = await initRes.text();
    console.error(`[drive:${uploadId}] ❌ Init failed, response body:`, text);
    throw new Error(`Drive resumable init failed: ${initRes.status} ${text}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    console.error(`[drive:${uploadId}] ❌ No Location header in init response`);
    throw new Error("Drive did not return a resumable upload URL");
  }
  console.log(`[drive:${uploadId}] ✓ Got resumable URL (${elapsed()})`);
  console.log(`[drive:${uploadId}] Upload URL: ${uploadUrl}`);
  console.log(`[drive:${uploadId}] Starting chunked stream (chunk size: ${DRIVE_CHUNK_SIZE} bytes)...`);

  // Stream R2 body into chunks and upload each one
  const reader = body.getReader();
  let offset = 0;
  let buffer = new Uint8Array(0);
  let done = false;
  let chunkCount = 0;

  while (!done || buffer.length > 0) {
    // Fill buffer up to DRIVE_CHUNK_SIZE
    while (buffer.length < DRIVE_CHUNK_SIZE && !done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        console.log(`[drive:${uploadId}] Read ${value.length} bytes from stream (buffer now: ${buffer.length + value.length})`);
        const merged = new Uint8Array(buffer.length + value.length);
        merged.set(buffer);
        merged.set(value, buffer.length);
        buffer = merged;
      }
    }

    if (buffer.length === 0) {
      console.log(`[drive:${uploadId}] Buffer empty and stream done, exiting loop`);
      break;
    }

    const isLast = done || offset + buffer.length >= fileSize;
    const chunk = isLast ? buffer : buffer.slice(0, DRIVE_CHUNK_SIZE);
    buffer = isLast ? new Uint8Array(0) : buffer.slice(DRIVE_CHUNK_SIZE);
    chunkCount++;

    const rangeEnd = offset + chunk.length - 1;
    const tc = Date.now();
    console.log(`[drive:${uploadId}] ───────────────────────────────────────────────────────`);
    console.log(`[drive:${uploadId}] CHUNK ${chunkCount}: bytes ${offset}-${rangeEnd}/${isLast ? fileSize : "*"} (${chunk.length} bytes)`);
    console.log(`[drive:${uploadId}] isLast: ${isLast}, buffer remaining: ${buffer.length} bytes`);

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${offset}-${rangeEnd}/${isLast ? fileSize : "*"}`,
      },
      body: chunk,
    });

    console.log(`[drive:${uploadId}] Chunk ${chunkCount} response: ${uploadRes.status} ${uploadRes.statusText} (${Date.now() - tc}ms)`);
    console.log(`[drive:${uploadId}] Chunk ${chunkCount} headers:`, Object.fromEntries(uploadRes.headers.entries()));

    if (isLast) {
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.error(`[drive:${uploadId}] ❌ Final chunk failed, response:`, text);
        throw new Error(`Drive final chunk failed: ${uploadRes.status} ${text}`);
      }
      const result = await uploadRes.json() as { id: string; webViewLink?: string };
      console.log(`[drive:${uploadId}] ✓✓✓ UPLOAD COMPLETE`);
      console.log(`[drive:${uploadId}] fileId: ${result.id}`);
      console.log(`[drive:${uploadId}] webViewLink: ${result.webViewLink}`);
      console.log(`[drive:${uploadId}] Total time: ${elapsed()}, chunks: ${chunkCount}`);
      console.log(`[drive:${uploadId}] ═══════════════════════════════════════════════════════`);
      return result;
    } else {
      // 308 Resume Incomplete is expected for non-final chunks
      if (uploadRes.status !== 308 && !uploadRes.ok) {
        const text = await uploadRes.text();
        console.error(`[drive:${uploadId}] ❌ Chunk ${chunkCount} failed, response:`, text);
        throw new Error(`Drive chunk ${chunkCount} failed: ${uploadRes.status} ${text}`);
      }
      console.log(`[drive:${uploadId}] ✓ Chunk ${chunkCount} accepted, continuing...`);
      offset += chunk.length;
    }
  }

  console.error(`[drive:${uploadId}] ❌ Upload loop exited without finishing`);
  throw new Error("Drive upload loop exited without finishing");
}

// ── Dropbox chunked upload ────────────────────────────────────────────────────

const DROPBOX_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB

async function uploadToDropbox(
  accessToken: string,
  folderPath: string,
  fileName: string,
  body: ReadableStream<Uint8Array>,
  fileSize: number,
): Promise<{ id: string; name: string }> {
  const uploadId = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;

  const path = `${folderPath.startsWith("/") ? "" : "/"}${folderPath}/${fileName}`;
  console.log(`[dropbox:${uploadId}] ═══════════════════════════════════════════════════════`);
  console.log(`[dropbox:${uploadId}] DROPBOX UPLOAD START`);
  console.log(`[dropbox:${uploadId}] fileName: "${fileName}"`);
  console.log(`[dropbox:${uploadId}] fileSize: ${fileSize} bytes`);
  console.log(`[dropbox:${uploadId}] folderPath: ${folderPath}`);
  console.log(`[dropbox:${uploadId}] Full path: ${path}`);
  console.log(`[dropbox:${uploadId}] accessToken length: ${accessToken.length}`);

  console.log(`[dropbox:${uploadId}] Starting upload session...`);
  const startRes = await fetch(
    "https://content.dropboxapi.com/2/files/upload_session/start",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(0),
    },
  );

  console.log(`[dropbox:${uploadId}] Session start response: ${startRes.status} ${startRes.statusText} (${elapsed()})`);
  console.log(`[dropbox:${uploadId}] Session start headers:`, Object.fromEntries(startRes.headers.entries()));

  if (!startRes.ok) {
    const text = await startRes.text();
    console.error(`[dropbox:${uploadId}] ❌ Session start failed, response:`, text);
    throw new Error(`Dropbox session start failed: ${startRes.status} ${text}`);
  }

  const { session_id } = await startRes.json() as { session_id: string };
  console.log(`[dropbox:${uploadId}] ✓ Session started: ${session_id}`);
  console.log(`[dropbox:${uploadId}] Starting chunked upload (chunk size: ${DROPBOX_CHUNK_SIZE} bytes)...`);

  const reader = body.getReader();
  let offset = 0;
  let buffer = new Uint8Array(0);
  let done = false;
  let chunkCount = 0;

  while (!done) {
    while (buffer.length < DROPBOX_CHUNK_SIZE && !done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        console.log(`[dropbox:${uploadId}] Read ${value.length} bytes from stream (buffer now: ${buffer.length + value.length})`);
        const merged = new Uint8Array(buffer.length + value.length);
        merged.set(buffer);
        merged.set(value, buffer.length);
        buffer = merged;
      }
    }

    const isLast = done || offset + buffer.length >= fileSize;
    const chunk = buffer.slice(0, isLast ? buffer.length : DROPBOX_CHUNK_SIZE);
    buffer = buffer.slice(chunk.length);
    chunkCount++;

    console.log(`[dropbox:${uploadId}] ───────────────────────────────────────────────────────`);
    console.log(`[dropbox:${uploadId}] CHUNK ${chunkCount}: offset=${offset}, size=${chunk.length}, isLast=${isLast}`);
    console.log(`[dropbox:${uploadId}] Buffer remaining: ${buffer.length} bytes`);

    if (isLast) {
      console.log(`[dropbox:${uploadId}] Finishing upload session...`);
      const finishRes = await fetch(
        "https://content.dropboxapi.com/2/files/upload_session/finish",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              cursor: { session_id, offset },
              commit: { path, mode: "add", autorename: true },
            }),
            "Content-Type": "application/octet-stream",
          },
          body: chunk,
        },
      );

      console.log(`[dropbox:${uploadId}] Finish response: ${finishRes.status} ${finishRes.statusText} (${elapsed()})`);
      console.log(`[dropbox:${uploadId}] Finish headers:`, Object.fromEntries(finishRes.headers.entries()));

      if (!finishRes.ok) {
        const text = await finishRes.text();
        console.error(`[dropbox:${uploadId}] ❌ Finish failed, response:`, text);
        throw new Error(`Dropbox finish failed: ${finishRes.status} ${text}`);
      }

      const result = await finishRes.json() as { id: string; name: string };
      console.log(`[dropbox:${uploadId}] ✓✓✓ UPLOAD COMPLETE`);
      console.log(`[dropbox:${uploadId}] fileId: ${result.id}`);
      console.log(`[dropbox:${uploadId}] fileName: ${result.name}`);
      console.log(`[dropbox:${uploadId}] Total time: ${elapsed()}, chunks: ${chunkCount}`);
      console.log(`[dropbox:${uploadId}] ═══════════════════════════════════════════════════════`);
      return result;
    } else {
      console.log(`[dropbox:${uploadId}] Appending chunk ${chunkCount}...`);
      const appendRes = await fetch(
        "https://content.dropboxapi.com/2/files/upload_session/append_v2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              cursor: { session_id, offset },
              close: false,
            }),
            "Content-Type": "application/octet-stream",
          },
          body: chunk,
        },
      );

      console.log(`[dropbox:${uploadId}] Append response: ${appendRes.status} ${appendRes.statusText}`);

      if (!appendRes.ok) {
        const text = await appendRes.text();
        console.error(`[dropbox:${uploadId}] ❌ Append failed, response:`, text);
        throw new Error(`Dropbox append failed: ${appendRes.status} ${text}`);
      }

      console.log(`[dropbox:${uploadId}] ✓ Chunk ${chunkCount} appended`);
      offset += chunk.length;
    }
  }

  console.error(`[dropbox:${uploadId}] ❌ Upload loop exited without finishing`);
  throw new Error("Dropbox upload loop exited without finishing");
}

// ── Main transfer logic ───────────────────────────────────────────────────────

async function runTransfer(
  env: Env,
  body: {
    uploadToken: string;
    stagingKey: string;
    portalId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploaderName?: string;
    uploaderEmail?: string;
    uploaderNotes?: string;
    uploadSessionId?: string;
    skipNotification?: boolean;
    callbackUrl: string;
  },
): Promise<void> {
  const {
    uploadToken,
    stagingKey,
    portalId,
    fileName,
    fileSize,
    mimeType,
    uploaderName,
    uploaderEmail,
    uploaderNotes,
    uploadSessionId,
    skipNotification,
    callbackUrl,
  } = body;

  const transferId = Math.random().toString(36).slice(2, 8);
  const baseUrl = env.VERCEL_APP_URL;
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;

  console.log(`[transfer:${transferId}] ═══════════════════════════════════════════════════════`);
  console.log(`[transfer:${transferId}] BACKGROUND TRANSFER START`);
  console.log(`[transfer:${transferId}] stagingKey: ${stagingKey}`);
  console.log(`[transfer:${transferId}] fileName: "${fileName}"`);
  console.log(`[transfer:${transferId}] fileSize: ${fileSize} bytes`);
  console.log(`[transfer:${transferId}] mimeType: ${mimeType}`);
  console.log(`[transfer:${transferId}] portalId: ${portalId}`);
  console.log(`[transfer:${transferId}] uploaderName: "${uploaderName}"`);
  console.log(`[transfer:${transferId}] uploaderEmail: "${uploaderEmail}"`);
  console.log(`[transfer:${transferId}] callbackUrl: ${callbackUrl}`);
  console.log(`[transfer:${transferId}] baseUrl: ${baseUrl}`);
  console.log(`[transfer:${transferId}] uploadSessionId: ${uploadSessionId}`);
  console.log(`[transfer:${transferId}] skipNotification: ${skipNotification}`);

  async function postCallback(payload: Record<string, unknown>) {
    console.log(`[transfer:${transferId}] ───────────────────────────────────────────────────────`);
    console.log(`[transfer:${transferId}] POSTING CALLBACK to ${callbackUrl}`);
    console.log(`[transfer:${transferId}] Callback payload:`, JSON.stringify(payload, null, 2));
    console.log(`[transfer:${transferId}] WORKER_SECRET present: ${!!env.WORKER_SECRET} (length: ${env.WORKER_SECRET?.length})`);

    try {
      const res = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerSecret: env.WORKER_SECRET, ...payload }),
      });
      console.log(`[transfer:${transferId}] Callback response: ${res.status} ${res.statusText}`);
      console.log(`[transfer:${transferId}] Callback response headers:`, Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const text = await res.text();
        console.error(`[transfer:${transferId}] ❌ Callback error body:`, text);
      } else {
        const responseData = await res.json().catch(() => null);
        console.log(`[transfer:${transferId}] ✓ Callback success, response:`, responseData);
      }
    } catch (callbackErr) {
      console.error(`[transfer:${transferId}] ❌❌ Callback fetch exception:`, callbackErr);
    }
  }

  try {
    // 1. Validate token
    console.log(`[transfer:${transferId}] ───────────────────────────────────────────────────────`);
    console.log(`[transfer:${transferId}] STEP 1: Validating upload token (${elapsed()})...`);
    console.log(`[transfer:${transferId}] BETTER_AUTH_SECRET present: ${!!env.BETTER_AUTH_SECRET} (length: ${env.BETTER_AUTH_SECRET?.length})`);

    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      console.error(`[transfer:${transferId}] ❌ STEP 1 FAILED: Token invalid`);
      await postCallback({ stagingKey, status: "failed", error: "Invalid upload token" });
      return;
    }
    console.log(`[transfer:${transferId}] ✓ STEP 1 SUCCESS: Token valid, portalId: ${token.portalId}`);
    console.log(`[transfer:${transferId}] Token data:`, {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      stagingKey: token.stagingKey,
      expiresAt: new Date(token.expiresAt).toISOString(),
    });

    if (token.stagingKey !== stagingKey) {
      console.error(`[transfer:${transferId}] ❌ stagingKey mismatch`);
      console.error(`[transfer:${transferId}] Token stagingKey: ${token.stagingKey}`);
      console.error(`[transfer:${transferId}] Request stagingKey: ${stagingKey}`);
      await postCallback({ stagingKey, status: "failed", error: "stagingKey mismatch" });
      return;
    }
    console.log(`[transfer:${transferId}] ✓ stagingKey matches token`);

    // 2. Get storage credentials from Vercel
    console.log(`[transfer:${transferId}] ───────────────────────────────────────────────────────`);
    console.log(`[transfer:${transferId}] STEP 2: Fetching worker context (${elapsed()})...`);
    const contextUrl = `${baseUrl}/api/portals/r2-worker-context`;
    console.log(`[transfer:${transferId}] Context URL: ${contextUrl}`);

    const contextBody = { uploadToken, uploaderName, workerSecret: env.WORKER_SECRET };
    console.log(`[transfer:${transferId}] Context request body:`, JSON.stringify(contextBody, null, 2));

    const ctxRes = await fetch(contextUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contextBody),
    });

    console.log(`[transfer:${transferId}] worker-context response: ${ctxRes.status} ${ctxRes.statusText} (${elapsed()})`);
    console.log(`[transfer:${transferId}] worker-context headers:`, Object.fromEntries(ctxRes.headers.entries()));

    if (!ctxRes.ok) {
      const text = await ctxRes.text();
      console.error(`[transfer:${transferId}] ❌ STEP 2 FAILED: Context fetch error`);
      console.error(`[transfer:${transferId}] Response body:`, text);
      await postCallback({ stagingKey, status: "failed", error: `Context fetch failed: ${ctxRes.status} ${text}` });
      return;
    }

    const ctx = await ctxRes.json() as {
      provider: "google" | "dropbox";
      accessToken: string;
      parentFolderId: string;
      folderPath: string;
      portalName: string;
    };
    console.log(`[transfer:${transferId}] ✓ STEP 2 SUCCESS: Context received`);
    console.log(`[transfer:${transferId}] Context data:`, {
      provider: ctx.provider,
      parentFolderId: ctx.parentFolderId,
      folderPath: ctx.folderPath,
      portalName: ctx.portalName,
      accessTokenLength: ctx.accessToken.length,
    });

    // 3. Get R2 object
    console.log(`[transfer] step 3: fetching R2 object (${elapsed()}):`, stagingKey);
    const r2Object = await env.R2_BUCKET.get(stagingKey);
    if (!r2Object) {
      console.log("[transfer] R2 object not found for key:", stagingKey);
      await postCallback({ stagingKey, status: "failed", error: "R2 object not found" });
      return;
    }
    console.log(`[transfer] R2 object found, size: ${r2Object.size} (${elapsed()})`);

    // 4. Stream to cloud storage
    const tCloud = Date.now();
    console.log(`[transfer] step 4: streaming to ${ctx.provider} (${elapsed()})...`);
    let storageFileId: string;
    let storageUrl: string;

    if (ctx.provider === "google") {
      const result = await uploadToGoogleDrive(
        ctx.accessToken,
        fileName,
        mimeType,
        ctx.parentFolderId,
        r2Object.body,
        r2Object.size,
      );
      storageFileId = result.id;
      storageUrl = result.webViewLink ?? `https://drive.google.com/file/d/${result.id}/view`;
    } else {
      const result = await uploadToDropbox(
        ctx.accessToken,
        ctx.folderPath,
        fileName,
        r2Object.body,
        r2Object.size,
      );
      storageFileId = result.id;
      storageUrl = "";
    }
    console.log(`[transfer] cloud upload done, storageFileId: ${storageFileId} (${elapsed()}, cloud=${Date.now() - tCloud}ms)`);

    // 5. Delete from R2
    console.log("[transfer] step 5: deleting from R2...");
    try {
      await env.R2_BUCKET.delete(stagingKey);
      console.log("[transfer] R2 delete OK");
    } catch (delErr) {
      console.error("[transfer] R2 delete failed (non-fatal):", delErr);
    }

    // 6. Notify Vercel — success
    console.log("[transfer] step 6: posting success callback...");
    await postCallback({
      stagingKey,
      status: "completed",
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageFileId,
      storageUrl,
      provider: ctx.provider,
      uploaderName,
      uploaderEmail,
      uploaderNotes,
      uploadSessionId,
      skipNotification: skipNotification ?? false,
    });

    console.log(`[transfer] DONE ✓ total=${elapsed()}`);
  } catch (err) {
    console.error("[transfer] UNCAUGHT ERROR:", err);
    await postCallback({
      stagingKey,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

// ── CORS helpers ──────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://dysumcorppro.vercel.app",
  "https://app.dysumcorp.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600",
  };
}

// ── Request handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestId = Math.random().toString(36).slice(2, 8);
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    console.log(`[handler:${requestId}] ═══════════════════════════════════════════════════════`);
    console.log(`[handler:${requestId}] ${request.method} ${url.pathname}`);
    console.log(`[handler:${requestId}] Origin: ${origin}`);
    console.log(`[handler:${requestId}] Headers:`, Object.fromEntries(request.headers.entries()));

    if (request.method === "OPTIONS") {
      console.log(`[handler:${requestId}] OPTIONS request, returning CORS headers`);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      console.log(`[handler:${requestId}] Health check`);
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/transfer") {
      console.warn(`[handler:${requestId}] ⚠️ Not Found: ${request.method} ${url.pathname}`);
      return new Response("Not Found", { status: 404 });
    }

    console.log(`[handler:${requestId}] POST /transfer - parsing body...`);
    let body: any;
    try {
      body = await request.json();
      console.log(`[handler:${requestId}] ✓ Body parsed:`, JSON.stringify(body, null, 2));
    } catch (parseErr) {
      console.error(`[handler:${requestId}] ❌ JSON parse error:`, parseErr);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const { uploadToken, stagingKey } = body;

    if (!uploadToken || !stagingKey) {
      console.error(`[handler:${requestId}] ❌ Missing required fields`);
      console.error(`[handler:${requestId}] uploadToken present: ${!!uploadToken}`);
      console.error(`[handler:${requestId}] stagingKey present: ${!!stagingKey}`);
      return new Response(
        JSON.stringify({ error: "uploadToken and stagingKey are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
      );
    }

    console.log(`[handler:${requestId}] stagingKey: ${stagingKey}`);
    console.log(`[handler:${requestId}] uploadToken length: ${uploadToken.length}`);
    console.log(`[handler:${requestId}] Environment check:`);
    console.log(`[handler:${requestId}]   BETTER_AUTH_SECRET present: ${!!env.BETTER_AUTH_SECRET} (length: ${env.BETTER_AUTH_SECRET?.length})`);
    console.log(`[handler:${requestId}]   WORKER_SECRET present: ${!!env.WORKER_SECRET} (length: ${env.WORKER_SECRET?.length})`);
    console.log(`[handler:${requestId}]   VERCEL_APP_URL: ${env.VERCEL_APP_URL}`);
    console.log(`[handler:${requestId}]   R2_BUCKET binding present: ${!!env.R2_BUCKET}`);

    console.log(`[handler:${requestId}] Validating upload token...`);
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      console.error(`[handler:${requestId}] ❌ Token validation failed`);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }
    console.log(`[handler:${requestId}] ✓ Token valid`);

    console.log(`[handler:${requestId}] Dispatching background transfer via ctx.waitUntil...`);
    ctx.waitUntil(runTransfer(env, body));

    console.log(`[handler:${requestId}] ✓ Returning 202 Accepted`);
    console.log(`[handler:${requestId}] ═══════════════════════════════════════════════════════`);

    return new Response(
      JSON.stringify({ accepted: true, stagingKey }),
      { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  },
};
