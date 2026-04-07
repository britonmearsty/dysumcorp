import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/lib/prisma";
import { applyUploadRateLimit, applyPasswordRateLimit } from "@/lib/rate-limit";
import { checkAccess } from "@/lib/trial";
import { verifyPasswordWithMigration } from "@/lib/password-utils";
import { generateUploadToken } from "@/lib/upload-tokens";
import {
  getPresignedPutUrl,
  createMultipartUpload,
  getPresignedPartUrl,
} from "@/lib/r2-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Files >= this size use multipart upload (must be > 5 MB, R2 minimum part size)
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10 MB

/** Part size scales with file size to reduce part count and TCP slow-start overhead.
 *  R2 supports up to 5 GB per part; minimum is 5 MB (except last part).
 *    < 500 MB  → 25 MB parts  (up to 20 parts)
 *    ≥ 500 MB  → 50 MB parts  (up to 60 parts for 3 GB)
 *    ≥ 2 GB    → 100 MB parts (up to 30 parts for 3 GB)
 */
function getPartSize(fileSizeBytes: number): number {
  if (fileSizeBytes >= 2 * 1024 * 1024 * 1024) return 100 * 1024 * 1024; // ≥ 2 GB → 100 MB
  if (fileSizeBytes >= 500 * 1024 * 1024) return 50 * 1024 * 1024; // ≥ 500 MB → 50 MB

  return 25 * 1024 * 1024; // default → 25 MB
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);

  console.log(`[r2-presign:${requestId}] POST /api/portals/r2-presign`);

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
        // Archive
        zip: "archive",
        rar: "archive",
        "7z": "archive",
        tar: "archive",
        gz: "archive",
        bz2: "archive",
        xz: "archive",
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
        if (mappedMime && mappedMime === allowedType) return true;

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

    const access = await checkAccess(portal.userId);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: "This portal is not currently accepting uploads",
          code: "PORTAL_UNAVAILABLE",
        },
        { status: 402 },
      );
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
      console.log(
        `[r2-presign:${requestId}] Single-shot upload: ${fileSize} bytes`,
      );
      const presignedUrl = await getPresignedPutUrl(
        stagingKey,
        mimeType,
        900,
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

    console.log(
      `[r2-presign:${requestId}] Multipart upload: ${fileSize} bytes → ${partCount} parts × ${PART_SIZE / 1024 / 1024} MB`,
    );

    const uploadId = await createMultipartUpload(stagingKey, mimeType);

    // Generate all part URLs in parallel — Vercel handles this fast, it's just signing
    const partUrls = await Promise.all(
      Array.from({ length: partCount }, (_, i) =>
        getPresignedPartUrl(stagingKey, uploadId, i + 1, 900),
      ),
    );

    console.log(
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
    console.error(`[r2-presign:${requestId}] ❌ UNCAUGHT ERROR:`, error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
