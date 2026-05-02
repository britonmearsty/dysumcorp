import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/lib/prisma";
import { applyUploadRateLimit, applyPasswordRateLimit } from "@/lib/rate-limit";
import { checkAccess, checkPortalTrialExpiration } from "@/lib/access";
import { verifyPasswordWithMigration } from "@/lib/password-utils";
import { generateUploadToken } from "@/lib/upload-tokens";
import {
  getPresignedPutUrl,
  createMultipartUpload,
  getPresignedPartUrl,
} from "@/lib/r2-client";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Files >= this size use multipart upload (must be > 5 MB, R2 minimum part size)
// Raised to 50 MB: single-shot is faster for 10-50 MB files (no multipart overhead)
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50 MB

/** Part size scales with file size - smaller parts = more parallelism.
 *  R2 supports up to 5 GB per part; minimum is 5 MB (except last part).
 *    < 200 MB  → 10 MB parts  (up to 20 parts) - faster parallelism
 *    < 500 MB  → 25 MB parts  (up to 20 parts)
 *    ≥ 500 MB  → 50 MB parts  (up to 60 parts for 3 GB)
 *    ≥ 2 GB    → 75 MB parts (up to 40 parts for 3 GB)
 */
function getPartSize(fileSizeBytes: number): number {
  if (fileSizeBytes >= 2 * 1024 * 1024 * 1024) return 75 * 1024 * 1024; // ≥ 2 GB → 75 MB
  if (fileSizeBytes >= 500 * 1024 * 1024) return 50 * 1024 * 1024; // ≥ 500 MB → 50 MB
  if (fileSizeBytes >= 200 * 1024 * 1024) return 25 * 1024 * 1024; // ≥ 200 MB → 25 MB

  return 10 * 1024 * 1024; // default → 10 MB for max parallelism
}

/** Compute presigned URL expiry based on file size.
 *  Larger files need more time for upload + transfer.
 *    < 500 MB → 15 minutes (900s)
 *    ≥ 500 MB → 30 minutes (1800s)
 *    ≥ 1 GB   → 60 minutes (3600s)
 */
function getPresignedUrlExpiry(fileSizeBytes: number): number {
  if (fileSizeBytes >= 1024 * 1024 * 1024) return 3600; // ≥ 1 GB → 60 min
  if (fileSizeBytes >= 500 * 1024 * 1024) return 1800; // ≥ 500 MB → 30 min

  return 900; // default → 15 min
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);

  logger.log(`[r2-presign:${requestId}] POST /api/portals/r2-presign`);

  try {
    const rateLimitResult = await applyUploadRateLimit(request);

    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const {
      portalId,
      fileName,
      fileSize,
      mimeType,
      uploaderName,
      uploaderEmail,
      uploaderNotes,
      password,
    } = body;

    if (!portalId || !fileName || fileSize == null || !mimeType) {
      return NextResponse.json(
        { error: "portalId, fileName, fileSize, and mimeType are required" },
        { status: 400 },
      );
    }

    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        isActive: true,
        password: true,
        maxFileSize: true,
        allowedFileTypes: true,
        user: { select: { email: true } },
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json(
        { error: "This portal is not accepting uploads" },
        { status: 403 },
      );
    }

    if (portal.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 },
        );
      }
      // Rate-limit password attempts per portal — keyed on portalId so IP rotation doesn't help
      const pwRateLimit = await applyPasswordRateLimit(portal.id);

      if (pwRateLimit) return pwRateLimit;

      const { valid } = await verifyPasswordWithMigration(
        password,
        portal.password,
      );

      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 },
        );
      }
    }

    if (portal.allowedFileTypes.length > 0) {
      const allowed = portal.allowedFileTypes.map((t) =>
        t.toLowerCase().trim(),
      );
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      const mime = mimeType.toLowerCase();
      const extToCategory: Record<string, string> = {
        // Audio
        mp3: "audio",
        wav: "audio",
        ogg: "audio",
        flac: "audio",
        aac: "audio",
        m4a: "audio",
        wma: "audio",
        opus: "audio",
        // Video
        mp4: "video",
        mov: "video",
        avi: "video",
        mkv: "video",
        webm: "video",
        wmv: "video",
        flv: "video",
        m4v: "video",
        // Image
        jpg: "image",
        jpeg: "image",
        png: "image",
        gif: "image",
        webp: "image",
        svg: "image",
        bmp: "image",
        ico: "image",
        tiff: "image",
        // Archive - map to actual MIME types for compatibility with allowed list
        zip: "application/zip",
        rar: "application/x-rar-compressed",
        "7z": "application/x-7z-compressed",
        tar: "application/x-tar",
        gz: "application/gzip",
        bz2: "application/x-bzip2",
        xz: "application/x-xz",
        // Documents
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
      };
      const typeAllowed = allowed.some((t) => {
        const allowedType = t.toLowerCase();

        // Exact match with MIME type
        if (allowedType === mime) return true;

        // Exact match with extension (with or without dot)
        if (allowedType === `.${ext}` || allowedType === ext) return true;

        // Handle wildcard MIME types (image/*, video/*, audio/*, text/*, archive/*)
        if (allowedType.endsWith("/*")) {
          const base = allowedType.replace("/*", "");

          if (mime.startsWith(base)) return true;
          if (mime === "application/octet-stream" || !mime)
            return extToCategory[ext] === base;
        }

        // Check if extension maps to a specific MIME type that matches allowed type
        const mappedMime = extToCategory[ext];
        if (mappedMime) {
          // Check for exact match
          if (mappedMime === allowedType) return true;
          // Check if mapped MIME starts with allowed type (e.g., "application/zip" matches "application/*")
          if (
            allowedType.includes("/") &&
            mappedMime.startsWith(allowedType.replace(/\/.*$/, "/"))
          )
            return true;
        }

        return false;
      });

      if (!typeAllowed) {
        return NextResponse.json(
          { error: `File type not allowed. Allowed: ${allowed.join(", ")}` },
          { status: 400 },
        );
      }
    }

    if (BigInt(fileSize) > portal.maxFileSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${portal.maxFileSize} bytes`,
          maxFileSize: portal.maxFileSize.toString(),
        },
        { status: 400 },
      );
    }

    // REVERSIBILITY: Remove this trial check to revert
    // Check access - allow trial users if valid
    const access = await checkAccess(portal.userId);

    if (!access.allowed) {
      // Check if user is on free trial
      const user = await prisma.user.findUnique({
        where: { id: portal.userId },
        select: {
          subscriptionPlan: true,
          hasCreatedTrialPortal: true,
        },
      });

      if (user?.subscriptionPlan === "free" && user?.hasCreatedTrialPortal) {
        // Check trial expiration
        const trialCheck = await checkPortalTrialExpiration(portal.id);

        if (trialCheck.isExpired) {
          return NextResponse.json(
            {
              error: "Trial expired. Upgrade to Pro to receive more files.",
              code: "TRIAL_EXPIRED",
            },
            { status: 403 },
          );
        }

        // Check file count (max 10 for trial)
        const fileCount = await prisma.file.count({
          where: { portalId: portal.id },
        });

        if (fileCount >= 10) {
          return NextResponse.json(
            {
              error: "File limit reached (10/10). Upgrade to Pro for unlimited uploads.",
              code: "TRIAL_FILE_LIMIT_REACHED",
            },
            { status: 403 },
          );
        }
        // Trial is valid, allow upload
      } else {
        // Not a trial user, block upload
        return NextResponse.json(
          {
            error: "This portal is not currently accepting uploads",
            code: "PORTAL_UNAVAILABLE",
          },
          { status: 402 },
        );
      }
    }

    const stagingKey = `staging/${portalId}/${uuidv4()}/${fileName}`;
    const workerUrl = process.env.WORKER_URL ?? "";
    const expiresAt = Date.now() + 15 * 60 * 1000;

    const uploadToken = generateUploadToken({
      portalId,
      fileName,
      fileSize,
      mimeType,
      uploaderEmail: uploaderEmail ?? "",
      uploaderName: uploaderName ?? "",
      uploaderNotes,
      stagingKey,
    });

    await prisma.r2StagingUpload.create({
      data: {
        stagingKey,
        portalId,
        fileSize: BigInt(fileSize),
        status: "PENDING",
        uploaderName: uploaderName ?? null,
        uploaderEmail: uploaderEmail ?? null,
        attempts: 0,
      },
    });

    // ── Single-shot upload for small files ────────────────────────────────────
    if (fileSize < MULTIPART_THRESHOLD) {
      const urlExpiry = getPresignedUrlExpiry(fileSize);
      logger.log(
        `[r2-presign:${requestId}] Single-shot upload: ${fileSize} bytes, urlExpiry=${urlExpiry}s`,
      );
      const presignedUrl = await getPresignedPutUrl(
        stagingKey,
        mimeType,
        urlExpiry,
        fileSize,
      );

      return NextResponse.json({
        uploadType: "single",
        presignedUrl,
        uploadToken,
        stagingKey,
        workerUrl,
        expiresAt,
      });
    }

    // ── Multipart upload for large files ──────────────────────────────────────
    const PART_SIZE = getPartSize(fileSize);
    const partCount = Math.ceil(fileSize / PART_SIZE);
    const urlExpiry = getPresignedUrlExpiry(fileSize);

    logger.log(
      `[r2-presign:${requestId}] Multipart upload: ${fileSize} bytes → ${partCount} parts × ${PART_SIZE / 1024 / 1024} MB, urlExpiry=${urlExpiry}s`,
    );

    const uploadId = await createMultipartUpload(stagingKey, mimeType);

    // Generate all part URLs in parallel — Vercel handles this fast, it's just signing
    const partUrls = await Promise.all(
      Array.from({ length: partCount }, (_, i) =>
        getPresignedPartUrl(stagingKey, uploadId, i + 1, urlExpiry),
      ),
    );

    logger.log(
      `[r2-presign:${requestId}] ✓ ${partCount} part URLs generated, uploadId: ${uploadId}`,
    );

    return NextResponse.json({
      uploadType: "multipart",
      uploadId,
      partUrls, // array indexed 0..N-1, partNumber = index + 1
      partSize: PART_SIZE,
      partCount,
      uploadToken,
      stagingKey,
      workerUrl,
      expiresAt,
    });
  } catch (error) {
    logger.error(`[r2-presign:${requestId}] ❌ UNCAUGHT ERROR:`, error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
