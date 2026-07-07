import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getPresignedPutUrl } from "@/lib/r2-client";
import { hashPassword } from "@/lib/password-utils";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateShareToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// POST /api/shared-files - Create a presigned upload URL and shared file record
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, size, mimeType, password, expiresInHours, maxDownloads } =
      body;

    if (!name || !size || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: name, size, mimeType" },
        { status: 400 },
      );
    }

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    let expiresAt: Date | null = null;
    if (expiresInHours && typeof expiresInHours === "number") {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const shareToken = generateShareToken();
    const storageKey = `shared/${session.user.id}/${shareToken}/${name}`;

    const presignedUrl = await getPresignedPutUrl(
      storageKey,
      mimeType,
      3600,
      Number(size),
    );

    await prisma.sharedFile.create({
      data: {
        userId: session.user.id,
        name,
        size: BigInt(size),
        mimeType,
        storageKey,
        shareToken,
        passwordHash,
        expiresAt,
        maxDownloads: maxDownloads || null,
        downloadCount: 0,
      },
    });

    return NextResponse.json({
      presignedUrl,
      storageKey,
      shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/share/${shareToken}`,
    });
  } catch (error) {
    logger.error("Error creating shared file:", error);
    return NextResponse.json(
      { error: "Failed to create shared file" },
      { status: 500 },
    );
  }
}

// GET /api/shared-files - List user's shared files
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await prisma.sharedFile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      files: files.map((f: any) => ({
        ...f,
        size: f.size.toString(),
      })),
    });
  } catch (error) {
    logger.error("Error listing shared files:", error);
    return NextResponse.json(
      { error: "Failed to list shared files" },
      { status: 500 },
    );
  }
}
