import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { checkAccess, checkPortalTrialExpiration } from "@/lib/access";
import { isValidUUID } from "@/lib/validation";

// POST /api/portals/[id]/toggle-active - Toggle portal active status
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Validate UUID format - prevents IDOR probe attempts
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid portal ID format" },
        { status: 400 },
      );
    }

    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingPortal = await prisma.portal.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        userId: session.user.id,
      },
    });

    if (!existingPortal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // If trying to activate (turn ON), check subscription or trial status
    if (!existingPortal.isActive) {
      const access = await checkAccess(session.user.id);

      if (!access.allowed) {
        // REVERSIBILITY: Remove this trial check to revert trial feature
        // Check if user is on free trial and can reactivate
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            subscriptionPlan: true,
            hasCreatedTrialPortal: true,
          },
        });

        // If free user with trial portal, check if trial is still valid
        if (user?.subscriptionPlan === "free" && user?.hasCreatedTrialPortal) {
          // Check trial expiration
          const trialCheck = await checkPortalTrialExpiration(existingPortal.id);
          
          if (trialCheck.isExpired) {
            return NextResponse.json(
              {
                error: "Your trial has expired. Upgrade to Pro to reactivate this portal.",
                code: "TRIAL_EXPIRED",
              },
              { status: 403 },
            );
          }

          // Check file count (max 10 for trial)
          const fileCount = await prisma.file.count({
            where: { portalId: existingPortal.id },
          });

          if (fileCount >= 10) {
            return NextResponse.json(
              {
                error: "You've reached the 10 file limit for trial portals. Upgrade to Pro to receive more files.",
                code: "TRIAL_FILE_LIMIT_REACHED",
              },
              { status: 403 },
            );
          }

          // Trial is valid, allow activation
        } else {
          // Not a trial user, require subscription
          return NextResponse.json(
            {
              error: "A subscription is required to activate portals.",
              code: "SUBSCRIPTION_REQUIRED",
            },
            { status: 402 },
          );
        }
      }
    }

    // Toggle active status
    const portal = await prisma.portal.update({
      where: { id: existingPortal.id },
      data: {
        isActive: !existingPortal.isActive,
      },
    });

    // Serialize BigInt
    const serializedPortal = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
    };

    return NextResponse.json({
      success: true,
      portal: serializedPortal,
      isActive: portal.isActive,
    });
  } catch (error) {
    console.error("Error toggling portal status:", error);

    return NextResponse.json(
      { error: "Failed to toggle portal status" },
      { status: 500 },
    );
  }
}
