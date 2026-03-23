var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var CHUNK_SIZE = 100 * 1024 * 1024;
async function hmacSign(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacSign, "hmacSign");
async function validateUploadToken(encoded, secret) {
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const token = JSON.parse(new TextDecoder().decode(bytes));
    if (Date.now() > token.expiresAt) {
      console.error("[token] \u274C expired");
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
      expiresAt: token.expiresAt
    };
    const canonicalJson = JSON.stringify(dataToSign, [
      "portalId",
      "fileName",
      "fileSize",
      "mimeType",
      "uploaderEmail",
      "uploaderName",
      "uploaderNotes",
      "stagingKey",
      "expiresAt"
    ]);
    const expected = await hmacSign(secret, canonicalJson);
    if (token.signature !== expected) {
      console.error("[token] \u274C signature mismatch");
      return null;
    }
    return token;
  } catch (e) {
    console.error("[token] \u274C exception:", e);
    return null;
  }
}
__name(validateUploadToken, "validateUploadToken");
async function getR2RangeStream(bucket, key, offset, length) {
  const obj = await bucket.get(key, {
    range: { offset, length }
  });
  if (!obj) throw new Error(`R2 range read failed: key=${key} offset=${offset} length=${length}`);
  return obj;
}
__name(getR2RangeStream, "getR2RangeStream");
async function readR2Range(bucket, key, offset, length) {
  const obj = await getR2RangeStream(bucket, key, offset, length);
  return new Uint8Array(await obj.arrayBuffer());
}
__name(readR2Range, "readR2Range");
async function uploadToGoogleDrive(bucket, stagingKey, accessToken, fileName, mimeType, parentFolderId, fileSize) {
  const id = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = /* @__PURE__ */ __name(() => `${Date.now() - t0}ms`, "ms");
  console.log(`[drive:${id}] START fileName="${fileName}" size=${fileSize} chunk=${CHUNK_SIZE}`);
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileSize)
      },
      body: JSON.stringify({ name: fileName, parents: [parentFolderId] })
    }
  );
  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Drive init failed: ${initRes.status} ${text}`);
  }
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("Drive did not return a resumable upload URL");
  console.log(`[drive:${id}] \u2713 resumable URL obtained (${ms()})`);
  let offset = 0;
  let chunkNum = 0;
  while (offset < fileSize) {
    const length = Math.min(CHUNK_SIZE, fileSize - offset);
    const isLast = offset + length >= fileSize;
    chunkNum++;
    const r2Obj = await getR2RangeStream(bucket, stagingKey, offset, length);
    const rangeEnd = offset + length - 1;
    console.log(`[drive:${id}] chunk ${chunkNum}: bytes ${offset}-${rangeEnd}/${fileSize} (${length}b)`);
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(length),
        "Content-Range": `bytes ${offset}-${rangeEnd}/${fileSize}`
      },
      // Stream the R2 body directly — no Uint8Array buffering
      body: r2Obj.body,
      // @ts-ignore — duplex required for streaming request bodies in some runtimes
      duplex: "half"
    });
    console.log(`[drive:${id}] chunk ${chunkNum} \u2192 ${res.status} (${ms()})`);
    if (isLast) {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive final chunk failed: ${res.status} ${text}`);
      }
      const result = await res.json();
      console.log(`[drive:${id}] \u2713 DONE fileId=${result.id} total=${ms()} chunks=${chunkNum}`);
      return result;
    } else {
      if (res.status !== 308 && !res.ok) {
        const text = await res.text();
        throw new Error(`Drive chunk ${chunkNum} failed: ${res.status} ${text}`);
      }
      offset += length;
    }
  }
  throw new Error("Drive upload loop exited without finishing");
}
__name(uploadToGoogleDrive, "uploadToGoogleDrive");
async function uploadToDropbox(bucket, stagingKey, accessToken, folderPath, fileName, fileSize) {
  const id = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = /* @__PURE__ */ __name(() => `${Date.now() - t0}ms`, "ms");
  const path = `${folderPath.startsWith("/") ? "" : "/"}${folderPath}/${fileName}`;
  console.log(`[dropbox:${id}] START fileName="${fileName}" size=${fileSize} chunk=${CHUNK_SIZE} path=${path}`);
  const startRes = await fetch(
    "https://content.dropboxapi.com/2/files/upload_session/start",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream"
      },
      body: new Uint8Array(0)
    }
  );
  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Dropbox session start failed: ${startRes.status} ${text}`);
  }
  const { session_id } = await startRes.json();
  console.log(`[dropbox:${id}] \u2713 session=${session_id} (${ms()})`);
  let offset = 0;
  let chunkNum = 0;
  while (offset < fileSize) {
    const length = Math.min(CHUNK_SIZE, fileSize - offset);
    const isLast = offset + length >= fileSize;
    chunkNum++;
    const r2Obj = await getR2RangeStream(bucket, stagingKey, offset, length);
    console.log(`[dropbox:${id}] chunk ${chunkNum}: offset=${offset} size=${length} isLast=${isLast}`);
    if (isLast) {
      const finishRes = await fetch(
        "https://content.dropboxapi.com/2/files/upload_session/finish",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              cursor: { session_id, offset },
              commit: { path, mode: "add", autorename: true }
            }),
            "Content-Type": "application/octet-stream",
            "Content-Length": String(length)
          },
          body: r2Obj.body,
          // @ts-ignore
          duplex: "half"
        }
      );
      console.log(`[dropbox:${id}] finish \u2192 ${finishRes.status} (${ms()})`);
      if (!finishRes.ok) {
        const text = await finishRes.text();
        throw new Error(`Dropbox finish failed: ${finishRes.status} ${text}`);
      }
      const result = await finishRes.json();
      console.log(`[dropbox:${id}] \u2713 DONE fileId=${result.id} total=${ms()} chunks=${chunkNum}`);
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
              close: false
            }),
            "Content-Type": "application/octet-stream",
            "Content-Length": String(length)
          },
          body: r2Obj.body,
          // @ts-ignore
          duplex: "half"
        }
      );
      console.log(`[dropbox:${id}] append ${chunkNum} \u2192 ${appendRes.status}`);
      if (!appendRes.ok) {
        const text = await appendRes.text();
        throw new Error(`Dropbox append ${chunkNum} failed: ${appendRes.status} ${text}`);
      }
      offset += length;
    }
  }
  throw new Error("Dropbox upload loop exited without finishing");
}
__name(uploadToDropbox, "uploadToDropbox");
async function runTransfer(env, body) {
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
    callbackUrl
  } = body;
  const tid = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = /* @__PURE__ */ __name(() => `${Date.now() - t0}ms`, "ms");
  console.log(`[transfer:${tid}] START key=${stagingKey} file="${fileName}" size=${fileSize}`);
  async function postCallback(payload) {
    try {
      const res = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerSecret: env.WORKER_SECRET, ...payload })
      });
      if (!res.ok) {
        console.error(`[transfer:${tid}] callback ${res.status}:`, await res.text());
      } else {
        console.log(`[transfer:${tid}] callback \u2713 ${res.status}`);
      }
    } catch (e) {
      console.error(`[transfer:${tid}] callback exception:`, e);
    }
  }
  __name(postCallback, "postCallback");
  try {
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      await postCallback({ stagingKey, status: "failed", error: "Invalid upload token" });
      return;
    }
    if (token.stagingKey !== stagingKey) {
      await postCallback({ stagingKey, status: "failed", error: "stagingKey mismatch" });
      return;
    }
    console.log(`[transfer:${tid}] \u2713 token valid (${ms()})`);
    const ctxRes = await fetch(`${env.VERCEL_APP_URL}/api/portals/r2-worker-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken, uploaderName, workerSecret: env.WORKER_SECRET })
    });
    if (!ctxRes.ok) {
      const text = await ctxRes.text();
      await postCallback({ stagingKey, status: "failed", error: `Context fetch failed: ${ctxRes.status} ${text}` });
      return;
    }
    const ctx = await ctxRes.json();
    console.log(`[transfer:${tid}] \u2713 context: provider=${ctx.provider} (${ms()})`);
    const r2Head = await env.R2_BUCKET.head(stagingKey);
    if (!r2Head) {
      await postCallback({ stagingKey, status: "failed", error: "R2 object not found" });
      return;
    }
    console.log(`[transfer:${tid}] \u2713 R2 object exists size=${r2Head.size} (${ms()})`);
    let storageFileId;
    let storageUrl;
    if (ctx.provider === "google") {
      const result = await uploadToGoogleDrive(
        env.R2_BUCKET,
        stagingKey,
        ctx.accessToken,
        fileName,
        mimeType,
        ctx.parentFolderId,
        r2Head.size
      );
      storageFileId = result.id;
      storageUrl = result.webViewLink ?? `https://drive.google.com/file/d/${result.id}/view`;
    } else {
      const result = await uploadToDropbox(
        env.R2_BUCKET,
        stagingKey,
        ctx.accessToken,
        ctx.folderPath,
        fileName,
        r2Head.size
      );
      storageFileId = result.id;
      storageUrl = "";
    }
    console.log(`[transfer:${tid}] \u2713 cloud upload done storageFileId=${storageFileId} (${ms()})`);
    try {
      await env.R2_BUCKET.delete(stagingKey);
      console.log(`[transfer:${tid}] \u2713 R2 deleted`);
    } catch (e) {
      console.error(`[transfer:${tid}] R2 delete failed (non-fatal):`, e);
    }
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
      skipNotification: skipNotification ?? false
    });
    console.log(`[transfer:${tid}] \u2713 DONE total=${ms()}`);
  } catch (err) {
    console.error(`[transfer:${tid}] \u274C UNCAUGHT:`, err);
    await postCallback({
      stagingKey,
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
__name(runTransfer, "runTransfer");
var ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://dysumcorppro.vercel.app",
  "https://app.dysumcorp.com"
];
function corsHeaders(origin) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600"
  };
}
__name(corsHeaders, "corsHeaders");
var index_default = {
  async fetch(request, env, ctx) {
    const rid = Math.random().toString(36).slice(2, 8);
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    console.log(`[handler:${rid}] ${request.method} ${url.pathname}`);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, ts: Date.now(), chunkSize: CHUNK_SIZE }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }
    if (request.method !== "POST" || url.pathname !== "/transfer") {
      return new Response("Not Found", { status: 404 });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }
    const { uploadToken, stagingKey } = body;
    if (!uploadToken || !stagingKey) {
      return new Response(
        JSON.stringify({ error: "uploadToken and stagingKey are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }
    const token = await validateUploadToken(uploadToken, env.BETTER_AUTH_SECRET);
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }
    ctx.waitUntil(runTransfer(env, body));
    console.log(`[handler:${rid}] \u2713 202 accepted key=${stagingKey}`);
    return new Response(
      JSON.stringify({ accepted: true, stagingKey }),
      { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
    );
  }
};
export {
  CHUNK_SIZE,
  corsHeaders,
  index_default as default,
  getR2RangeStream,
  hmacSign,
  readR2Range,
  validateUploadToken
};
//# sourceMappingURL=index.js.map
