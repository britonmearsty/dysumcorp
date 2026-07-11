import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password-utils";
import { validateUploadToken } from "@/lib/upload-tokens";
import { maybeDeactivateFreePortalAtFileLimit } from "@/lib/access";
import { logger } from "@/lib/logger";
import { getPostHogClient } from "@/lib/posthog-server";

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
      checklistItemId,
      password,
      uploadToken, // New: security token
      uploadSessionId, // New: to group files from same upload
    } = body;

    logger.log("[Portal Confirm Upload] Request:", {
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
    let validatedToken: ReturnType<typeof validateUploadToken> = null;
    if (uploadToken) {
      validatedToken = validateUploadToken(uploadToken);

      if (!validatedToken) {
        logger.error(
          "[Portal Confirm Upload] Invalid or expired upload token",
        );

        return NextResponse.json(
          { error: "Invalid or expired upload token" },
          { status: 401 },
        );
      }

      // Verify token data matches request
      if (
        validatedToken.portalId !== portalId ||
        validatedToken.fileName !== fileName ||
        validatedToken.fileSize !== fileSize
      ) {
        logger.error("[Portal Confirm Upload] Token data mismatch");

        return NextResponse.json(
          { error: "Upload token does not match file data" },
          { status: 400 },
        );
      }

      logger.log(
        "[Portal Confirm Upload] Upload token validated successfully",
      );
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
      logger.log("[Portal Confirm Upload] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
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
      logger.log(
        "[Portal Confirm Upload] No sessionId provided, creating new session",
      );
      const [session] = await prisma.$transaction([
        prisma.uploadSession.create({
          data: {
            portalId,
          uploaderName: uploaderName || null,
          uploaderEmail: uploaderEmail || null,
          uploaderNotes: uploaderNotes || null,
          checklistItemId: checklistItemId ?? null,
          fileCount: 0,
          totalSize: BigInt(0),
          },
        }),
        prisma.portal.update({
          where: { id: portalId },
          data: { uploadCount: { increment: 1 } },
        }),
      ]);

      sessionId = session.id;
      logger.log(
        "[Portal Confirm Upload] Created new upload session:",
        sessionId,
      );
    } else {
      logger.log(
        "[Portal Confirm Upload] Using provided sessionId:",
        sessionId,
      );
    }

    // Save file metadata to database
    logger.log("[Portal Confirm Upload] Saving file metadata to database...");
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

    logger.log("[Portal Confirm Upload] File metadata saved:", file.id);

    // Check if free portal has reached file limit
    if (portal?.isActive && validatedToken) {
      const ownerAccessAllowed = validatedToken.ownerAccessAllowed ?? false;
      await maybeDeactivateFreePortalAtFileLimit(
        portal.id,
        ownerAccessAllowed,
        "[Portal Confirm Upload]",
      );
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: portal.userId,
      event: "file_uploaded",
      properties: {
        portal_id: portalId,
        file_id: file.id,
        file_size: fileSize,
        mime_type: mimeType || "application/octet-stream",
        storage_provider: provider || null,
        upload_session_id: sessionId,
      },
    });
    await posthog.flush();

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
    logger.error("[Portal Confirm Upload] Error:", error);

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
