import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/lib/storage-api";
import { checkStorageLimit, getUserPlanType } from "@/lib/plan-limits";
import { applyUploadRateLimit } from "@/lib/rate-limit";

function parseAllowedFileTypes(allowedFileTypes: string[]): Set<string> {
  const allowedMimeTypes = new Set<string>();

  for (const typeGroup of allowedFileTypes) {
    const mimeTypes = typeGroup.split(",").map((t) => t.trim().toLowerCase());

    for (const mimeType of mimeTypes) {
      if (mimeType.includes("/*")) {
        const prefix = mimeType.replace("/*", "");

        if (prefix === "image") {
          allowedMimeTypes.add("image/jpeg");
          allowedMimeTypes.add("image/png");
          allowedMimeTypes.add("image/gif");
          allowedMimeTypes.add("image/webp");
          allowedMimeTypes.add("image/svg+xml");
          allowedMimeTypes.add("image/bmp");
          allowedMimeTypes.add("image/tiff");
          allowedMimeTypes.add("image/webp");
        } else if (prefix === "video") {
          allowedMimeTypes.add("video/mp4");
          allowedMimeTypes.add("video/webm");
          allowedMimeTypes.add("video/ogg");
          allowedMimeTypes.add("video/mpeg");
          allowedMimeTypes.add("video/quicktime");
          allowedMimeTypes.add("video/x-msvideo");
        } else if (prefix === "audio") {
          allowedMimeTypes.add("audio/mpeg");
          allowedMimeTypes.add("audio/mp3");
          allowedMimeTypes.add("audio/wav");
          allowedMimeTypes.add("audio/ogg");
          allowedMimeTypes.add("audio/webm");
          allowedMimeTypes.add("audio/aac");
          allowedMimeTypes.add("audio/midi");
        } else if (prefix === "text") {
          allowedMimeTypes.add("text/plain");
          allowedMimeTypes.add("text/csv");
          allowedMimeTypes.add("text/html");
          allowedMimeTypes.add("text/xml");
          allowedMimeTypes.add("text/javascript");
          allowedMimeTypes.add("text/css");
          allowedMimeTypes.add("text/markdown");
        } else {
          allowedMimeTypes.add(mimeType);
        }
      } else {
        allowedMimeTypes.add(mimeType);
      }
    }
  }

  return allowedMimeTypes;
}

function isValidMimeType(
  mimeType: string,
  allowedMimeTypes: Set<string>,
): boolean {
  return allowedMimeTypes.has(mimeType.toLowerCase());
}

function isValidFileName(fileName: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/;
  const maxLength = 255;

  return !invalidChars.test(fileName) && fileName.length <= maxLength;
}

// POST /api/portals/direct-upload - Get upload credentials for public portal upload
// This endpoint doesn't require authentication - it's for public portal uploads
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyUploadRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, portalId } = body;

    console.log("[Portal Direct Upload] Request:", {
      fileName,
      fileSize,
      portalId,
    });

    if (!fileName || !fileSize || !portalId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, portalId" },
        { status: 400 },
      );
    }

    // Validate file name
    if (!isValidFileName(fileName)) {
      return NextResponse.json(
        {
          error:
            "Invalid file name. File name contains invalid characters or exceeds maximum length.",
        },
        { status: 400 },
      );
    }

    // Verify portal exists and get owner info
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: {
        id: true,
        name: true,
        userId: true,
        maxFileSize: true,
        storageProvider: true,
        storageFolderId: true,
        storageFolderPath: true,
        useClientFolders: true,
        allowedFileTypes: true,
      },
    });

    if (!portal) {
      console.log("[Portal Direct Upload] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Parse portal's allowed file types
    const allowedMimeTypes = parseAllowedFileTypes(
      portal.allowedFileTypes || [],
    );

    // If no file types are configured, allow all (backward compatibility)
    const effectiveAllowedTypes =
      allowedMimeTypes.size > 0 ? allowedMimeTypes : null;

    // Validate file type
    if (
      effectiveAllowedTypes &&
      !isValidMimeType(mimeType, effectiveAllowedTypes)
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a supported file format." },
        { status: 400 },
      );
    }

    // Validate file size against portal limit
    if (BigInt(fileSize) > portal.maxFileSize) {
      console.log(
        "[Portal Direct Upload] File too large:",
        fileSize,
        "Max:",
        portal.maxFileSize.toString(),
      );

      return NextResponse.json(
        {
          error: `File size exceeds portal limit of ${(Number(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB`,
          maxSize: portal.maxFileSize.toString(),
        },
        { status: 413 },
      );
    }

    // Check storage limit before allowing upload
    const planType = await getUserPlanType(portal.userId);
    const storageCheck = await checkStorageLimit(
      portal.userId,
      planType,
      Number(fileSize),
    );

    if (!storageCheck.allowed) {
      console.log("[Portal Direct Upload] Storage limit exceeded:", {
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

    // Get cloud storage token for portal owner based on portal's storageProvider setting
    console.log(
      "[Portal Direct Upload] Portal storage provider:",
      portal.storageProvider,
    );

    // Determine provider from portal settings, with fallback
    let provider: "google" | "dropbox" = "google";
    let accessToken: string | null = null;

    // Try the portal's configured provider first
    if (portal.storageProvider === "google_drive") {
      accessToken = await getValidToken(portal.userId, "google");
      provider = "google";
    } else if (portal.storageProvider === "dropbox") {
      accessToken = await getValidToken(portal.userId, "dropbox");
      provider = "dropbox";
    }

    // Fallback to other provider if configured one isn't available
    if (!accessToken) {
      if (portal.storageProvider === "google_drive") {
        console.log(
          "[Portal Direct Upload] Google Drive not available, trying Dropbox...",
        );
        accessToken = await getValidToken(portal.userId, "dropbox");
        provider = "dropbox";
      } else if (portal.storageProvider === "dropbox") {
        console.log(
          "[Portal Direct Upload] Dropbox not available, trying Google Drive...",
        );
        accessToken = await getValidToken(portal.userId, "google");
        provider = "google";
      } else {
        // No storage provider configured, try both
        accessToken = await getValidToken(portal.userId, "google");
        provider = "google";
        if (!accessToken) {
          accessToken = await getValidToken(portal.userId, "dropbox");
          provider = "dropbox";
        }
      }
    }

    if (!accessToken) {
      console.log(
        "[Portal Direct Upload] No cloud storage connected for user:",
        portal.userId,
      );

      return NextResponse.json(
        { error: "Portal owner has not connected cloud storage" },
        { status: 400 },
      );
    }

    console.log("[Portal Direct Upload] Using provider:", provider);

    // Determine folder path
    let folderPath: string;

    if (portal.storageFolderId && portal.storageFolderPath) {
      folderPath = portal.storageFolderPath;
    } else {
      folderPath = `dysumcorp/${portal.name}`;
    }

    // Generate upload URL/credentials based on provider
    let uploadData: Record<string, unknown> = {};

    if (provider === "google") {
      // For Google Drive, use chunked upload through our server
      // We'll upload in chunks to avoid the 4.5MB limit per request
      uploadData = {
        method: "chunked",
        provider: "google",
        chunkSize: 8 * 1024 * 1024, // 8MB chunks
      };

      console.log(
        "[Portal Direct Upload] Google Drive will use chunked upload",
      );
    } else {
      // For Dropbox, use chunked upload through our server
      // We NO LONGER expose the access token to the client for security
      uploadData = {
        method: "chunked",
        provider: "dropbox",
        chunkSize: 8 * 1024 * 1024, // 8MB chunks
      };

      console.log(
        "[Portal Direct Upload] Dropbox will use chunked upload (secure)",
      );
    }

    return NextResponse.json({
      success: true,
      provider,
      portalId,
      fileName,
      storageFolderId: portal.storageFolderId,
      useClientFolders: portal.useClientFolders,
      ...uploadData,
    });
  } catch (error) {
    console.error("[Portal Direct Upload] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to prepare upload";

    return NextResponse.json(
      {
        error: "Failed to prepare upload",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
