import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password-utils";
import { checkStorageLimit, getUserPlanType } from "@/lib/plan-limits";
import { validateUploadToken } from "@/lib/upload-tokens";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// POST /api/portals/confirm-upload - Confirm file upload and save metadata
// This endpoint doesn't require authentication - it's for public portal uploads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageUrl,
      storageFileId,
      provider,
      uploaderName,
      uploaderEmail,
      uploaderNotes,
      password,
      uploadToken, // New: security token
      uploadSessionId, // New: to group files from same upload
    } = body;

    console.log("[Portal Confirm Upload] Request:", {
      portalId,
      fileName,
      fileSize,
      provider,
      uploaderName,
      uploaderEmail,
      uploaderNotes: uploaderNotes ? "provided" : "not provided",
      hasToken: !!uploadToken,
    });

    // Validate upload token if provided (new direct upload method)
    if (uploadToken) {
      const tokenData = validateUploadToken(uploadToken);

      if (!tokenData) {
        console.error("[Portal Confirm Upload] Invalid or expired upload token");
        return NextResponse.json(
          { error: "Invalid or expired upload token" },
          { status: 401 },
        );
      }

      // Verify token data matches request
      if (
        tokenData.portalId !== portalId ||
        tokenData.fileName !== fileName ||
        tokenData.fileSize !== fileSize
      ) {
        console.error("[Portal Confirm Upload] Token data mismatch");
        return NextResponse.json(
          { error: "Upload token does not match file data" },
          { status: 400 },
        );
      }

      console.log("[Portal Confirm Upload] Upload token validated successfully");
    }

    if (!portalId || !fileName || !fileSize || !storageFileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ensure storageUrl is at least an empty string
    const finalStorageUrl = storageUrl || "";

    // Verify portal exists and get owner info
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: {
        user: true,
      },
    });

    if (!portal) {
      console.log("[Portal Confirm Upload] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check storage limit before saving file
    const planType = await getUserPlanType(portal.userId);
    const storageCheck = await checkStorageLimit(
      portal.userId,
      planType,
      Number(fileSize),
    );

    if (!storageCheck.allowed) {
      console.log("[Portal Confirm Upload] Storage limit exceeded:", {
        current: storageCheck.current,
        limit: storageCheck.limit,
      });

      return NextResponse.json(
        {
          error: storageCheck.reason || "Storage limit exceeded",
          upgrade: true,
        },
        { status: 403 },
      );
    }

    // Hash password if provided
    let passwordHash: string | null = null;

    if (password && password.trim() !== "") {
      passwordHash = await hashPassword(password.trim());
    }

    // Create or get upload session
    let sessionId = uploadSessionId;
    if (!sessionId) {
      // Create new upload session
      console.log("[Portal Confirm Upload] No sessionId provided, creating new session");
      const session = await prisma.uploadSession.create({
        data: {
          portalId,
          uploaderName: uploaderName || null,
          uploaderEmail: uploaderEmail || null,
          uploaderNotes: uploaderNotes || null,
          fileCount: 0,
          totalSize: BigInt(0),
        },
      });
      sessionId = session.id;
      console.log("[Portal Confirm Upload] Created new upload session:", sessionId);
    } else {
      console.log("[Portal Confirm Upload] Using provided sessionId:", sessionId);
    }

    // Save file metadata to database
    console.log("[Portal Confirm Upload] Saving file metadata to database...");
    const file = await prisma.file.create({
      data: {
        name: fileName,
        size: BigInt(fileSize),
        mimeType: mimeType || "application/octet-stream",
        storageUrl: finalStorageUrl,
        storageFileId: storageFileId || null,
        portalId: portalId,
        uploadSessionId: sessionId,
        passwordHash,
        uploaderName: uploaderName || null,
        uploaderEmail: uploaderEmail || null,
      },
    });

    // Update upload session stats
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        fileCount: { increment: 1 },
        totalSize: { increment: BigInt(fileSize) },
      },
    });

    console.log("[Portal Confirm Upload] File metadata saved:", file.id);

    return NextResponse.json({
      success: true,
      file: {
        ...file,
        size: file.size.toString(), // Convert BigInt to string for JSON
      },
      uploadSessionId: sessionId, // Return session ID for subsequent files
      provider,
    });
  } catch (error) {
    console.error("[Portal Confirm Upload] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to confirm upload";

    return NextResponse.json(
      {
        error: "Failed to confirm upload",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
