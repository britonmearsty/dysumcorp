import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { checkAccess } from "@/lib/trial";
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

    // If trying to activate (turn ON), check subscription
    if (!existingPortal.isActive) {
      const access = await checkAccess(session.user.id);

      if (!access.allowed) {
        return NextResponse.json(
          {
            error: "A subscription is required to activate portals.",
            code: "SUBSCRIPTION_REQUIRED",
          },
          { status: 402 },
        );
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
