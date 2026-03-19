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
  try {
    const json = atob(encoded);
    const token: UploadToken = JSON.parse(json);

    if (Date.now() > token.expiresAt) {
      console.log("[token] expired at", new Date(token.expiresAt).toISOString(), "now", new Date().toISOString());
      return null;
    }

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

    const expected = await hmacSign(secret, JSON.stringify(dataToSign));
    if (token.signature !== expected) {
      console.log("[token] signature mismatch — secret may be wrong");
      console.log("[token] expected prefix:", expected.slice(0, 8), "got:", token.signature.slice(0, 8));
      return null;
    }

    return token;
  } catch (e) {
    console.log("[token] parse error:", e);
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
  const t0 = Date.now();
  console.log("[drive] initiating resumable upload, size:", fileSize, "parent:", parentFolderId);

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

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Drive resumable init failed: ${initRes.status} ${text}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("Drive did not return a resumable upload URL");
  console.log(`[drive] got resumable URL (${Date.now() - t0}ms), starting chunked stream...`);

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
        const merged = new Uint8Array(buffer.length + value.length);
        merged.set(buffer);
        merged.set(value, buffer.length);
        buffer = merged;
      }
    }

    if (buffer.length === 0) break;

    const isLast = done || offset + buffer.length >= fileSize;
    const chunk = isLast ? buffer : buffer.slice(0, DRIVE_CHUNK_SIZE);
    buffer = isLast ? new Uint8Array(0) : buffer.slice(DRIVE_CHUNK_SIZE);
    chunkCount++;

    const rangeEnd = offset + chunk.length - 1;
    const tc = Date.now();
    console.log(`[drive] chunk ${chunkCount}: bytes ${offset}-${rangeEnd}/${isLast ? fileSize : "*"} (${chunk.length} bytes)`);

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${offset}-${rangeEnd}/${isLast ? fileSize : "*"}`,
      },
      body: chunk,
    });

    console.log(`[drive] chunk ${chunkCount} response: ${uploadRes.status} (${Date.now() - tc}ms)`);

    if (isLast) {
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Drive final chunk failed: ${uploadRes.status} ${text}`);
      }
      const result = await uploadRes.json() as { id: string; webViewLink?: string };
      console.log(`[drive] upload complete, fileId: ${result.id} total=${Date.now() - t0}ms`);
      return result;
    } else {
      // 308 Resume Incomplete is expected for non-final chunks
      if (uploadRes.status !== 308 && !uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Drive chunk ${chunkCount} failed: ${uploadRes.status} ${text}`);
      }
      offset += chunk.length;
    }
  }

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
  const path = `${folderPath.startsWith("/") ? "" : "/"}${folderPath}/${fileName}`;
  console.log("[dropbox] starting upload to path:", path, "size:", fileSize);

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

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Dropbox session start failed: ${startRes.status} ${text}`);
  }

  const { session_id } = await startRes.json() as { session_id: string };
  console.log("[dropbox] session started:", session_id);

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

    console.log(`[dropbox] chunk ${chunkCount}, offset=${offset}, size=${chunk.length}, isLast=${isLast}`);

    if (isLast) {
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

      if (!finishRes.ok) {
        const text = await finishRes.text();
        throw new Error(`Dropbox finish failed: ${finishRes.status} ${text}`);
      }

      const result = await finishRes.json() as { id: string; name: string };
      console.log("[dropbox] upload complete, id:", result.id);
      return result;
    } else {
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

      if (!appendRes.ok) {
        const text = await appendRes.text();
        throw new Error(`Dropbox append failed: ${appendRes.status} ${text}`);
      }

      offset += chunk.length;
    }
  }

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

  const baseUrl = env.VERCEL_APP_URL;
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;
  console.log(`[transfer] START stagingKey=${stagingKey} file="${fileName}" size=${fileSize}`);
  console.log(`[transfer] callbackUrl=${callbackUrl} baseUrl=${baseUrl}`);

  async function postCallback(payload: Record<string, unknown>) {
    console.log("[transfer] posting callback, status:", payload.status);
    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerSecret: env.WORKER_SECRET, ...payload }),
    });
    console.log("[transfer] callback response:", res.status);
    if (!res.ok) {
      const text = await res.text();
      console.log("[transfer] callback error body:", text);
    }
  }

  try {
    // 1. Validate token
    console.log("[transfer] step 1: validating token...");
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      console.log("[transfer] token invalid — aborting");
      await postCallback({ stagingKey, status: "failed", error: "Invalid upload token" });
      return;
    }
    console.log("[transfer] token valid, portalId:", token.portalId);

    if (token.stagingKey !== stagingKey) {
      console.log("[transfer] stagingKey mismatch — token:", token.stagingKey, "body:", stagingKey);
      await postCallback({ stagingKey, status: "failed", error: "stagingKey mismatch" });
      return;
    }

    // 2. Get storage credentials from Vercel
    console.log(`[transfer] step 2: fetching worker context (${elapsed()})...`);
    const ctxRes = await fetch(`${baseUrl}/api/portals/r2-worker-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken, uploaderName, workerSecret: env.WORKER_SECRET }),
    });

    console.log(`[transfer] worker-context response: ${ctxRes.status} (${elapsed()})`)
    if (!ctxRes.ok) {
      const text = await ctxRes.text();
      console.log("[transfer] worker-context error:", text);
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
    console.log("[transfer] storage provider:", ctx.provider, "folder:", ctx.folderPath);

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
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/transfer") {
      return new Response("Not Found", { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const { uploadToken, stagingKey } = body;

    if (!uploadToken || !stagingKey) {
      return new Response(
        JSON.stringify({ error: "uploadToken and stagingKey are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
      );
    }

    console.log("[handler] incoming transfer request, stagingKey:", stagingKey);
    console.log("[handler] BETTER_AUTH_SECRET present:", !!env.BETTER_AUTH_SECRET, "length:", env.BETTER_AUTH_SECRET?.length);
    console.log("[handler] WORKER_SECRET present:", !!env.WORKER_SECRET);
    console.log("[handler] VERCEL_APP_URL:", env.VERCEL_APP_URL);

    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      console.log("[handler] token validation failed — returning 401");
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    console.log("[handler] token valid — dispatching background transfer");
    ctx.waitUntil(runTransfer(env, body));

    return new Response(
      JSON.stringify({ accepted: true, stagingKey }),
      { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  },
};
