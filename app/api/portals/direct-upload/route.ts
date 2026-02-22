import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { getValidToken } from "@/lib/storage-api";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/portals/direct-upload - Get upload credentials for public portal upload
// This endpoint doesn't require authentication - it's for public portal uploads
export async function POST(request: NextRequest) {
  try {
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
      },
    });

    if (!portal) {
      console.log("[Portal Direct Upload] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
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
    let uploadData: any = {};

    if (provider === "google") {
      // For Google Drive, use chunked upload through our server
      // We'll upload in chunks to avoid the 4.5MB limit per request
      uploadData = {
        method: "chunked",
        provider: "google",
        chunkSize: 4 * 1024 * 1024, // 4MB chunks
      };

      console.log(
        "[Portal Direct Upload] Google Drive will use chunked upload",
      );
    } else {
      // For Dropbox, return the access token (client will upload directly)
      uploadData = {
        accessToken,
        path: `/${folderPath}/${fileName}`,
        method: "dropbox-api",
      };

      console.log("[Portal Direct Upload] Dropbox credentials prepared");
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
