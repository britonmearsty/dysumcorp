import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/shared/[token] - Public bundle info with file list
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const bundle = await prisma.shareBundle.findUnique({
      where: { shareToken: token },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
          },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    if (bundle.expiresAt && bundle.expiresAt < new Date()) {
      return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
    }

    if (bundle.maxDownloads && bundle.downloadCount >= bundle.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 410 },
      );
    }

    return NextResponse.json({
      hasPassword: !!bundle.passwordHash,
      expiresAt: bundle.expiresAt?.toISOString() || null,
      maxDownloads: bundle.maxDownloads || null,
      downloadCount: bundle.downloadCount,
      files: bundle.files.map((f: any) => ({
        ...f,
        size: f.size.toString(),
      })),
    });
  } catch (error) {
    logger.error("Error fetching share bundle info:", error);
    return NextResponse.json(
      { error: "Failed to fetch share info" },
      { status: 500 },
    );
  }
}
