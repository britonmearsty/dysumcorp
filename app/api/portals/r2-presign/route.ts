import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { checkAccess } from "@/lib/trial";
import { verifyPassword } from "@/lib/password-utils";
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
const PART_SIZE = 25 * 1024 * 1024; // 25 MB per part

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
      return NextResponse.json({ error: "This portal is not accepting uploads" }, { status: 403 });
    }

    if (portal.password) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 });
      }
      const valid = await verifyPassword(portal.password, password);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
    }

    if (portal.allowedFileTypes.length > 0) {
      const allowed = portal.allowedFileTypes.map((t) => t.toLowerCase().trim());
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      const mime = mimeType.toLowerCase();
      const extToCategory: Record<string, string> = {
        mp3: "audio", wav: "audio", ogg: "audio", flac: "audio", aac: "audio", m4a: "audio", wma: "audio", opus: "audio",
        mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video", wmv: "video", flv: "video", m4v: "video",
        jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", svg: "image", bmp: "image",
      };
      const typeAllowed = allowed.some((t) => {
        if (t === mime) return true;
        if (t === `.${ext}` || t === ext) return true;
        if (t.endsWith("/*")) {
          const base = t.replace("/*", "");
          if (mime.startsWith(base)) return true;
          if (mime === "application/octet-stream" || !mime) return extToCategory[ext] === base;
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
        { error: `File too large. Maximum size is ${portal.maxFileSize} bytes`, maxFileSize: portal.maxFileSize.toString() },
        { status: 400 },
      );
    }

    const access = await checkAccess(portal.userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: "Trial expired. Subscribe to continue.", code: "TRIAL_EXPIRED" },
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
        status: "pending",
        uploaderName: uploaderName ?? null,
        uploaderEmail: uploaderEmail ?? null,
      },
    });

    // ── Single-shot upload for small files ────────────────────────────────────
    if (fileSize < MULTIPART_THRESHOLD) {
      console.log(`[r2-presign:${requestId}] Single-shot upload: ${fileSize} bytes`);
      const presignedUrl = await getPresignedPutUrl(stagingKey, mimeType, 900);
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
    const partCount = Math.ceil(fileSize / PART_SIZE);
    console.log(`[r2-presign:${requestId}] Multipart upload: ${fileSize} bytes → ${partCount} parts × ${PART_SIZE / 1024 / 1024} MB`);

    const uploadId = await createMultipartUpload(stagingKey, mimeType);

    // Generate all part URLs in parallel — Vercel handles this fast, it's just signing
    const partUrls = await Promise.all(
      Array.from({ length: partCount }, (_, i) =>
        getPresignedPartUrl(stagingKey, uploadId, i + 1, 900),
      ),
    );

    console.log(`[r2-presign:${requestId}] ✓ ${partCount} part URLs generated, uploadId: ${uploadId}`);

    return NextResponse.json({
      uploadType: "multipart",
      uploadId,
      partUrls,   // array indexed 0..N-1, partNumber = index + 1
      partSize: PART_SIZE,
      partCount,
      uploadToken,
      stagingKey,
      workerUrl,
      expiresAt,
    });
  } catch (error) {
    console.error(`[r2-presign:${requestId}] ❌ UNCAUGHT ERROR:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
