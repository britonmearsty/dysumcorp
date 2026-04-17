import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkAccess } from "@/lib/trial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/portals/create-upload-session - Create an upload session before files are uploaded
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalId, uploaderName, uploaderEmail, uploaderNotes } = body;

    console.log("[Create Upload Session] Request:", {
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
      select: { id: true, isActive: true, userId: true },
    });

    if (!portal) {
      console.log("[Create Upload Session] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json(
        { error: "This portal is not accepting uploads" },
        { status: 403 },
      );
    }

    // Check portal owner's subscription access
    const access = await checkAccess(portal.userId);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: "This portal is not currently accepting uploads",
          code: "PORTAL_UNAVAILABLE",
        },
        { status: 402 },
      );
    }

    // Create new upload session
    const session = await prisma.uploadSession.create({
      data: {
        portalId,
        uploaderName: uploaderName || null,
        uploaderEmail: uploaderEmail || null,
        uploaderNotes: uploaderNotes || null,
        fileCount: 0,
        totalSize: BigInt(0),
      },
    });

    console.log("[Create Upload Session] Created session:", session.id);

    return NextResponse.json({
      success: true,
      uploadSessionId: session.id,
    });
  } catch (error) {
    console.error("[Create Upload Session] Error:", error);

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
