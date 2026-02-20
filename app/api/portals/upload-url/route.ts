import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getValidToken } from "@/lib/storage-api";
import {
  getRateLimit,
  uploadRateLimit,
  fallbackUploadLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST /api/portals/upload-url - Get direct upload URL for public portal (no auth required)
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await getRateLimit(
      uploadRateLimit,
      fallbackUploadLimit,
      `upload-url:${ip}`,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, portalId, provider } = body;

    if (!fileName || !fileSize || !portalId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileSize, portalId" },
        { status: 400 },
      );
    }

    // Verify portal exists and is active
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: { user: true },
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
    const accessToken = await getValidToken(
      portal.userId,
      provider || "google",
    );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Cloud storage not connected. This portal cannot accept uploads at this time.",
        },
        { status: 400 },
      );
    }

    // Generate upload URL based on provider
    let uploadUrl: string;
    let uploadMetadata: Record<string, any> = {};

    if (provider === "dropbox") {
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
      provider: provider || "google",
      ...uploadMetadata,
      portalId,
      fileName,
      fileSize,
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
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
