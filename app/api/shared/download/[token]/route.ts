import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPresignedGetUrl } from "@/lib/r2-client";
import { verifyPassword } from "@/lib/password-utils";
import { applyDownloadRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/shared/download/[token]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const rateLimitResult = await applyDownloadRateLimit(request);

    if (rateLimitResult) return rateLimitResult;

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

    if (file.passwordHash) {
      const password = request.headers.get("x-file-password");

      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 },
        );
      }

      const valid = await verifyPassword(password, file.passwordHash);

      if (!valid) {
        return NextResponse.json(
          { error: "Invalid password", requiresPassword: true },
          { status: 401 },
        );
      }
    }

    await prisma.sharedFile.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    });

    const presignedUrl = await getPresignedGetUrl(file.storageKey, 3600);

    return NextResponse.json({ downloadUrl: presignedUrl });
  } catch (error) {
    logger.error("Error preparing download:", error);
    return NextResponse.json(
      { error: "Failed to prepare download" },
      { status: 500 },
    );
  }
}
