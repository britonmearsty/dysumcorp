import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";

// POST /api/portals/[id]/toggle-active - Toggle portal active status
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingPortal = await prisma.portal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPortal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check if trying to activate a portal that's currently inactive
    if (!existingPortal.isActive) {
      // Check trial file limit for trial users
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          subscriptionPlan: true,
          trialFileLimit: true,
          trialFileCount: true,
        },
      });

      if (
        user &&
        user.subscriptionPlan === "trial" &&
        user.trialFileCount >= user.trialFileLimit
      ) {
        return NextResponse.json(
          {
            error: "Trial file limit exceeded",
            reason: "trial_limit_exceeded",
            fileCount: user.trialFileCount,
            fileLimit: user.trialFileLimit,
          },
          { status: 403 },
        );
      }
    }

    // Toggle active status
    const portal = await prisma.portal.update({
      where: { id },
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
