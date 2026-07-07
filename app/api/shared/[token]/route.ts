import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/shared/[token] - Public file info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const file = await prisma.sharedFile.findUnique({
      where: { shareToken: token },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.expiresAt && file.expiresAt < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 410 },
      );
    }

    return NextResponse.json({
      name: file.name,
      size: file.size.toString(),
      mimeType: file.mimeType,
      hasPassword: !!file.passwordHash,
      expiresAt: file.expiresAt?.toISOString() || null,
      maxDownloads: file.maxDownloads || null,
      downloadCount: file.downloadCount,
    });
  } catch (error) {
    logger.error("Error fetching shared file info:", error);
    return NextResponse.json(
      { error: "Failed to fetch file info" },
      { status: 500 },
    );
  }
}
