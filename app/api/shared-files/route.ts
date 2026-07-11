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

// POST /api/shared-files - Create a share bundle with presigned upload URLs
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { files, password, expiresInHours, maxDownloads } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: files (array of {name, size, mimeType})" },
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
    const bundle = await prisma.shareBundle.create({
      data: {
        userId: session.user.id,
        shareToken,
        passwordHash,
        expiresAt,
        maxDownloads: maxDownloads || null,
        downloadCount: 0,
      },
    });

    const presignedUrls = await Promise.all(
      files.map(async (file: { name: string; size: number; mimeType: string }, index: number) => {
        const storageKey = `shared/${session.user.id}/${shareToken}/${index}_${file.name}`;
        const presignedUrl = await getPresignedPutUrl(
          storageKey,
          file.mimeType,
          3600,
          Number(file.size),
        );

        await prisma.sharedFile.create({
          data: {
            bundleId: bundle.id,
            name: file.name,
            size: BigInt(file.size),
            mimeType: file.mimeType,
            storageKey,
          },
        });

        return { name: file.name, storageKey, presignedUrl };
      }),
    );

    return NextResponse.json({
      bundleId: bundle.id,
      shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/share/${shareToken}`,
      files: presignedUrls,
    });
  } catch (error) {
    logger.error("Error creating share bundle:", error);
    return NextResponse.json(
      { error: "Failed to create share bundle" },
      { status: 500 },
    );
  }
}

// GET /api/shared-files - List user's share bundles
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bundles = await prisma.shareBundle.findMany({
      where: { userId: session.user.id },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      bundles: bundles.map((b: any) => ({
        ...b,
        files: b.files.map((f: any) => ({ ...f, size: f.size.toString() })),
      })),
    });
  } catch (error) {
    logger.error("Error listing share bundles:", error);
    return NextResponse.json(
      { error: "Failed to list share bundles" },
      { status: 500 },
    );
  }
}
