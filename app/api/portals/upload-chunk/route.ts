import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
} from "@/lib/storage-api";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Route config
export const runtime = "nodejs";
export const maxDuration = 60;

// Store upload sessions in memory (in production, use Redis or database)
const uploadSessions = new Map<
  string,
  {
    uploadUrl: string;
    uploadedBytes: number;
    totalBytes: number;
  }
>();

// POST /api/portals/upload-chunk - Upload a chunk of a file to Google Drive
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob;
    const portalId = formData.get("portalId") as string;
    const fileName = formData.get("fileName") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileSize = parseInt(formData.get("fileSize") as string);
    const sessionId = formData.get("sessionId") as string;
    const clientName = formData.get("clientName") as string | null;
    const clientEmail = formData.get("clientEmail") as string | null;

    console.log(
      `[Upload Chunk] Chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`,
    );

    if (
      !chunk ||
      !portalId ||
      !fileName ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get portal
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
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Get access token based on portal's storage provider
    let accessToken = await getValidToken(portal.userId, "google");
    let provider: "google" | "dropbox" = "google";

    if (!accessToken) {
      accessToken = await getValidToken(portal.userId, "dropbox");
      provider = "dropbox";
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "No storage connected" },
        { status: 400 },
      );
    }

    // Determine the parent folder for uploads
    let parentFolderId: string;
    let folderPath: string;

    if (portal.storageFolderId) {
      // Use custom folder selected in portal settings
      parentFolderId = portal.storageFolderId;
      folderPath = portal.storageFolderPath || portal.name;
    } else {
      // Default: use dysumcorp/portalname structure
      const rootFolder = await findOrCreateRootFolder(
        accessToken,
        portal.userId,
      );
      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
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
      );
      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    // First chunk: create resumable upload session
    if (chunkIndex === 0) {
      const metadata: any = {
        name: fileName,
        mimeType: formData.get("mimeType") || "application/octet-stream",
      };

      // Set parent folder
      metadata.parents = [parentFolderId];

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Length": fileSize.toString(),
          },
          body: JSON.stringify(metadata),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create upload session");
      }

      const uploadUrl = response.headers.get("Location");

      if (!uploadUrl) {
        throw new Error("No upload URL returned");
      }

      uploadSessions.set(sessionId, {
        uploadUrl,
        uploadedBytes: 0,
        totalBytes: fileSize,
      });
    }

    // Get session
    const session = uploadSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 },
      );
    }

    // Upload chunk
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

    session.uploadedBytes += chunkSize;

    // Last chunk: return file info
    if (chunkIndex === totalChunks - 1) {
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload final chunk");
      }

      const result = await uploadResponse.json();

      uploadSessions.delete(sessionId);

      console.log(`[Upload Chunk] Upload complete: ${result.id}`);

      const storageUrl =
        result.webViewLink ||
        `https://drive.google.com/file/d/${result.id}/view`;

      return NextResponse.json({
        success: true,
        complete: true,
        storageUrl,
        storageFileId: result.id,
        size: result.size ? Number(result.size) : fileSize,
      });
    }

    // Not last chunk: return progress
    return NextResponse.json({
      success: true,
      complete: false,
      uploadedBytes: session.uploadedBytes,
      totalBytes: session.totalBytes,
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
