import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { getValidToken } from "@/lib/storage-api";
import { getSessionFromRequest } from "@/lib/auth-server";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/storage/direct-upload - Get presigned URL for direct upload
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, portalId, provider } = body;

    if (!fileName || !fileSize || !portalId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, portalId" },
        { status: 400 }
      );
    }

    // Verify portal exists and belongs to user
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (portal.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get access token for the specified provider
    const accessToken = await getValidToken(
      session.user.id,
      provider || "google"
    );

    if (!accessToken) {
      return NextResponse.json(
        { error: `No ${provider || "google"} storage connected` },
        { status: 400 }
      );
    }

    // Generate upload URL based on provider
    let uploadUrl: string;
    let uploadMetadata: any = {};

    if (provider === "dropbox") {
      // Dropbox doesn't use presigned URLs, return token for client-side SDK
      uploadMetadata = {
        accessToken,
        path: `/${portal.name}/${fileName}`,
        method: "client-sdk",
      };
    } else {
      // Google Drive - create resumable upload session
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
          }),
        }
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
      provider: provider || "google",
      ...uploadMetadata,
      portalId,
      fileName,
    });
  } catch (error) {
    console.error("Direct upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
