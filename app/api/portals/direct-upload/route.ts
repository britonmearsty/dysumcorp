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

    // Get cloud storage token for portal owner (Google Drive or Dropbox)
    console.log(
      "[Portal Direct Upload] Getting storage token for user:",
      portal.userId,
    );
    let accessToken = await getValidToken(portal.userId, "google");
    let provider: "google" | "dropbox" = "google";

    if (!accessToken) {
      console.log("[Portal Direct Upload] No Google Drive, trying Dropbox...");
      accessToken = await getValidToken(portal.userId, "dropbox");
      provider = "dropbox";
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
        path: `/${portal.name}/${fileName}`,
        method: "dropbox-api",
      };

      console.log("[Portal Direct Upload] Dropbox credentials prepared");
    }

    return NextResponse.json({
      success: true,
      provider,
      portalId,
      fileName,
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
