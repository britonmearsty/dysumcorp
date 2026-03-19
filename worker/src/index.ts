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
  VERCEL_APP_URL: string; // e.g. https://app.dysumcorp.com
}

// ── Token validation (mirrors lib/upload-tokens.ts) ──────────────────────────

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

    if (Date.now() > token.expiresAt) return null;

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
    if (token.signature !== expected) return null;

    return token;
  } catch {
    return null;
  }
}

// ── Google Drive resumable upload ─────────────────────────────────────────────

async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
  body: ReadableStream<Uint8Array>,
  fileSize: number,
): Promise<{ id: string; webViewLink?: string }> {
  // Initiate resumable session
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
    throw new Error(`Drive resumable init failed: ${initRes.status} ${await initRes.text()}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("Drive did not return a resumable upload URL");

  // Stream the R2 body directly — no buffering
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(fileSize),
    },
    body,
    // @ts-ignore — duplex required for streaming bodies in Workers
    duplex: "half",
  });

  if (!uploadRes.ok) {
    throw new Error(`Drive upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  return uploadRes.json();
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

  // Start session
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
    throw new Error(`Dropbox session start failed: ${startRes.status}`);
  }

  const { session_id } = await startRes.json() as { session_id: string };

  // Read stream in 8 MB chunks
  const reader = body.getReader();
  let offset = 0;
  let buffer = new Uint8Array(0);
  let done = false;

  while (!done) {
    // Fill buffer up to DROPBOX_CHUNK_SIZE
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

    if (isLast) {
      // Finish session
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
        throw new Error(`Dropbox finish failed: ${finishRes.status} ${await finishRes.text()}`);
      }

      return finishRes.json();
    } else {
      // Append chunk
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
        throw new Error(`Dropbox append failed: ${appendRes.status}`);
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

  async function postCallback(payload: Record<string, unknown>) {
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerSecret: env.WORKER_SECRET, ...payload }),
    });
  }

  try {
    // 1. Validate token
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      await postCallback({ stagingKey, status: "failed", error: "Invalid upload token" });
      return;
    }

    if (token.stagingKey !== stagingKey) {
      await postCallback({ stagingKey, status: "failed", error: "stagingKey mismatch" });
      return;
    }

    // 2. Get storage credentials from Vercel
    const ctxRes = await fetch(`${baseUrl}/api/portals/r2-worker-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken, uploaderName }),
    });

    if (!ctxRes.ok) {
      await postCallback({ stagingKey, status: "failed", error: `Context fetch failed: ${ctxRes.status}` });
      return;
    }

    const ctx = await ctxRes.json() as {
      provider: "google" | "dropbox";
      accessToken: string;
      parentFolderId: string;
      folderPath: string;
      portalName: string;
    };

    // 3. Get R2 object
    const r2Object = await env.R2_BUCKET.get(stagingKey);
    if (!r2Object) {
      await postCallback({ stagingKey, status: "failed", error: "R2 object not found" });
      return;
    }

    // 4. Stream to cloud storage
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

    // 5. Delete from R2
    try {
      await env.R2_BUCKET.delete(stagingKey);
    } catch (delErr) {
      // Non-fatal — lifecycle rule will clean it up
      console.error("[Worker] R2 delete failed (non-fatal):", delErr);
    }

    // 6. Notify Vercel — success
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
  } catch (err) {
    console.error("[Worker] Transfer error:", err);
    await postCallback({
      stagingKey,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

// ── Request handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }

    const { uploadToken, stagingKey } = body;

    if (!uploadToken || !stagingKey) {
      return new Response(
        JSON.stringify({ error: "uploadToken and stagingKey are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Quick token check before accepting — avoids accepting garbage requests
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Accept immediately, do the heavy work in the background
    ctx.waitUntil(runTransfer(env, body));

    return new Response(
      JSON.stringify({ accepted: true, stagingKey }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  },
};
