import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { checkPortalLimit, checkCustomDomainLimit, getUserPlanType, checkFeatureAccess } from "@/lib/plan-limits";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const planType = await getUserPlanType(userId);

    // Check portal limit
    const portalCheck = await checkPortalLimit(userId, planType);
    if (!portalCheck.allowed) {
      return NextResponse.json(
        { 
          error: portalCheck.reason,
          upgrade: true,
          currentPlan: planType,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, customDomain, whiteLabeled } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Portal name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingPortal = await prisma.portal.findUnique({
      where: { slug },
    });

    if (existingPortal) {
      return NextResponse.json(
        { error: "Portal slug already exists" },
        { status: 400 }
      );
    }

    // Check custom domain limit if provided
    if (customDomain) {
      const domainCheck = await checkCustomDomainLimit(userId, planType);
      if (!domainCheck.allowed) {
        return NextResponse.json(
          { 
            error: domainCheck.reason,
            upgrade: true,
            currentPlan: planType,
          },
          { status: 403 }
        );
      }

      // Check if custom domain is already taken
      const existingDomain = await prisma.portal.findUnique({
        where: { customDomain },
      });

      if (existingDomain) {
        return NextResponse.json(
          { error: "Custom domain already in use" },
          { status: 400 }
        );
      }
    }

    // Check white-labeling feature access
    if (whiteLabeled && !checkFeatureAccess(planType, "whiteLabeling")) {
      return NextResponse.json(
        { 
          error: "White-labeling is not available on your current plan",
          upgrade: true,
          currentPlan: planType,
        },
        { status: 403 }
      );
    }

    // Create the portal
    const portal = await prisma.portal.create({
      data: {
        name,
        slug,
        customDomain: customDomain || null,
        whiteLabeled: whiteLabeled || false,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      portal,
      message: "Portal created successfully",
    });
  } catch (error) {
    console.error("Error creating portal:", error);
    return NextResponse.json(
      { error: "Failed to create portal" },
      { status: 500 }
    );
  }
}
