/**
 * Worker edge case tests
 *
 * Covers:
 *  - hmacSign / validateUploadToken
 *  - readR2Range
 *  - uploadToGoogleDrive (via fetch handler + mocked fetch)
 *  - uploadToDropbox (via fetch handler + mocked fetch)
 *  - HTTP handler routing, CORS, auth
 *  - runTransfer failure paths (bad token, stagingKey mismatch, R2 miss, provider error)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hmacSign, validateUploadToken, readR2Range, corsHeaders, CHUNK_SIZE } from "./index";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECRET = "test-secret-32-chars-minimum-ok!";

async function makeToken(overrides: Partial<{
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes: string | undefined;
  stagingKey: string | undefined;
  expiresAt: number;
}> = {}) {
  const base = {
    portalId: "portal-123",
    fileName: "test.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    uploaderEmail: "client@example.com",
    uploaderName: "Test Client",
    uploaderNotes: undefined,
    stagingKey: "staging/abc123",
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };

  const dataToSign = {
    portalId: base.portalId,
    fileName: base.fileName,
    fileSize: base.fileSize,
    mimeType: base.mimeType,
    uploaderEmail: base.uploaderEmail,
    uploaderName: base.uploaderName,
    uploaderNotes: base.uploaderNotes,
    stagingKey: base.stagingKey,
    expiresAt: base.expiresAt,
  };

  const canonical = JSON.stringify(
    dataToSign,
    Object.keys(JSON.parse(JSON.stringify(dataToSign))).sort(),
  );
  const signature = await hmacSign(SECRET, canonical);
  return btoa(JSON.stringify({ ...base, signature }));
}

/** Minimal R2Bucket mock */
function makeBucket(data: Record<string, Uint8Array>): R2Bucket {
  return {
    get: vi.fn(async (key: string, opts?: { range?: { offset: number; length: number } }) => {
      const buf = data[key];
      if (!buf) return null;
      const slice = opts?.range
        ? buf.slice(opts.range.offset, opts.range.offset + opts.range.length)
        : buf;
      return {
        arrayBuffer: async () => slice.buffer,
        body: new ReadableStream(),
        size: slice.length,
      };
    }),
    head: vi.fn(async (key: string) => {
      const buf = data[key];
      return buf ? { size: buf.length } : null;
    }),
    delete: vi.fn(async () => {}),
    put: vi.fn(),
    list: vi.fn(),
    createMultipartUpload: vi.fn(),
    resumeMultipartUpload: vi.fn(),
  } as unknown as R2Bucket;
}

function makeEnv(bucketData: Record<string, Uint8Array> = {}): import("./index").Env {
  return {
    R2_BUCKET: makeBucket(bucketData),
    WORKER_SECRET: "worker-secret-xyz",
    BETTER_AUTH_SECRET: SECRET,
    VERCEL_APP_URL: "https://app.example.com",
  };
}

// ── hmacSign ──────────────────────────────────────────────────────────────────

describe("hmacSign", () => {
  it("produces a 64-char hex string", async () => {
    const sig = await hmacSign("secret", "data");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same inputs produce same output", async () => {
    const a = await hmacSign("secret", "data");
    const b = await hmacSign("secret", "data");
    expect(a).toBe(b);
  });

  it("differs when secret changes", async () => {
    const a = await hmacSign("secret-a", "data");
    const b = await hmacSign("secret-b", "data");
    expect(a).not.toBe(b);
  });

  it("differs when data changes", async () => {
    const a = await hmacSign("secret", "data-a");
    const b = await hmacSign("secret", "data-b");
    expect(a).not.toBe(b);
  });
});

// ── validateUploadToken ───────────────────────────────────────────────────────

describe("validateUploadToken", () => {
  it("accepts a valid token", async () => {
    const encoded = await makeToken();
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).not.toBeNull();
    expect(result?.portalId).toBe("portal-123");
  });

  it("rejects an expired token", async () => {
    const encoded = await makeToken({ expiresAt: Date.now() - 1000 });
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).toBeNull();
  });

  it("rejects a token with wrong signature", async () => {
    const token = JSON.parse(atob(await makeToken()));
    token.signature = "a".repeat(64); // tampered
    const encoded = btoa(JSON.stringify(token));
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const encoded = await makeToken();
    const result = await validateUploadToken(encoded, "wrong-secret");
    expect(result).toBeNull();
  });

  it("rejects a tampered portalId (signature no longer matches)", async () => {
    const token = JSON.parse(atob(await makeToken()));
    token.portalId = "evil-portal";
    const encoded = btoa(JSON.stringify(token));
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).toBeNull();
  });

  it("rejects garbage base64", async () => {
    const result = await validateUploadToken("not-valid-base64!!!", SECRET);
    expect(result).toBeNull();
  });

  it("rejects valid base64 but invalid JSON", async () => {
    const result = await validateUploadToken(btoa("not json"), SECRET);
    expect(result).toBeNull();
  });

  it("accepts token expiring exactly 1ms in the future", async () => {
    const encoded = await makeToken({ expiresAt: Date.now() + 1 });
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).not.toBeNull();
  });

  it("preserves optional fields (uploaderNotes, stagingKey)", async () => {
    const encoded = await makeToken({ uploaderNotes: "urgent docs", stagingKey: "staging/xyz" });
    const result = await validateUploadToken(encoded, SECRET);
    expect(result?.uploaderNotes).toBe("urgent docs");
    expect(result?.stagingKey).toBe("staging/xyz");
  });

  it("handles token with undefined optional fields", async () => {
    const encoded = await makeToken({ uploaderNotes: undefined, stagingKey: undefined });
    const result = await validateUploadToken(encoded, SECRET);
    expect(result).not.toBeNull();
  });
});

// ── readR2Range ───────────────────────────────────────────────────────────────

describe("readR2Range", () => {
  it("returns the correct byte slice", async () => {
    const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const bucket = makeBucket({ "my-key": data });
    const result = await readR2Range(bucket, "my-key", 2, 4);
    expect(result).toEqual(new Uint8Array([2, 3, 4, 5]));
  });

  it("reads from offset 0", async () => {
    const data = new Uint8Array([10, 20, 30]);
    const bucket = makeBucket({ "key": data });
    const result = await readR2Range(bucket, "key", 0, 3);
    expect(result).toEqual(new Uint8Array([10, 20, 30]));
  });

  it("reads the last byte only", async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const bucket = makeBucket({ "key": data });
    const result = await readR2Range(bucket, "key", 4, 1);
    expect(result).toEqual(new Uint8Array([5]));
  });

  it("throws when key does not exist in R2", async () => {
    const bucket = makeBucket({});
    await expect(readR2Range(bucket, "missing-key", 0, 10)).rejects.toThrow(
      "R2 range read failed: key=missing-key offset=0 length=10",
    );
  });

  it("passes correct range params to bucket.get", async () => {
    const data = new Uint8Array(100).fill(0xff);
    const bucket = makeBucket({ "k": data });
    await readR2Range(bucket, "k", 50, 25);
    expect(bucket.get).toHaveBeenCalledWith("k", { range: { offset: 50, length: 25 } });
  });
});

// ── CHUNK_SIZE ────────────────────────────────────────────────────────────────

describe("CHUNK_SIZE", () => {
  it("is a multiple of 256 KB (Google Drive requirement)", () => {
    expect(CHUNK_SIZE % (256 * 1024)).toBe(0);
  });

  it("is at most 150 MB (Dropbox hard limit)", () => {
    expect(CHUNK_SIZE).toBeLessThanOrEqual(150 * 1024 * 1024);
  });

  it("is at least 1 MB (sanity lower bound)", () => {
    expect(CHUNK_SIZE).toBeGreaterThanOrEqual(1 * 1024 * 1024);
  });
});

// ── corsHeaders ───────────────────────────────────────────────────────────────

describe("corsHeaders", () => {
  it("allows a known origin", () => {
    const h = corsHeaders("https://app.dysumcorp.com");
    expect(h["Access-Control-Allow-Origin"]).toBe("https://app.dysumcorp.com");
  });

  it("falls back to localhost for unknown origin", () => {
    const h = corsHeaders("https://evil.com");
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("falls back to localhost for null origin", () => {
    const h = corsHeaders(null);
    expect(h["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("includes required CORS headers", () => {
    const h = corsHeaders("http://localhost:3000");
    expect(h["Access-Control-Allow-Methods"]).toContain("POST");
    expect(h["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });
});

// ── HTTP handler ──────────────────────────────────────────────────────────────

import worker from "./index";

function makeCtx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;
}

function req(method: string, path: string, body?: unknown, origin?: string): Request {
  return new Request(`https://worker.example.com${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("HTTP handler — routing", () => {
  it("GET /health returns 200 with chunkSize", async () => {
    const res = await worker.fetch(req("GET", "/health"), makeEnv(), makeCtx());
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.ok).toBe(true);
    expect(json.chunkSize).toBe(CHUNK_SIZE);
  });

  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await worker.fetch(
      req("OPTIONS", "/transfer", undefined, "https://app.dysumcorp.com"),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.dysumcorp.com");
  });

  it("GET /transfer returns 404", async () => {
    const res = await worker.fetch(req("GET", "/transfer"), makeEnv(), makeCtx());
    expect(res.status).toBe(404);
  });

  it("POST /unknown returns 404", async () => {
    const res = await worker.fetch(req("POST", "/unknown", {}), makeEnv(), makeCtx());
    expect(res.status).toBe(404);
  });

  it("POST /transfer with invalid JSON returns 400", async () => {
    const r = new Request("https://worker.example.com/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json {{{",
    });
    const res = await worker.fetch(r, makeEnv(), makeCtx());
    expect(res.status).toBe(400);
    const json = await res.json() as any;
    expect(json.error).toMatch(/invalid json/i);
  });

  it("POST /transfer missing uploadToken returns 400", async () => {
    const res = await worker.fetch(
      req("POST", "/transfer", { stagingKey: "k" }),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(400);
  });

  it("POST /transfer missing stagingKey returns 400", async () => {
    const res = await worker.fetch(
      req("POST", "/transfer", { uploadToken: "t" }),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(400);
  });

  it("POST /transfer with invalid token returns 401", async () => {
    const res = await worker.fetch(
      req("POST", "/transfer", { uploadToken: btoa("{}"), stagingKey: "k" }),
      makeEnv(),
      makeCtx(),
    );
    expect(res.status).toBe(401);
  });

  it("POST /transfer with valid token returns 202 and queues work", async () => {
    const encoded = await makeToken({ stagingKey: "staging/abc" });
    const ctx = makeCtx();
    const res = await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded,
        stagingKey: "staging/abc",
        portalId: "portal-123",
        fileName: "test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/api/portals/r2-confirm",
      }),
      makeEnv(),
      ctx,
    );
    expect(res.status).toBe(202);
    const json = await res.json() as any;
    expect(json.accepted).toBe(true);
    expect(json.stagingKey).toBe("staging/abc");
    expect(ctx.waitUntil).toHaveBeenCalledOnce();
  });
});

// ── runTransfer — via mocked global fetch ─────────────────────────────────────
// We test runTransfer indirectly: POST /transfer with a valid token,
// then await the waitUntil promise and inspect what fetch was called with.

describe("runTransfer — failure paths", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function dispatchTransfer(overrides: {
    stagingKey?: string;
    fileSize?: number;
    bucketData?: Record<string, Uint8Array>;
    contextResponse?: object | null;
    callbackUrl?: string;
  } = {}) {
    const stagingKey = overrides.stagingKey ?? "staging/abc";
    const fileSize = overrides.fileSize ?? 100;
    const encoded = await makeToken({ stagingKey, fileSize });

    const bucketData = overrides.bucketData ?? {
      [stagingKey]: new Uint8Array(fileSize).fill(1),
    };
    const env = makeEnv(bucketData);
    const ctx = makeCtx();

    // Capture the waitUntil promise
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded,
        stagingKey,
        portalId: "portal-123",
        fileName: "test.pdf",
        fileSize,
        mimeType: "application/pdf",
        callbackUrl: overrides.callbackUrl ?? "https://app.example.com/callback",
      }),
      env,
      ctx,
    );

    return { transferPromise: transferPromise!, env };
  }

  it("posts failed callback when context fetch returns non-ok", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 })) // context
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));           // callback

    const { transferPromise } = await dispatchTransfer();
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[1];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/Context fetch failed/);
  });

  it("posts failed callback when R2 object is missing", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({  // context ok
        provider: "google",
        accessToken: "tok",
        parentFolderId: "folder-id",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 })); // callback

    // Empty bucket — no file
    const { transferPromise } = await dispatchTransfer({ bucketData: {} });
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[1];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/R2 object not found/);
  });

  it("posts failed callback when stagingKey in token doesn't match request", async () => {
    // Token signed with stagingKey "staging/abc" but request sends "staging/different".
    // The handler validates the token (which passes — token is valid for "staging/abc"),
    // queues runTransfer, which then detects the mismatch and posts a failed callback.
    const encoded = await makeToken({ stagingKey: "staging/abc" });
    const env = makeEnv({ "staging/different": new Uint8Array(10) });
    const ctx = makeCtx();

    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 })); // callback

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded,
        stagingKey: "staging/different",
        portalId: "portal-123",
        fileName: "test.pdf",
        fileSize: 10,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env,
      ctx,
    );

    // waitUntil IS called — token validates (it's a valid token), mismatch caught inside runTransfer
    expect(ctx.waitUntil).toHaveBeenCalledOnce();
    await transferPromise!;

    const callbackCall = fetchMock.mock.calls[0];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/stagingKey mismatch/);
  });

  it("posts failed callback when Drive init returns non-ok", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({  // context ok
        provider: "google",
        accessToken: "tok",
        parentFolderId: "folder-id",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("quota exceeded", { status: 403 })) // drive init fails
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));             // callback

    const { transferPromise } = await dispatchTransfer();
    await transferPromise;

    // calls: [0]=context, [1]=drive init, [2]=callback
    const callbackCall = fetchMock.mock.calls[2];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/Drive init failed/);
  });

  it("posts failed callback when Drive init has no Location header", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google",
        accessToken: "tok",
        parentFolderId: "folder-id",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 })) // drive init — no Location
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer();
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[2];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/resumable upload URL/);
  });

  it("posts failed callback when Dropbox session start fails", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox",
        accessToken: "tok",
        parentFolderId: "",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("too_many_requests", { status: 429 })) // session start
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer();
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[2];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("failed");
    expect(body.error).toMatch(/Dropbox session start failed/);
  });

  it("posts completed callback on successful Google Drive single-chunk upload", async () => {
    const fileData = new Uint8Array(100).fill(0xab);

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({  // context
        provider: "google",
        accessToken: "tok",
        parentFolderId: "folder-id",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(                                // drive init — returns Location
        new Response("", {
          status: 200,
          headers: { Location: "https://upload.googleapis.com/resumable/abc123" },
        }),
      )
      .mockResolvedValueOnce(                                // drive chunk PUT — final
        new Response(JSON.stringify({ id: "drive-file-id", webViewLink: "https://drive.google.com/file/d/drive-file-id/view" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 })); // callback

    const { transferPromise } = await dispatchTransfer({ fileSize: 100 });
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[3];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("completed");
    expect(body.storageFileId).toBe("drive-file-id");
    expect(body.provider).toBe("google");
  });

  it("posts completed callback on successful Dropbox single-chunk upload", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({  // context
        provider: "dropbox",
        accessToken: "tok",
        parentFolderId: "",
        folderPath: "uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(                                // session start
        new Response(JSON.stringify({ session_id: "sess-xyz" }), { status: 200 }),
      )
      .mockResolvedValueOnce(                                // finish (single chunk = last)
        new Response(JSON.stringify({ id: "dbx-file-id", name: "test.pdf" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 })); // callback

    const { transferPromise } = await dispatchTransfer({ fileSize: 100 });
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[3];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("completed");
    expect(body.storageFileId).toBe("dbx-file-id");
    expect(body.provider).toBe("dropbox");
  });

  it("sends correct Content-Range header for multi-chunk Google Drive upload", async () => {
    // File slightly larger than CHUNK_SIZE to force 2 chunks
    const fileSize = CHUNK_SIZE + 1024;
    const fileData = new Uint8Array(fileSize).fill(0x01);

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google",
        accessToken: "tok",
        parentFolderId: "folder-id",
        folderPath: "/uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: { Location: "https://upload.googleapis.com/resumable/multi" },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 308 }))  // chunk 1 — not final
      .mockResolvedValueOnce(                                      // chunk 2 — final
        new Response(JSON.stringify({ id: "drive-multi-id" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer({
      fileSize,
      bucketData: { "staging/abc": fileData },
    });
    await transferPromise;

    // chunk 1: bytes 0 to CHUNK_SIZE-1
    const chunk1Call = fetchMock.mock.calls[2];
    expect(chunk1Call[1].headers["Content-Range"]).toBe(
      `bytes 0-${CHUNK_SIZE - 1}/${fileSize}`,
    );

    // chunk 2: bytes CHUNK_SIZE to end
    const chunk2Call = fetchMock.mock.calls[3];
    expect(chunk2Call[1].headers["Content-Range"]).toBe(
      `bytes ${CHUNK_SIZE}-${fileSize - 1}/${fileSize}`,
    );
  });

  it("sends correct cursor offset for multi-chunk Dropbox upload", async () => {
    const fileSize = CHUNK_SIZE + 512;
    const fileData = new Uint8Array(fileSize).fill(0x02);

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox",
        accessToken: "tok",
        parentFolderId: "",
        folderPath: "uploads",
        portalName: "My Portal",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session_id: "sess-multi" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))  // append chunk 1
      .mockResolvedValueOnce(                                      // finish chunk 2
        new Response(JSON.stringify({ id: "dbx-multi-id", name: "test.pdf" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer({
      fileSize,
      bucketData: { "staging/abc": fileData },
    });
    await transferPromise;

    // append call: cursor offset should be 0
    const appendCall = fetchMock.mock.calls[2];
    const appendArg = JSON.parse(appendCall[1].headers["Dropbox-API-Arg"]);
    expect(appendArg.cursor.offset).toBe(0);
    expect(appendArg.cursor.session_id).toBe("sess-multi");

    // finish call: cursor offset should be CHUNK_SIZE
    const finishCall = fetchMock.mock.calls[3];
    const finishArg = JSON.parse(finishCall[1].headers["Dropbox-API-Arg"]);
    expect(finishArg.cursor.offset).toBe(CHUNK_SIZE);
    expect(finishArg.commit.path).toContain("test.pdf");
  });

  it("R2 is deleted after successful transfer", async () => {
    const fileData = new Uint8Array(50).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();

    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize: 50 });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "fid" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize: 50,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    expect(env.R2_BUCKET.delete).toHaveBeenCalledWith("staging/abc");
  });

  it("callback still fires even when R2 delete throws", async () => {
    const fileData = new Uint8Array(50).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    (env.R2_BUCKET.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("R2 delete error"),
    );
    const ctx = makeCtx();

    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize: 50 });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "fid" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize: 50,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;

    // Callback should still have been called with completed status
    const callbackCall = fetchMock.mock.calls[3];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.status).toBe("completed");
  });

  it("includes workerSecret in every callback", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("error", { status: 500 })) // context fails
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));   // callback

    const { transferPromise } = await dispatchTransfer();
    await transferPromise;

    const callbackCall = fetchMock.mock.calls[1];
    const body = JSON.parse(callbackCall[1].body);
    expect(body.workerSecret).toBe("worker-secret-xyz");
  });

  it("Dropbox path has leading slash when folderPath has no leading slash", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox", accessToken: "tok",
        parentFolderId: "", folderPath: "no-leading-slash",
        portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session_id: "s1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "dbx-id", name: "test.pdf" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer({ fileSize: 50 });
    await transferPromise;

    const finishCall = fetchMock.mock.calls[2];
    const arg = JSON.parse(finishCall[1].headers["Dropbox-API-Arg"]);
    expect(arg.commit.path).toMatch(/^\/no-leading-slash\//);
  });

  it("Dropbox path does not double-slash when folderPath already has leading slash", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox", accessToken: "tok",
        parentFolderId: "", folderPath: "/already-slash",
        portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session_id: "s2" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "dbx-id2", name: "test.pdf" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const { transferPromise } = await dispatchTransfer({ fileSize: 50 });
    await transferPromise;

    const finishCall = fetchMock.mock.calls[2];
    const arg = JSON.parse(finishCall[1].headers["Dropbox-API-Arg"]);
    expect(arg.commit.path).not.toMatch(/\/\//);
    expect(arg.commit.path).toMatch(/^\/already-slash\//);
  });
});

// ── Additional edge cases ─────────────────────────────────────────────────────

describe("runTransfer — Drive upload edge cases", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function driveTransfer(fileSize: number, driveMocks: Response[]) {
    const fileData = new Uint8Array(fileSize).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }));

    for (const mock of driveMocks) fetchMock.mockResolvedValueOnce(mock);
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 })); // callback fallback

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    return fetchMock;
  }

  it("falls back to constructed Drive URL when webViewLink is absent", async () => {
    const mock = await driveTransfer(50, [
      new Response(JSON.stringify({ id: "no-link-id" }), { status: 200 }), // no webViewLink
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.storageUrl).toBe(
      "https://drive.google.com/file/d/no-link-id/view",
    );
  });

  it("uses webViewLink from Drive response when present", async () => {
    const mock = await driveTransfer(50, [
      new Response(JSON.stringify({
        id: "with-link-id",
        webViewLink: "https://drive.google.com/file/d/with-link-id/view?usp=drivesdk",
      }), { status: 200 }),
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.storageUrl).toBe(
      "https://drive.google.com/file/d/with-link-id/view?usp=drivesdk",
    );
  });

  it("posts failed callback when a mid-upload Drive chunk returns non-308 error", async () => {
    const fileSize = CHUNK_SIZE + 512;
    const mock = await driveTransfer(fileSize, [
      new Response("server error", { status: 500 }), // chunk 1 fails (not 308, not ok)
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.status).toBe("failed");
    expect(callbackBody.error).toMatch(/Drive chunk 1 failed: 500/);
  });

  it("posts failed callback when the final Drive chunk returns non-ok", async () => {
    const mock = await driveTransfer(50, [
      new Response("forbidden", { status: 403 }), // single chunk = final, fails
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.status).toBe("failed");
    expect(callbackBody.error).toMatch(/Drive final chunk failed: 403/);
  });

  it("sends Authorization Bearer header to Drive", async () => {
    await driveTransfer(50, [
      new Response(JSON.stringify({ id: "fid" }), { status: 200 }),
    ]);

    // call[0]=context, call[1]=drive init, call[2]=chunk PUT
    const initCall = fetchMock.mock.calls[1];
    expect(initCall[1].headers["Authorization"]).toBe("Bearer tok");
  });

  it("sends correct Content-Type to Drive init", async () => {
    await driveTransfer(50, [
      new Response(JSON.stringify({ id: "fid" }), { status: 200 }),
    ]);

    const initCall = fetchMock.mock.calls[1];
    expect(initCall[1].headers["Content-Type"]).toBe("application/json");
    expect(initCall[1].headers["X-Upload-Content-Type"]).toBe("application/pdf");
  });

  it("makes exactly 1 R2 range read for a single-chunk file", async () => {
    const fileData = new Uint8Array(50).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize: 50 });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "fid" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize: 50,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    // head() + 1 range get() = 2 calls total
    expect(env.R2_BUCKET.get).toHaveBeenCalledTimes(1);
    expect(env.R2_BUCKET.head).toHaveBeenCalledTimes(1);
  });

  it("makes exactly 2 R2 range reads for a two-chunk file", async () => {
    const fileSize = CHUNK_SIZE + 512;
    const fileData = new Uint8Array(fileSize).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response("", { status: 308 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "fid" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    expect(env.R2_BUCKET.get).toHaveBeenCalledTimes(2);
  });

  it("handles 1-byte file correctly (single chunk, correct Content-Range)", async () => {
    const mock = await driveTransfer(1, [
      new Response(JSON.stringify({ id: "tiny-id" }), { status: 200 }),
    ]);

    const chunkCall = fetchMock.mock.calls[2];
    expect(chunkCall[1].headers["Content-Range"]).toBe("bytes 0-0/1");
    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.status).toBe("completed");
  });
});

describe("runTransfer — Dropbox upload edge cases", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function dropboxTransfer(fileSize: number, folderPath: string, dropboxMocks: Response[]) {
    const fileData = new Uint8Array(fileSize).fill(0x02);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox", accessToken: "dbx-tok",
        parentFolderId: "", folderPath, portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session_id: "sess-abc" }), { status: 200 }),
      );

    for (const mock of dropboxMocks) fetchMock.mockResolvedValueOnce(mock);
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "report.pdf", fileSize,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    return fetchMock;
  }

  it("posts failed callback when Dropbox append returns non-ok", async () => {
    const fileSize = CHUNK_SIZE + 512;
    const mock = await dropboxTransfer(fileSize, "/uploads", [
      new Response("conflict", { status: 409 }), // append fails
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.status).toBe("failed");
    expect(callbackBody.error).toMatch(/Dropbox append 1 failed: 409/);
  });

  it("posts failed callback when Dropbox finish returns non-ok", async () => {
    const mock = await dropboxTransfer(50, "/uploads", [
      new Response("storage_full", { status: 507 }), // finish fails
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.status).toBe("failed");
    expect(callbackBody.error).toMatch(/Dropbox finish failed: 507/);
  });

  it("sends Authorization Bearer header to Dropbox session start", async () => {
    await dropboxTransfer(50, "/uploads", [
      new Response(JSON.stringify({ id: "dbx-id", name: "report.pdf" }), { status: 200 }),
    ]);

    // call[0]=context, call[1]=session start
    const startCall = fetchMock.mock.calls[1];
    expect(startCall[1].headers["Authorization"]).toBe("Bearer dbx-tok");
  });

  it("commit uses autorename: true", async () => {
    await dropboxTransfer(50, "/uploads", [
      new Response(JSON.stringify({ id: "dbx-id", name: "report.pdf" }), { status: 200 }),
    ]);

    const finishCall = fetchMock.mock.calls[2];
    const arg = JSON.parse(finishCall[1].headers["Dropbox-API-Arg"]);
    expect(arg.commit.autorename).toBe(true);
    expect(arg.commit.mode).toBe("add");
  });

  it("storageUrl is empty string for Dropbox (no public link)", async () => {
    const mock = await dropboxTransfer(50, "/uploads", [
      new Response(JSON.stringify({ id: "dbx-id", name: "report.pdf" }), { status: 200 }),
    ]);

    const callbackBody = JSON.parse(mock.mock.calls.at(-1)![1].body);
    expect(callbackBody.storageUrl).toBe("");
    expect(callbackBody.storageFileId).toBe("dbx-id");
  });

  it("makes exactly 2 R2 range reads for a two-chunk Dropbox upload", async () => {
    const fileSize = CHUNK_SIZE + 512;
    const fileData = new Uint8Array(fileSize).fill(0x02);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "dropbox", accessToken: "dbx-tok",
        parentFolderId: "", folderPath: "/uploads", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session_id: "s" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 })) // append
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "dbx-id", name: "report.pdf" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "report.pdf", fileSize,
        mimeType: "application/pdf",
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;
    expect(env.R2_BUCKET.get).toHaveBeenCalledTimes(2);
  });
});

describe("runTransfer — callback payload completeness", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completed callback contains all expected fields", async () => {
    const fileData = new Uint8Array(50).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({
      stagingKey: "staging/abc",
      fileSize: 50,
      uploaderName: "Jane Doe",
      uploaderEmail: "jane@example.com",
      uploaderNotes: "Q4 tax docs",
    });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "drive-id",
        webViewLink: "https://drive.google.com/file/d/drive-id/view",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded,
        stagingKey: "staging/abc",
        portalId: "portal-xyz",
        fileName: "taxes.pdf",
        fileSize: 50,
        mimeType: "application/pdf",
        uploaderName: "Jane Doe",
        uploaderEmail: "jane@example.com",
        uploaderNotes: "Q4 tax docs",
        uploadSessionId: "session-999",
        skipNotification: true,
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;

    const body = JSON.parse(fetchMock.mock.calls.at(-1)![1].body);
    expect(body.status).toBe("completed");
    expect(body.workerSecret).toBe("worker-secret-xyz");
    expect(body.stagingKey).toBe("staging/abc");
    expect(body.portalId).toBe("portal-xyz");
    expect(body.fileName).toBe("taxes.pdf");
    expect(body.fileSize).toBe(50);
    expect(body.mimeType).toBe("application/pdf");
    expect(body.storageFileId).toBe("drive-id");
    expect(body.provider).toBe("google");
    expect(body.uploaderName).toBe("Jane Doe");
    expect(body.uploaderEmail).toBe("jane@example.com");
    expect(body.uploaderNotes).toBe("Q4 tax docs");
    expect(body.uploadSessionId).toBe("session-999");
    expect(body.skipNotification).toBe(true);
  });

  it("skipNotification defaults to false when not provided", async () => {
    const fileData = new Uint8Array(50).fill(0x01);
    const env = makeEnv({ "staging/abc": fileData });
    const ctx = makeCtx();
    let transferPromise: Promise<void> | undefined;
    (ctx.waitUntil as ReturnType<typeof vi.fn>).mockImplementation((p: Promise<void>) => {
      transferPromise = p;
    });

    const encoded = await makeToken({ stagingKey: "staging/abc", fileSize: 50 });

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: "google", accessToken: "tok",
        parentFolderId: "fid", folderPath: "/up", portalName: "P",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", {
        status: 200, headers: { Location: "https://upload.googleapis.com/r/x" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "fid" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await worker.fetch(
      req("POST", "/transfer", {
        uploadToken: encoded, stagingKey: "staging/abc",
        portalId: "p", fileName: "test.pdf", fileSize: 50,
        mimeType: "application/pdf",
        // skipNotification intentionally omitted
        callbackUrl: "https://app.example.com/callback",
      }),
      env, ctx,
    );

    await transferPromise!;

    const body = JSON.parse(fetchMock.mock.calls.at(-1)![1].body);
    expect(body.skipNotification).toBe(false);
  });
});
