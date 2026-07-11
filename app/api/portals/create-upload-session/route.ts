import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkAccessFromUser, USER_ACCESS_SELECT } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/portals/create-upload-session - Create an upload session before files are uploaded
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalId, uploaderName, uploaderEmail, uploaderNotes, checklistItemId } = body;

    logger.log("[Create Upload Session] Request:", {
      portalId,
      uploaderName,
      uploaderEmail,
      uploaderNotes: uploaderNotes ? "provided" : "not provided",
    });

    if (!portalId) {
      return NextResponse.json({ error: "Missing portalId" }, { status: 400 });
    }

    // Verify portal exists and is active
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: {
        id: true,
        isActive: true,
        expiresAt: true,
        maxUploads: true,
        uploadCount: true,
        user: { select: USER_ACCESS_SELECT },
      },
    });

    if (!portal) {
      logger.log("[Create Upload Session] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json(
        { error: "This portal is not accepting uploads" },
        { status: 403 },
      );
    }

    if (portal.expiresAt && new Date(portal.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This portal has expired", code: "PORTAL_EXPIRED" },
        { status: 403 },
      );
    }

    if (
      portal.maxUploads !== null &&
      portal.maxUploads !== undefined &&
      portal.uploadCount >= portal.maxUploads
    ) {
      return NextResponse.json(
        { error: "This portal has reached its upload limit", code: "PORTAL_UPLOAD_LIMIT_REACHED" },
        { status: 403 },
      );
    }

    // Check access - allow free users within limits
    const access = checkAccessFromUser(portal.user);

    if (!access.allowed) {
      // Check file count (max 10 for free)
      const fileCount = await prisma.file.count({
        where: { portalId: portal.id },
      });

      if (fileCount >= 10) {
        return NextResponse.json(
          {
            error: "File limit reached (10/10). Upgrade to Pro for unlimited uploads.",
            code: "FILE_LIMIT_REACHED",
          },
          { status: 403 },
        );
      }
      // Free user within limits, allow upload session
    }

    // Create new upload session atomically with upload count increment
    const [session] = await prisma.$transaction([
      prisma.uploadSession.create({
        data: {
          portalId,
          uploaderName: uploaderName || null,
          uploaderEmail: uploaderEmail || null,
          uploaderNotes: uploaderNotes || null,
          checklistItemId: checklistItemId ?? null,
          fileCount: 0,
          totalSize: BigInt(0),
        },
      }),
      prisma.portal.update({
        where: { id: portal.id },
        data: { uploadCount: { increment: 1 } },
      }),
    ]);

    logger.log("[Create Upload Session] Created session:", session.id);

    return NextResponse.json({
      success: true,
      uploadSessionId: session.id,
    });
  } catch (error) {
    logger.error("[Create Upload Session] Error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create upload session";

    return NextResponse.json(
      {
        error: "Failed to create upload session",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
