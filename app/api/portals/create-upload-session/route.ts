import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkAccess, checkPortalTrialExpiration } from "@/lib/access";

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

    // REVERSIBILITY: Remove this trial check to revert
    // Check portal owner's subscription access - allow trial users if valid
    const access = await checkAccess(portal.userId);

    if (!access.allowed) {
      // Check if user is on free trial
      const user = await prisma.user.findUnique({
        where: { id: portal.userId },
        select: {
          subscriptionPlan: true,
          hasCreatedTrialPortal: true,
        },
      });

      if (user?.subscriptionPlan === "free" && user?.hasCreatedTrialPortal) {
        // Check trial expiration
        const trialCheck = await checkPortalTrialExpiration(portal.id);

        if (trialCheck.isExpired) {
          return NextResponse.json(
            {
              error: "Trial expired. Upgrade to Pro to receive more files.",
              code: "TRIAL_EXPIRED",
            },
            { status: 403 },
          );
        }

        // Check file count (max 10 for trial)
        const fileCount = await prisma.file.count({
          where: { portalId: portal.id },
        });

        if (fileCount >= 10) {
          return NextResponse.json(
            {
              error: "File limit reached (10/10). Upgrade to Pro for unlimited uploads.",
              code: "TRIAL_FILE_LIMIT_REACHED",
            },
            { status: 403 },
          );
        }
        // Trial is valid, allow upload session
      } else {
        // Not a trial user, block upload
        return NextResponse.json(
          {
            error: "This portal is not currently accepting uploads",
            code: "PORTAL_UNAVAILABLE",
          },
          { status: 402 },
        );
      }
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
