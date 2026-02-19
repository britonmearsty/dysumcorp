import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFileUploadNotification } from "@/lib/email-service";
import { hashPassword } from "@/lib/password-utils";
import {
  getRateLimit,
  uploadRateLimit,
  fallbackUploadLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// POST /api/portals/confirm-upload - Confirm direct upload and save metadata (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await getRateLimit(
      uploadRateLimit,
      fallbackUploadLimit,
      `confirm:${ip}`,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    const body = await request.json();
    const {
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageUrl,
      storageFileId,
      password,
      uploaderName,
      uploaderEmail,
    } = body;

    if (!portalId || !fileName || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: portalId, fileName, fileSize" },
        { status: 400 },
      );
    }

    // Verify portal exists and is active
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: { user: true },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json(
        { error: "Portal is not accepting uploads" },
        { status: 403 },
      );
    }

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim() !== "") {
      passwordHash = hashPassword(password.trim());
    }

    // Use storageFileId or storageUrl as the storage reference
    const fileStorageUrl = storageFileId || storageUrl || "";

    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        name: fileName,
        size: BigInt(fileSize),
        mimeType: mimeType || "application/octet-stream",
        storageUrl: fileStorageUrl,
        portalId: portalId,
        passwordHash,
        uploaderName: uploaderName || null,
        uploaderEmail: uploaderEmail || null,
      },
    });

    // Send email notification to portal owner
    try {
      await sendFileUploadNotification({
        userEmail: portal.user.email,
        portalName: portal.name,
        files: [
          {
            name: fileName,
            size: formatFileSize(Number(fileSize)),
          },
        ],
        uploaderName: uploaderName || undefined,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }

    return NextResponse.json({
      success: true,
      file: {
        ...file,
        size: file.size.toString(),
      },
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 },
    );
  }
}
