import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
} from "@/lib/storage-api";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { generateUploadToken } from "@/lib/upload-tokens";
import { checkAccess } from "@/lib/access";

function parseAllowedFileTypes(allowedFileTypes: string[]): Set<string> {
  const allowedMimeTypes = new Set<string>();

  for (const typeGroup of allowedFileTypes) {
    const mimeTypes = typeGroup.split(",").map((t) => t.trim().toLowerCase());

    for (const mimeType of mimeTypes) {
      if (mimeType.includes("/*")) {
        const prefix = mimeType.replace("/*", "");

        if (prefix === "image") {
          allowedMimeTypes.add("image/jpeg");
          allowedMimeTypes.add("image/jpg");
          allowedMimeTypes.add("image/png");
          allowedMimeTypes.add("image/gif");
          allowedMimeTypes.add("image/webp");
          allowedMimeTypes.add("image/svg+xml");
          allowedMimeTypes.add("image/bmp");
          allowedMimeTypes.add("image/x-ms-bmp");
          allowedMimeTypes.add("image/tiff");
          allowedMimeTypes.add("image/x-tiff");
          allowedMimeTypes.add("image/heic");
          allowedMimeTypes.add("image/heif");
        } else if (prefix === "video") {
          allowedMimeTypes.add("video/mp4");
          allowedMimeTypes.add("video/webm");
          allowedMimeTypes.add("video/ogg");
          allowedMimeTypes.add("video/mpeg");
          allowedMimeTypes.add("video/quicktime");
          allowedMimeTypes.add("video/x-msvideo");
          allowedMimeTypes.add("video/x-matroska");
          allowedMimeTypes.add("video/avi");
          allowedMimeTypes.add("video/x-flv");
          allowedMimeTypes.add("video/3gpp");
          allowedMimeTypes.add("video/3gpp2");
        } else if (prefix === "audio") {
          allowedMimeTypes.add("audio/mpeg");
          allowedMimeTypes.add("audio/mp3");
          allowedMimeTypes.add("audio/mp4");
          allowedMimeTypes.add("audio/x-m4a");
          allowedMimeTypes.add("audio/m4a");
          allowedMimeTypes.add("audio/wav");
          allowedMimeTypes.add("audio/ogg");
          allowedMimeTypes.add("audio/webm");
          allowedMimeTypes.add("audio/aac");
          allowedMimeTypes.add("audio/x-aac");
          allowedMimeTypes.add("audio/flac");
          allowedMimeTypes.add("audio/x-flac");
          allowedMimeTypes.add("audio/midi");
          allowedMimeTypes.add("audio/x-midi");
        } else if (prefix === "text") {
          allowedMimeTypes.add("text/plain");
          allowedMimeTypes.add("text/csv");
          allowedMimeTypes.add("text/html");
          allowedMimeTypes.add("text/xml");
          allowedMimeTypes.add("text/javascript");
          allowedMimeTypes.add("text/css");
          allowedMimeTypes.add("text/markdown");
        } else if (prefix === "archive") {
          allowedMimeTypes.add("application/zip");
          allowedMimeTypes.add("application/x-zip-compressed");
          allowedMimeTypes.add("application/x-rar-compressed");
          allowedMimeTypes.add("application/vnd.rar");
          allowedMimeTypes.add("application/x-7z-compressed");
          allowedMimeTypes.add("application/x-tar");
          allowedMimeTypes.add("application/gzip");
          allowedMimeTypes.add("application/x-gzip");
          allowedMimeTypes.add("application/x-bzip2");
          allowedMimeTypes.add("application/x-xz");
          allowedMimeTypes.add("application/octet-stream");
        } else if (prefix === "application") {
          // Document types
          allowedMimeTypes.add("application/pdf");
          allowedMimeTypes.add("application/msword");
          allowedMimeTypes.add(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          );
          allowedMimeTypes.add("application/vnd.ms-excel");
          allowedMimeTypes.add(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );
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
    const {
      fileName,
      fileSize,
      mimeType,
      portalId,
      clientName,
      clientEmail,
      clientNotes,
    } = body;

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

    // Check portal owner's subscription access
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
    // Storage limits removed — all trial/pro users have full access

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
        {
          error:
            "Portal owner's cloud storage is not connected or has expired. Please contact the portal owner to reconnect their storage.",
          code: "STORAGE_NOT_CONNECTED",
        },
        { status: 503 },
      );
    }

    console.log("[Portal Direct Upload] Using provider:", provider);

    // Determine folder structure
    let parentFolderId: string;
    let folderPath: string;

    if (portal.storageFolderId) {
      parentFolderId = portal.storageFolderId;
      folderPath = portal.storageFolderPath || portal.name;
    } else {
      const rootFolder = await findOrCreateRootFolder(
        accessToken,
        portal.userId,
        provider,
      );
      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
        provider,
      );

      parentFolderId = portalFolder.id;
      folderPath = `dysumcorp/${portal.name}`;
    }

    // Handle client folder if enabled
    if (portal.useClientFolders && clientName && clientName.trim()) {
      const clientFolder = await findOrCreateClientFolder(
        accessToken,
        parentFolderId,
        clientName.trim(),
        provider,
      );

      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    // Generate upload token for security
    const uploadToken = generateUploadToken({
      portalId,
      fileName,
      fileSize,
      mimeType,
      uploaderEmail: clientEmail || "",
      uploaderName: clientName || "",
      uploaderNotes: clientNotes || "",
    });

    // Generate direct upload URL based on provider
    let uploadData: Record<string, unknown> = {};

    if (provider === "google") {
      // Create Google Drive resumable upload session
      console.log("[Portal Direct Upload] Creating Google Drive session:", {
        fileName,
        fileSize,
        parentFolderId,
        hasAccessToken: !!accessToken,
        tokenLength: accessToken?.length,
      });

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Length": fileSize.toString(),
            "X-Upload-Content-Type": mimeType || "application/octet-stream",
          },
          body: JSON.stringify({
            name: fileName,
            mimeType: mimeType || "application/octet-stream",
            parents: [parentFolderId],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "[Portal Direct Upload] Google Drive session creation failed:",
          {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            fileName,
            fileSize,
            parentFolderId,
          },
        );
        throw new Error(
          `Failed to create Google Drive upload session: ${response.status} ${errorText}`,
        );
      }

      const uploadUrl = response.headers.get("Location");

      if (!uploadUrl) {
        throw new Error("No upload URL returned from Google Drive");
      }

      uploadData = {
        method: "stream",
        provider: "google",
        uploadUrl,
        uploadToken,
        chunkSize: 4 * 1024 * 1024, // 4MB chunks
      };

      console.log(
        "[Portal Direct Upload] Google Drive resumable upload URL created for streaming",
      );
    } else {
      // Dropbox direct upload
      const dropboxPath = `/${folderPath}/${fileName}`;

      uploadData = {
        method: "stream",
        provider: "dropbox",
        uploadUrl: "https://content.dropboxapi.com/2/files/upload",
        uploadPath: dropboxPath,
        accessToken, // Temporary: will be removed in favor of presigned URLs
        uploadToken,
      };

      console.log("[Portal Direct Upload] Dropbox direct upload configured");
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
