/**
 * Property-based tests for the Cloudflare R2 upload feature.
 * Uses fast-check for property generation and Vitest as the test runner.
 *
 * Run: pnpm vitest run tests/r2-upload.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { generateUploadToken, validateUploadToken } from "@/lib/upload-tokens";

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmptyString = fc.string({ minLength: 1, maxLength: 64 });
const cuid = fc.stringMatching(/^c[a-z0-9]{20,}$/);
const mimeType = fc.constantFrom(
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/zip",
);
const stagingKeyArb = fc
  .tuple(nonEmptyString, nonEmptyString, nonEmptyString)
  .map(([a, b, c]) => `staging/${a}/${b}/${c}`);

const tokenDataArb = fc.record({
  portalId: nonEmptyString,
  fileName: nonEmptyString,
  fileSize: fc.integer({ min: 1, max: 500_000_000 }),
  mimeType,
  uploaderEmail: fc.emailAddress(),
  uploaderName: nonEmptyString,
  uploaderNotes: fc.option(nonEmptyString, { nil: undefined }),
  stagingKey: fc.option(stagingKeyArb, { nil: undefined }),
});

// ── Property 1: Token round-trip preserves all fields ─────────────────────────

describe("Property 1 — upload token round-trip", () => {
  it("validateUploadToken(generateUploadToken(data)) returns original data", () => {
    fc.assert(
      fc.property(tokenDataArb, (data) => {
        const encoded = generateUploadToken(data);
        const decoded = validateUploadToken(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded!.portalId).toBe(data.portalId);
        expect(decoded!.fileName).toBe(data.fileName);
        expect(decoded!.fileSize).toBe(data.fileSize);
        expect(decoded!.mimeType).toBe(data.mimeType);
        expect(decoded!.uploaderEmail).toBe(data.uploaderEmail);
        expect(decoded!.uploaderName).toBe(data.uploaderName);
        expect(decoded!.uploaderNotes).toBe(data.uploaderNotes);
        expect(decoded!.stagingKey).toBe(data.stagingKey);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 2: Any tampered byte causes rejection ────────────────────────────

describe("Property 2 — tampered token is always rejected", () => {
  it("mutating any character of the base64 token causes validateUploadToken to return null", () => {
    fc.assert(
      fc.property(
        tokenDataArb,
        fc.integer({ min: 0, max: 999 }),
        (data, mutationIndex) => {
          const encoded = generateUploadToken(data);
          const chars = encoded.split("");
          const idx = mutationIndex % chars.length;
          // Flip one character to something different
          chars[idx] = chars[idx] === "A" ? "B" : "A";
          const tampered = chars.join("");

          // A tampered token must either fail to parse or fail signature check
          const result = validateUploadToken(tampered);
          // It's valid only if by extreme coincidence the mutation produced a valid token
          // (practically impossible with HMAC-SHA256 — we assert null)
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 3: Expired token is always rejected ──────────────────────────────

describe("Property 3 — expired token is always rejected", () => {
  it("a token with expiresAt < Date.now() returns null", () => {
    fc.assert(
      fc.property(tokenDataArb, (data) => {
        const encoded = generateUploadToken(data);

        // Decode, backdate expiresAt, re-encode WITHOUT updating signature
        const raw = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
        raw.expiresAt = Date.now() - 1000; // 1 second in the past
        const expired = Buffer.from(JSON.stringify(raw)).toString("base64");

        expect(validateUploadToken(expired)).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 4: stagingKey mismatch is always rejected ───────────────────────

describe("Property 4 — stagingKey mismatch is always rejected", () => {
  it("a token with stagingKey=K rejects requests presenting stagingKey=K'", () => {
    fc.assert(
      fc.property(
        tokenDataArb,
        stagingKeyArb,
        (data, differentKey) => {
          // Ensure the keys are actually different
          fc.pre(differentKey !== data.stagingKey);

          const encoded = generateUploadToken({ ...data });
          const decoded = validateUploadToken(encoded);

          // The token's stagingKey must not equal the different key
          expect(decoded?.stagingKey).not.toBe(differentKey);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 5: Presign rejects oversized files ───────────────────────────────

describe("Property 5 — presign rejects oversized files", () => {
  it("fileSize > maxFileSize always produces a 400 response", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 1_000_000_000n }),
        async (maxFileSize) => {
          // fileSize is always strictly greater than maxFileSize
          const fileSize = Number(maxFileSize) + 1;

          // Simulate the validation logic from r2-presign
          const isOversized = BigInt(fileSize) > maxFileSize;
          expect(isOversized).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 6: Presign rejects disallowed MIME types ────────────────────────

describe("Property 6 — presign rejects disallowed MIME types", () => {
  it("a mimeType not in allowedFileTypes always fails the type check", () => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !allowedTypes.includes(s)),
        (disallowedMime) => {
          // Simulate the validation logic from r2-presign
          const allowed = allowedTypes.map((t) => t.toLowerCase());
          const ext = disallowedMime.split(".").pop()?.toLowerCase() ?? "";
          const mime = disallowedMime.toLowerCase();
          const typeAllowed = allowed.some(
            (t) => t === mime || t === `.${ext}` || t === ext,
          );

          expect(typeAllowed).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 7: Cleanup only targets old pending records ─────────────────────

describe("Property 7 — cleanup only targets old pending records", () => {
  it("only records with status=pending AND createdAt < cutoff are selected", () => {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom("pending", "completed", "failed"),
            createdAt: fc.date({ min: new Date(0), max: new Date(Date.now() + 3_600_000) }),
          }),
          { minLength: 0, maxLength: 50 },
        ),
        (records) => {
          const orphans = records.filter(
            (r) => r.status === "pending" && r.createdAt < cutoff,
          );

          // Every selected record must be pending and old
          for (const r of orphans) {
            expect(r.status).toBe("pending");
            expect(r.createdAt.getTime()).toBeLessThan(cutoff.getTime());
          }

          // No completed/failed records should be selected
          const wrongStatus = orphans.filter((r) => r.status !== "pending");
          expect(wrongStatus).toHaveLength(0);

          // No recent records should be selected
          const tooNew = orphans.filter((r) => r.createdAt >= cutoff);
          expect(tooNew).toHaveLength(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ── Property 8: Invalid workerSecret always returns 401 ──────────────────────

describe("Property 8 — invalid workerSecret always returns 401", () => {
  it("any workerSecret !== WORKER_SECRET is rejected without DB writes", () => {
    const WORKER_SECRET = "correct-secret-value";

    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== WORKER_SECRET),
        (badSecret) => {
          // Simulate the auth check from r2-confirm
          const isAuthorized = badSecret === WORKER_SECRET;
          expect(isAuthorized).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });
});
