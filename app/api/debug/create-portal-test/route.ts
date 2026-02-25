import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getUserPlanType, checkPortalLimit } from "@/lib/plan-limits";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const adminCheck = await isAdmin(request.headers);

  if (!adminCheck.isAdmin && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  };

  try {
    // 1. Check session
    diagnostics.checks.session = { status: "checking" };
    try {
      const session = await getSessionFromRequest(request);

      diagnostics.checks.session = {
        status: session?.user ? "success" : "failed",
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
      };
    } catch (error) {
      diagnostics.checks.session = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
      diagnostics.errors.push("Session check failed");
    }

    // 2. Check database connection
    diagnostics.checks.database = { status: "checking" };
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.checks.database = { status: "success" };
    } catch (error) {
      diagnostics.checks.database = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
      diagnostics.errors.push("Database connection failed");
    }

    // 3. Check user plan type (if session exists)
    if (diagnostics.checks.session.userId) {
      diagnostics.checks.planType = { status: "checking" };
      try {
        const planType = await getUserPlanType(
          diagnostics.checks.session.userId,
        );

        diagnostics.checks.planType = {
          status: "success",
          planType,
        };
      } catch (error) {
        diagnostics.checks.planType = {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
        diagnostics.errors.push("Plan type check failed");
      }

      // 4. Check portal limits
      if (diagnostics.checks.planType.planType) {
        diagnostics.checks.portalLimit = { status: "checking" };
        try {
          const limitCheck = await checkPortalLimit(
            diagnostics.checks.session.userId,
            diagnostics.checks.planType.planType,
          );

          diagnostics.checks.portalLimit = {
            status: "success",
            ...limitCheck,
          };
        } catch (error) {
          diagnostics.checks.portalLimit = {
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          };
          diagnostics.errors.push("Portal limit check failed");
        }
      }

      // 5. Check existing portals
      diagnostics.checks.existingPortals = { status: "checking" };
      try {
        const portals = await prisma.portal.findMany({
          where: { userId: diagnostics.checks.session.userId },
          select: { id: true, name: true, slug: true },
        });

        diagnostics.checks.existingPortals = {
          status: "success",
          count: portals.length,
          portals: portals.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          })),
        };
      } catch (error) {
        diagnostics.checks.existingPortals = {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
        diagnostics.errors.push("Existing portals check failed");
      }
    }

    // 6. Test portal creation (dry run)
    if (
      diagnostics.checks.session.userId &&
      diagnostics.checks.portalLimit?.allowed
    ) {
      diagnostics.checks.portalCreationDryRun = { status: "checking" };
      try {
        const testSlug = `test-${Date.now()}`;

        // Check if slug is available
        const existing = await prisma.portal.findUnique({
          where: { slug: testSlug },
        });

        diagnostics.checks.portalCreationDryRun = {
          status: "success",
          testSlug,
          slugAvailable: !existing,
          message: "Portal creation would succeed (dry run)",
        };
      } catch (error) {
        diagnostics.checks.portalCreationDryRun = {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
        diagnostics.errors.push("Portal creation dry run failed");
      }
    }

    // 7. Environment checks
    diagnostics.checks.environment = {
      status: "success",
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
    };

    // Summary
    diagnostics.summary = {
      totalChecks: Object.keys(diagnostics.checks).length,
      successfulChecks: Object.values(diagnostics.checks).filter(
        (c: any) => c.status === "success",
      ).length,
      failedChecks: diagnostics.errors.length,
      overallStatus:
        diagnostics.errors.length === 0 ? "healthy" : "issues_detected",
    };

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    diagnostics.criticalError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    diagnostics.summary = {
      overallStatus: "critical_failure",
    };

    return NextResponse.json(diagnostics, { status: 500 });
  }
}
