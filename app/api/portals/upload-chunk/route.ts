import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
  uploadChunkToDropbox,
} from "@/lib/storage-api";
import {
  getUploadSession,
  setUploadSession,
  deleteUploadSession,
  incrementUploadedBytes,
  hasRedis,
  getFallbackUploadSessions,
  UploadSession,
} from "@/lib/upload-sessions";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { checkAccess } from "@/lib/trial";

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

export const runtime = "nodejs";
export const maxDuration = 60;

const fallbackSessions = getFallbackUploadSessions();

async function getSession(sessionId: string): Promise<UploadSession | null> {
  if (hasRedis()) {
    return getUploadSession(sessionId);
  }

  return fallbackSessions.get(sessionId);
}

async function saveSession(
  sessionId: string,
  session: UploadSession,
): Promise<void> {
  if (hasRedis()) {
    await setUploadSession(sessionId, session);
  } else {
    fallbackSessions.set(sessionId, session);
  }
}

async function updateSessionBytes(
  sessionId: string,
  bytesToAdd: number,
): Promise<UploadSession | null> {
  if (hasRedis()) {
    return incrementUploadedBytes(sessionId, bytesToAdd);
  }

  return fallbackSessions.incrementBytes(sessionId, bytesToAdd);
}

async function removeSession(sessionId: string): Promise<void> {
  if (hasRedis()) {
    await deleteUploadSession(sessionId);
  } else {
    fallbackSessions.delete(sessionId);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyUploadRateLimit(request);

    if (rateLimitResult) {
      return rateLimitResult;
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob;
    const portalId = formData.get("portalId") as string;
    const fileName = formData.get("fileName") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileSize = parseInt(formData.get("fileSize") as string);
    const sessionId = formData.get("sessionId") as string;
    const clientName = formData.get("clientName") as string | null;
    const mimeType =
      (formData.get("mimeType") as string) || "application/octet-stream";

    console.log(
      `[Upload Chunk] Chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`,
    );

    if (
      !chunk ||
      !portalId ||
      !fileName ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks) ||
      !sessionId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: {
        id: true,
        name: true,
        userId: true,
        storageProvider: true,
        storageFolderId: true,
        storageFolderPath: true,
        useClientFolders: true,
        maxFileSize: true,
        allowedFileTypes: true,
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check portal owner's subscription access on first chunk
    if (chunkIndex === 0) {
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

    // Check storage limit on first chunk
    if (chunkIndex === 0) {
      // Storage limits removed — all trial/pro users have full access
    }

    // Validate file size
    if (BigInt(fileSize) > portal.maxFileSize) {
      return NextResponse.json(
        {
          error: `File size exceeds portal limit of ${(Number(portal.maxFileSize) / 1024 / 1024).toFixed(0)}MB`,
        },
        { status: 413 },
      );
    }

    // Get access token
    const portalProvider =
      portal.storageProvider === "dropbox" ? "dropbox" : "google";
    let accessToken = await getValidToken(portal.userId, portalProvider);

    if (!accessToken) {
      // Try fallback provider
      const fallbackProvider =
        portalProvider === "dropbox" ? "google" : "dropbox";

      accessToken = await getValidToken(portal.userId, fallbackProvider);

      if (!accessToken) {
        return NextResponse.json(
          { error: "No storage connected" },
          { status: 400 },
        );
      }
    }

    const provider = portalProvider;

    // Determine folder
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

    // Handle client folder
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

    // First chunk: initialize upload session
    if (chunkIndex === 0) {
      console.log(`[Upload Chunk] Initializing session for ${fileName}`);

      if (provider === "google") {
        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Upload-Content-Length": fileSize.toString(),
            },
            body: JSON.stringify({
              name: fileName,
              mimeType,
              parents: [parentFolderId],
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();

          console.error(
            "[Upload Chunk] Google Drive session creation failed:",
            errorText,
          );
          throw new Error("Failed to create Google Drive upload session");
        }

        const uploadUrl = response.headers.get("Location");

        if (!uploadUrl) {
          throw new Error("No upload URL returned from Google Drive");
        }

        const sessionData = {
          uploadUrl,
          uploadedBytes: 0,
          totalBytes: fileSize,
          provider: "google" as const,
          portalId,
          fileName,
          createdAt: Date.now(),
        };

        console.log(`[Upload Chunk] Saving Google session ${sessionId}`);
        await saveSession(sessionId, sessionData);
        console.log(`[Upload Chunk] Session saved successfully`);
      } else {
        // Dropbox - store session info for chunked upload
        const sessionData = {
          uploadUrl: `dropbox:/${folderPath}/${fileName}`,
          uploadedBytes: 0,
          totalBytes: fileSize,
          provider: "dropbox" as const,
          portalId,
          fileName,
          createdAt: Date.now(),
        };

        console.log(`[Upload Chunk] Saving Dropbox session ${sessionId}`);
        await saveSession(sessionId, sessionData);
        console.log(`[Upload Chunk] Session saved successfully`);
      }
    }

    // Get session
    console.log(`[Upload Chunk] Retrieving session ${sessionId}`);
    const session = await getSession(sessionId);

    if (!session) {
      console.error(`[Upload Chunk] Session not found: ${sessionId}`);
      console.error(
        `[Upload Chunk] ChunkIndex: ${chunkIndex}, Expected session to exist`,
      );

      return NextResponse.json(
        { error: "Upload session not found. Please try uploading again." },
        { status: 404 },
      );
    }

    console.log(`[Upload Chunk] Session found:`, {
      provider: session.provider,
      uploadedBytes: session.uploadedBytes,
      totalBytes: session.totalBytes,
    });

    // Upload chunk based on provider
    let uploadResult: { success: boolean; fileId?: string; size?: number } = {
      success: false,
    };

    if (session.provider === "google") {
      const chunkSize = chunk.size;
      const start = session.uploadedBytes;
      const end = start + chunkSize - 1;

      const uploadResponse = await fetch(session.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": chunkSize.toString(),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        },
        body: chunk,
      });

      const updatedSession = await updateSessionBytes(sessionId, chunk.size);

      // Last chunk
      if (chunkIndex === totalChunks - 1) {
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload final chunk to Google Drive");
        }

        const result = await uploadResponse.json();

        await removeSession(sessionId);

        console.log(
          `[Upload Chunk] Google Drive upload complete: ${result.id}`,
        );

        uploadResult = {
          success: true,
          fileId: result.id,
          size: result.size ? Number(result.size) : fileSize,
        };
      } else {
        return NextResponse.json({
          success: true,
          complete: false,
          uploadedBytes:
            updatedSession?.uploadedBytes || session.uploadedBytes + chunkSize,
          totalBytes: session.totalBytes,
        });
      }
    } else {
      // Dropbox chunked upload
      const dropboxPath = session.uploadUrl.replace("dropbox:", "");
      const result = await uploadChunkToDropbox(
        accessToken!,
        dropboxPath,
        chunk,
        chunkIndex,
        totalChunks,
        session.uploadedBytes,
        fileSize,
      );

      const updatedSession = await updateSessionBytes(sessionId, chunk.size);

      if (result.complete) {
        await removeSession(sessionId);
        console.log(`[Upload Chunk] Dropbox upload complete: ${result.id}`);

        uploadResult = {
          success: true,
          fileId: result.id,
          size: fileSize,
        };
      } else {
        return NextResponse.json({
          success: true,
          complete: false,
          uploadedBytes:
            updatedSession?.uploadedBytes || session.uploadedBytes + chunk.size,
          totalBytes: session.totalBytes,
        });
      }
    }

    // Return final result
    const storageUrl =
      session.provider === "google"
        ? `https://drive.google.com/file/d/${uploadResult.fileId}/view`
        : `https://www.dropbox.com/home${folderPath}`;

    return NextResponse.json({
      success: true,
      complete: true,
      storageUrl,
      storageFileId: uploadResult.fileId,
      size: uploadResult.size || fileSize,
      provider: session.provider,
    });
  } catch (error) {
    console.error("[Upload Chunk] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json(
      {
        error: "Upload failed",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
