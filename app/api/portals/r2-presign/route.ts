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

    // Password check
    if (portal.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 },
        );
      }
      const valid = await verifyPassword(portal.password, password);
      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 },
        );
      }
    }

    // File type validation
    if (portal.allowedFileTypes.length > 0) {
      const allowed = portal.allowedFileTypes.map((t) => t.toLowerCase().trim());
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
      const mime = mimeType.toLowerCase();

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
        return NextResponse.json(
          { error: `File type not allowed. Allowed: ${allowed.join(", ")}` },
          { status: 400 },
        );
      }
    }

    // File size validation
    if (BigInt(fileSize) > portal.maxFileSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${portal.maxFileSize} bytes`,
          maxFileSize: portal.maxFileSize.toString(),
        },
        { status: 400 },
      );
    }

    // Subscription / trial gate
    const access = await checkAccess(portal.userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: "Trial expired. Subscribe to continue.", code: "TRIAL_EXPIRED" },
        { status: 402 },
      );
    }

    // Build staging key and presigned URL
    const stagingKey = `staging/${portalId}/${uuidv4()}/${fileName}`;
    const presignedUrl = await getPresignedPutUrl(stagingKey, mimeType, 900);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

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

    const workerUrl = process.env.WORKER_URL ?? "";

    return NextResponse.json({
      presignedUrl,
      uploadToken,
      stagingKey,
      workerUrl,
      expiresAt,
    });
  } catch (error) {
    console.error("[r2-presign] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
