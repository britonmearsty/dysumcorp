import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
} from "@/lib/storage-api";
import { applyUploadRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST /api/portals/upload-url - Get direct upload URL for public portal (no auth required)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyUploadRateLimit(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rateLimitInfo = {
      limit: 50,
      remaining: 49,
      reset: Math.ceil(Date.now() / 1000) + 60,
    };

    const body = await request.json();
    const { fileName, fileSize, mimeType, portalId, provider, uploaderName } =
      body;

    if (!fileName || !fileSize || !portalId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, portalId" },
        { status: 400 },
      );
    }

    // Verify portal exists and is active
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
        isActive: true,
      },
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

    // Get the portal owner's storage token
    const storageProvider =
      provider || (portal.storageProvider === "dropbox" ? "dropbox" : "google");
    const accessToken = await getValidToken(portal.userId, storageProvider);

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Cloud storage not connected. This portal cannot accept uploads at this time.",
        },
        { status: 400 },
      );
    }

    // Determine folder structure
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
        storageProvider,
      );
      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
        storageProvider,
      );

      parentFolderId = portalFolder.id;
      folderPath = `dysumcorp/${portal.name}`;
    }

    // Handle client folder if enabled
    if (portal.useClientFolders && uploaderName && uploaderName.trim()) {
      const clientFolder = await findOrCreateClientFolder(
        accessToken,
        parentFolderId,
        uploaderName.trim(),
        storageProvider,
      );

      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    const finalParentFolderId = parentFolderId;

    // Generate upload URL based on provider
    let uploadUrl: string;
    let uploadMetadata: Record<string, unknown> = {};

    if (storageProvider === "dropbox") {
      // For Dropbox, use chunked upload through our server
      // We NO LONGER expose the access token to the client for security
      uploadMetadata = {
        method: "chunked",
        provider: "dropbox",
        folderPath,
        chunkSize: 4 * 1024 * 1024, // 4MB chunks
      };
    } else {
      // Google Drive - create resumable upload session with parent folder
      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fileName,
            mimeType: mimeType || "application/octet-stream",
            parents: [finalParentFolderId],
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create upload session");
      }

      uploadUrl = response.headers.get("Location") || "";
      uploadMetadata = {
        uploadUrl,
        method: "resumable",
      };
    }

    return NextResponse.json({
      success: true,
      provider: storageProvider,
      ...uploadMetadata,
      portalId,
      fileName,
      fileSize,
      rateLimit: {
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        reset: rateLimitInfo.reset,
      },
    });
  } catch (error) {
    console.error("Public upload URL error:", error);

    return NextResponse.json(
      { error: "Failed to get upload URL" },
      { status: 500 },
    );
  }
}
