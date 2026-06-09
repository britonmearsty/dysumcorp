import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deactivate-overlimit-portals
 * One-time backfill to deactivate portals that exceeded file limit.
 * Requires admin secret.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminSecret } = body;

    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all free users with active portals
    const freeUsers = await prisma.user.findMany({
      where: {
        subscriptionPlan: "free",
      },
      select: {
        id: true,
        email: true,
      },
    });

    const results = [];
    let deactivatedCount = 0;

    for (const user of freeUsers) {
      // Find user's portals
      const portals = await prisma.portal.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      for (const portal of portals) {
        // Count files
        const fileCount = await prisma.file.count({
          where: { portalId: portal.id },
        });

        if (fileCount >= 10) {
          // Deactivate portal
          await prisma.portal.update({
            where: { id: portal.id },
            data: { isActive: false },
          });

          deactivatedCount++;
          results.push({
            portalId: portal.id,
            name: portal.name,
            userEmail: user.email,
            fileCount,
            action: "deactivated",
          });
        } else {
          results.push({
            portalId: portal.id,
            name: portal.name,
            userEmail: user.email,
            fileCount,
            action: "active",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      deactivatedCount,
      totalChecked: results.length,
      results,
    });
  } catch (error) {
    logger.error("[Deactivate Overlimit Portals] Error:", error);

    return NextResponse.json(
      { error: "Failed to process portals" },
      { status: 500 },
    );
  }
}
