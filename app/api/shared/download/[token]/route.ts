import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPresignedGetUrl } from "@/lib/r2-client";
import { verifyPassword } from "@/lib/password-utils";
import { applyDownloadRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/shared/download/[token]?fileId=xxx&mode=open|download
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const rateLimitResult = await applyDownloadRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const mode = searchParams.get("mode") || "download";

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const bundle = await prisma.shareBundle.findUnique({
      where: { shareToken: token },
      include: { files: true },
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

    if (bundle.passwordHash) {
      const password = request.headers.get("x-file-password");
      if (!password) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 },
        );
      }
      const valid = await verifyPassword(password, bundle.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid password", requiresPassword: true },
          { status: 401 },
        );
      }
    }

    const file = bundle.files.find((f: { id: string }) => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found in bundle" }, { status: 404 });
    }

    // Increment download counter once per bundle access (not per file)
    await prisma.shareBundle.update({
      where: { id: bundle.id },
      data: { downloadCount: { increment: 1 } },
    });

    const presignedUrl = await getPresignedGetUrl(file.storageKey, {
      expiresInSeconds: 3600,
      filename: mode === "download" ? file.name : undefined,
    });

    return NextResponse.json({
      downloadUrl: presignedUrl,
      fileName: file.name,
      mimeType: file.mimeType,
    });
  } catch (error) {
    logger.error("Error preparing download:", error);
    return NextResponse.json(
      { error: "Failed to prepare download" },
      { status: 500 },
    );
  }
}
