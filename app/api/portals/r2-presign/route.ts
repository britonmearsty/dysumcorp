import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { checkAccess } from "@/lib/trial";
import { verifyPassword } from "@/lib/password-utils";
import { generateUploadToken } from "@/lib/upload-tokens";
import { getPresignedPutUrl } from "@/lib/r2-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);
  console.log(`[r2-presign:${requestId}] ═══════════════════════════════════════════════════════`);
  console.log(`[r2-presign:${requestId}] POST /api/portals/r2-presign`);

  try {
    console.log(`[r2-presign:${requestId}] Applying rate limit...`);
    const rateLimitResult = await applyUploadRateLimit(request);
    if (rateLimitResult) {
      console.warn(`[r2-presign:${requestId}] ⚠️ Rate limit exceeded`);
      return rateLimitResult;
    }
    console.log(`[r2-presign:${requestId}] ✓ Rate limit passed`);

    const body = await request.json();
    console.log(`[r2-presign:${requestId}] Request body:`, JSON.stringify(body, null, 2));

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
      console.error(`[r2-presign:${requestId}] ❌ Missing required fields`);
      return NextResponse.json(
        { error: "portalId, fileName, fileSize, and mimeType are required" },
        { status: 400 },
      );
    }
    console.log(`[r2-presign:${requestId}] ✓ Required fields present`);

    console.log(`[r2-presign:${requestId}] Fetching portal: ${portalId}`);

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
      console.error(`[r2-presign:${requestId}] ❌ Portal not found: ${portalId}`);
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }
    console.log(`[r2-presign:${requestId}] ✓ Portal found: "${portal.name}" (${portal.slug})`);
    console.log(`[r2-presign:${requestId}] Portal isActive: ${portal.isActive}`);
    console.log(`[r2-presign:${requestId}] Portal has password: ${!!portal.password}`);
    console.log(`[r2-presign:${requestId}] Portal maxFileSize: ${portal.maxFileSize}`);
    console.log(`[r2-presign:${requestId}] Portal allowedFileTypes:`, portal.allowedFileTypes);

    if (!portal.isActive) {
      console.error(`[r2-presign:${requestId}] ❌ Portal is not active`);
      return NextResponse.json(
        { error: "This portal is not accepting uploads" },
        { status: 403 },
      );
    }
    console.log(`[r2-presign:${requestId}] ✓ Portal is active`);

    // Password check
    if (portal.password) {
      console.log(`[r2-presign:${requestId}] Portal requires password, checking...`);
      if (!password) {
        console.error(`[r2-presign:${requestId}] ❌ Password required but not provided`);
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 },
        );
      }
      const valid = await verifyPassword(portal.password, password);
      if (!valid) {
        console.error(`[r2-presign:${requestId}] ❌ Password verification failed`);
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 },
        );
      }
      console.log(`[r2-presign:${requestId}] ✓ Password verified`);
    }

    // File type validation
    if (portal.allowedFileTypes.length > 0) {
      console.log(`[r2-presign:${requestId}] Validating file type...`);
      const allowed = portal.allowedFileTypes.map((t) => t.toLowerCase().trim());
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      const mime = mimeType.toLowerCase();
      console.log(`[r2-presign:${requestId}] File extension: "${ext}", MIME: "${mime}"`);
      console.log(`[r2-presign:${requestId}] Allowed types:`, allowed);

      // Extension → MIME category fallback for when browser sends application/octet-stream
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
          // fallback: check extension category when mime is generic
          if (mime === "application/octet-stream" || !mime) {
            return extToCategory[ext] === base;
          }
        }
        return false;
      });

      if (!typeAllowed) {
        console.error(`[r2-presign:${requestId}] ❌ File type not allowed`);
        return NextResponse.json(
          { error: `File type not allowed. Allowed: ${allowed.join(", ")}` },
          { status: 400 },
        );
      }
      console.log(`[r2-presign:${requestId}] ✓ File type allowed`);
    }

    // File size validation
    console.log(`[r2-presign:${requestId}] Validating file size: ${fileSize} vs max ${portal.maxFileSize}`);
    if (BigInt(fileSize) > portal.maxFileSize) {
      console.error(`[r2-presign:${requestId}] ❌ File too large: ${fileSize} > ${portal.maxFileSize}`);
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${portal.maxFileSize} bytes`,
          maxFileSize: portal.maxFileSize.toString(),
        },
        { status: 400 },
      );
    }
    console.log(`[r2-presign:${requestId}] ✓ File size within limit`);

    // Subscription / trial gate
    console.log(`[r2-presign:${requestId}] Checking access for userId: ${portal.userId}`);
    const access = await checkAccess(portal.userId);
    console.log(`[r2-presign:${requestId}] Access check result:`, access);
    if (!access.allowed) {
      console.error(`[r2-presign:${requestId}] ❌ Access denied (trial expired)`);
      return NextResponse.json(
        { error: "Trial expired. Subscribe to continue.", code: "TRIAL_EXPIRED" },
        { status: 402 },
      );
    }
    console.log(`[r2-presign:${requestId}] ✓ Access granted`);

    // Build staging key and presigned URL
    const stagingKey = `staging/${portalId}/${uuidv4()}/${fileName}`;
    console.log(`[r2-presign:${requestId}] Generated stagingKey: ${stagingKey}`);

    console.log(`[r2-presign:${requestId}] Generating presigned PUT URL (900s TTL)...`);
    const presignedUrl = await getPresignedPutUrl(stagingKey, mimeType, 900);
    console.log(`[r2-presign:${requestId}] ✓ Presigned URL generated (length: ${presignedUrl.length})`);

    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

    console.log(`[r2-presign:${requestId}] Generating upload token...`);
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
    console.log(`[r2-presign:${requestId}] ✓ Upload token generated (length: ${uploadToken.length})`);

    console.log(`[r2-presign:${requestId}] Creating R2StagingUpload record...`);
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
    console.log(`[r2-presign:${requestId}] ✓ R2StagingUpload record created`);

    const workerUrl = process.env.WORKER_URL ?? "";
    console.log(`[r2-presign:${requestId}] WORKER_URL: ${workerUrl}`);

    console.log(`[r2-presign:${requestId}] ✓✓✓ SUCCESS - Returning presign response`);
    console.log(`[r2-presign:${requestId}] ═══════════════════════════════════════════════════════`);

    return NextResponse.json({
      presignedUrl,
      uploadToken,
      stagingKey,
      workerUrl,
      expiresAt,
    });
  } catch (error) {
    console.error(`[r2-presign:${requestId}] ❌❌❌ UNCAUGHT ERROR:`, error);
    console.error(`[r2-presign:${requestId}] Error stack:`, error instanceof Error ? error.stack : "N/A");
    console.error(`[r2-presign:${requestId}] ═══════════════════════════════════════════════════════`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
