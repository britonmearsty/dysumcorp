/**
 * Dysumcorp Transfer Worker
 *
 * POST /transfer — accepts a stagingKey, returns 202 immediately,
 * then in ctx.waitUntil transfers the R2 object to Drive/Dropbox
 * using direct range reads (no streaming buffer accumulation).
 *
 * Parallelism: each /transfer call runs independently via ctx.waitUntil,
 * so multiple files transfer concurrently — one chunk at a time per file.
 *
 * Chunk size is controlled by CHUNK_SIZE below. Adjust to find the
 * sweet spot before hitting provider rate limits.
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  WORKER_SECRET: string;
  BETTER_AUTH_SECRET: string;
  VERCEL_APP_URL: string;
}

// ── Tunable chunk size ────────────────────────────────────────────────────────
// Single constant used for both Google Drive and Dropbox.
// Google: must be a multiple of 256 KB. 100 MB = 104,857,600 bytes ✓
// Dropbox: max 150 MB per chunk. 100 MB is well within limits.
// Larger chunks = fewer round trips = less wall-clock time under waitUntil.
// 100 MB: a 400 MB file needs only 4 chunks instead of 16 at 25 MB.
const CHUNK_SIZE = 100 * 1024 * 1024; // 100 MB

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

export async function hmacSign(secret: string, data: string): Promise<string> {
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

export async function validateUploadToken(
  encoded: string,
  secret: string,
): Promise<UploadToken | null> {
  try {
    // atob() only handles Latin-1; use TextDecoder to correctly handle UTF-8
    // filenames that contain non-ASCII characters (e.g. °, é, ñ).
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const token: UploadToken = JSON.parse(new TextDecoder().decode(bytes));

    if (Date.now() > token.expiresAt) {
      console.error("[token] ❌ expired");
      return null;
    }

    const dataToSign = {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      mimeType: token.mimeType,
      uploaderEmail: token.uploaderEmail,
      uploaderName: token.uploaderName,
      // Normalise optional fields to "" — must match lib/upload-tokens.ts exactly
      uploaderNotes: token.uploaderNotes ?? "",
      stagingKey: token.stagingKey ?? "",
      expiresAt: token.expiresAt,
    };

    // Fixed key order — same as generateUploadToken in lib/upload-tokens.ts
    const canonicalJson = JSON.stringify(dataToSign, [
      "portalId",
      "fileName",
      "fileSize",
      "mimeType",
      "uploaderEmail",
      "uploaderName",
      "uploaderNotes",
      "stagingKey",
      "expiresAt",
    ]);
    const expected = await hmacSign(secret, canonicalJson);

    if (token.signature !== expected) {
      console.error("[token] ❌ signature mismatch");
      return null;
    }

    return token;
  } catch (e) {
    console.error("[token] ❌ exception:", e);
    return null;
  }
}

// ── R2 range read helpers ─────────────────────────────────────────────────────
// getR2RangeStream: returns the R2 object for a byte range so the caller can
// stream its body directly into a fetch() — no buffering into Uint8Array.
// This avoids holding 100 MB in memory and lets the runtime pipeline the bytes.

export async function getR2RangeStream(
  bucket: R2Bucket,
  key: string,
  offset: number,
  length: number,
): Promise<R2ObjectBody> {
  const obj = await bucket.get(key, {
    range: { offset, length },
  });
  if (!obj)
    throw new Error(
      `R2 range read failed: key=${key} offset=${offset} length=${length}`,
    );
  return obj;
}

// Kept for tests / callers that still need a buffer.
export async function readR2Range(
  bucket: R2Bucket,
  key: string,
  offset: number,
  length: number,
): Promise<Uint8Array> {
  const obj = await getR2RangeStream(bucket, key, offset, length);
  return new Uint8Array(await obj.arrayBuffer());
}

// ── Google Drive chunked upload ───────────────────────────────────────────────

async function uploadToGoogleDrive(
  bucket: R2Bucket,
  stagingKey: string,
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
  fileSize: number,
): Promise<{ id: string; webViewLink?: string }> {
  const id = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = () => `${Date.now() - t0}ms`;

  console.log(
    `[drive:${id}] START fileName="${fileName}" size=${fileSize} chunk=${CHUNK_SIZE}`,
  );

  // Initiate resumable upload session
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
    throw new Error(`Drive init failed: ${initRes.status} ${text}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl)
    throw new Error("Drive did not return a resumable upload URL");
  console.log(`[drive:${id}] ✓ resumable URL obtained (${ms()})`);

  // Upload chunks sequentially using R2 range reads streamed directly to Drive
  let offset = 0;
  let chunkNum = 0;

  while (offset < fileSize) {
    const length = Math.min(CHUNK_SIZE, fileSize - offset);
    const isLast = offset + length >= fileSize;
    chunkNum++;

    const r2Obj = await getR2RangeStream(bucket, stagingKey, offset, length);
    const rangeEnd = offset + length - 1;

    console.log(
      `[drive:${id}] chunk ${chunkNum}: bytes ${offset}-${rangeEnd}/${fileSize} (${length}b)`,
    );

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(length),
        "Content-Range": `bytes ${offset}-${rangeEnd}/${fileSize}`,
      },
      // Stream the R2 body directly — no Uint8Array buffering
      body: r2Obj.body,
      // @ts-ignore — duplex required for streaming request bodies in some runtimes
      duplex: "half",
    });

    console.log(`[drive:${id}] chunk ${chunkNum} → ${res.status} (${ms()})`);

    if (isLast) {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive final chunk failed: ${res.status} ${text}`);
      }
      const result = (await res.json()) as { id: string; webViewLink?: string };
      console.log(
        `[drive:${id}] ✓ DONE fileId=${result.id} total=${ms()} chunks=${chunkNum}`,
      );
      return result;
    } else {
      if (res.status !== 308 && !res.ok) {
        const text = await res.text();
        throw new Error(
          `Drive chunk ${chunkNum} failed: ${res.status} ${text}`,
        );
      }
      offset += length;
    }
  }

  throw new Error("Drive upload loop exited without finishing");
}

// ── Dropbox chunked upload ────────────────────────────────────────────────────

async function uploadToDropbox(
  bucket: R2Bucket,
  stagingKey: string,
  accessToken: string,
  folderPath: string,
  fileName: string,
  fileSize: number,
): Promise<{ id: string; name: string }> {
  const id = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = () => `${Date.now() - t0}ms`;

  const path = `${folderPath.startsWith("/") ? "" : "/"}${folderPath}/${fileName}`;
  console.log(
    `[dropbox:${id}] START fileName="${fileName}" size=${fileSize} chunk=${CHUNK_SIZE} path=${path}`,
  );

  // Start upload session
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

  const { session_id } = (await startRes.json()) as { session_id: string };
  console.log(`[dropbox:${id}] ✓ session=${session_id} (${ms()})`);

  // Upload chunks sequentially using R2 range reads streamed directly to Dropbox
  let offset = 0;
  let chunkNum = 0;

  while (offset < fileSize) {
    const length = Math.min(CHUNK_SIZE, fileSize - offset);
    const isLast = offset + length >= fileSize;
    chunkNum++;

    const r2Obj = await getR2RangeStream(bucket, stagingKey, offset, length);
    console.log(
      `[dropbox:${id}] chunk ${chunkNum}: offset=${offset} size=${length} isLast=${isLast}`,
    );

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
            "Content-Length": String(length),
          },
          body: r2Obj.body,
          // @ts-ignore
          duplex: "half",
        },
      );

      console.log(`[dropbox:${id}] finish → ${finishRes.status} (${ms()})`);

      if (!finishRes.ok) {
        const text = await finishRes.text();
        throw new Error(`Dropbox finish failed: ${finishRes.status} ${text}`);
      }

      const result = (await finishRes.json()) as { id: string; name: string };
      console.log(
        `[dropbox:${id}] ✓ DONE fileId=${result.id} total=${ms()} chunks=${chunkNum}`,
      );
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
            "Content-Length": String(length),
          },
          body: r2Obj.body,
          // @ts-ignore
          duplex: "half",
        },
      );

      console.log(`[dropbox:${id}] append ${chunkNum} → ${appendRes.status}`);

      if (!appendRes.ok) {
        const text = await appendRes.text();
        throw new Error(
          `Dropbox append ${chunkNum} failed: ${appendRes.status} ${text}`,
        );
      }

      offset += length;
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
    /** Pre-resolved folder ID — skips folder creation race when provided */
    parentFolderId?: string;
    /** Pre-resolved folder path — passed alongside parentFolderId */
    folderPath?: string;
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
    parentFolderId: preResolvedFolderId,
    folderPath: preResolvedFolderPath,
  } = body;

  const tid = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = () => `${Date.now() - t0}ms`;

  console.log(
    `[transfer:${tid}] START key=${stagingKey} file="${fileName}" size=${fileSize}`,
  );

  async function postCallback(payload: Record<string, unknown>) {
    try {
      const res = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerSecret: env.WORKER_SECRET, ...payload }),
      });
      if (!res.ok) {
        console.error(
          `[transfer:${tid}] callback ${res.status}:`,
          await res.text(),
        );
      } else {
        console.log(`[transfer:${tid}] callback ✓ ${res.status}`);
      }
    } catch (e) {
      console.error(`[transfer:${tid}] callback exception:`, e);
    }
  }

  try {
    // 1. Validate token
    const token = await validateUploadToken(
      uploadToken,
      env.BETTER_AUTH_SECRET,
    );
    if (!token) {
      await postCallback({
        stagingKey,
        status: "failed",
        error: "Invalid upload token",
      });
      return;
    }
    if (token.stagingKey !== stagingKey) {
      await postCallback({
        stagingKey,
        status: "failed",
        error: "stagingKey mismatch",
      });
      return;
    }
    console.log(`[transfer:${tid}] ✓ token valid (${ms()})`);

    // 2. Get storage credentials from Vercel
    console.log(
      `[transfer:${tid}] → fetching Vercel context, VERCEL_APP_URL=${env.VERCEL_APP_URL}, WORKER_SECRET present=${!!env.WORKER_SECRET}`,
    );

    let ctxRes: Response;
    try {
      ctxRes = await fetch(
        `${env.VERCEL_APP_URL}/api/portals/r2-worker-context`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadToken,
            uploaderName,
            workerSecret: env.WORKER_SECRET,
            // Pass pre-resolved folder so the server skips folder creation
            parentFolderId: preResolvedFolderId,
            folderPath: preResolvedFolderPath,
          }),
        },
      );
    } catch (fetchErr) {
      console.error(`[transfer:${tid}] ❌ ctx fetch threw:`, fetchErr);
      await postCallback({
        stagingKey,
        status: "failed",
        error: `Context fetch exception: ${fetchErr}`,
      });
      return;
    }

    console.log(`[transfer:${tid}] ← ctx response status=${ctxRes.status}`);

    if (!ctxRes.ok) {
      const text = await ctxRes.text();
      console.error(
        `[transfer:${tid}] ❌ ctx fetch failed: ${ctxRes.status} ${text}`,
      );
      await postCallback({
        stagingKey,
        status: "failed",
        error: `Context fetch failed: ${ctxRes.status} ${text}`,
      });
      return;
    }

    let ctx: {
      provider: "google" | "dropbox";
      accessToken: string;
      parentFolderId: string;
      folderPath: string;
      portalName: string;
    };
    try {
      ctx = await ctxRes.json();
      console.log(
        `[transfer:${tid}] ✓ context: provider=${ctx.provider} parentFolderId=${ctx.parentFolderId} (${ms()})`,
      );
    } catch (jsonErr) {
      const text = await ctxRes.text();
      console.error(
        `[transfer:${tid}] ❌ ctx JSON parse failed:`,
        jsonErr,
        "body:",
        text,
      );
      await postCallback({
        stagingKey,
        status: "failed",
        error: `Context JSON parse failed: ${jsonErr}`,
      });
      return;
    }

    // 3. Verify R2 object exists
    const r2Head = await env.R2_BUCKET.head(stagingKey);
    if (!r2Head) {
      await postCallback({
        stagingKey,
        status: "failed",
        error: "R2 object not found",
      });
      return;
    }
    console.log(
      `[transfer:${tid}] ✓ R2 object exists size=${r2Head.size} (${ms()})`,
    );

    // 4. Transfer R2 → cloud storage using range reads + chunked upload
    let storageFileId: string;
    let storageUrl: string;

    if (ctx.provider === "google") {
      const result = await uploadToGoogleDrive(
        env.R2_BUCKET,
        stagingKey,
        ctx.accessToken,
        fileName,
        mimeType,
        ctx.parentFolderId,
        r2Head.size,
      );
      storageFileId = result.id;
      storageUrl =
        result.webViewLink ??
        `https://drive.google.com/file/d/${result.id}/view`;
    } else {
      const result = await uploadToDropbox(
        env.R2_BUCKET,
        stagingKey,
        ctx.accessToken,
        ctx.folderPath,
        fileName,
        r2Head.size,
      );
      storageFileId = result.id;
      storageUrl = "";
    }
    console.log(
      `[transfer:${tid}] ✓ cloud upload done storageFileId=${storageFileId} (${ms()})`,
    );

    // 5. Delete from R2
    try {
      await env.R2_BUCKET.delete(stagingKey);
      console.log(`[transfer:${tid}] ✓ R2 deleted`);
    } catch (e) {
      console.error(`[transfer:${tid}] R2 delete failed (non-fatal):`, e);
    }

    // 6. Callback to Vercel
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

    console.log(`[transfer:${tid}] ✓ DONE total=${ms()}`);
  } catch (err) {
    console.error(`[transfer:${tid}] ❌ UNCAUGHT:`, err);
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

export { CHUNK_SIZE };

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600",
  };
}

// ── Request handler ───────────────────────────────────────────────────────────

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const rid = Math.random().toString(36).slice(2, 8);
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    console.log(`[handler:${rid}] ${request.method} ${url.pathname}`);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(
        JSON.stringify({ ok: true, ts: Date.now(), chunkSize: CHUNK_SIZE }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        },
      );
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
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        },
      );
    }

    // Validate token before accepting — fast fail before queuing background work
    const token = await validateUploadToken(
      uploadToken,
      env.BETTER_AUTH_SECRET,
    );
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        },
      );
    }

    // Each call to ctx.waitUntil runs independently — multiple files transfer in parallel
    ctx.waitUntil(runTransfer(env, body));

    console.log(`[handler:${rid}] ✓ 202 accepted key=${stagingKey}`);
    return new Response(JSON.stringify({ accepted: true, stagingKey }), {
      status: 202,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  },
};
