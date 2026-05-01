import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkPortalTrialExpiration } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/deactivate-overlimit-trial-portals
 * One-time backfill to deactivate trial portals that exceeded file limit.
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

    // Find all trial users (free plan with hasCreatedTrialPortal)
    const trialUsers = await prisma.user.findMany({
      where: {
        subscriptionPlan: "free",
        hasCreatedTrialPortal: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const results = [];
    let deactivatedCount = 0;

    for (const user of trialUsers) {
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
        // Check if trial is still valid
        const trialCheck = await checkPortalTrialExpiration(portal.id);
        
        if (!trialCheck.isExpired) {
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
        } else {
          results.push({
            portalId: portal.id,
            name: portal.name,
            userEmail: user.email,
            action: "trial_expired",
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
    console.error("[Deactivate Overlimit Portals] Error:", error);

    return NextResponse.json(
      { error: "Failed to process portals" },
      { status: 500 },
    );
  }
}
