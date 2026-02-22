import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { getSessionFromRequest } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { hashPassword } from "@/lib/password-utils";
import {
  checkPortalLimit,
  checkCustomDomainLimit,
  getUserPlanType,
  checkFeatureAccess,
} from "@/lib/plan-limits";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    console.log("[/api/portals/create] Starting portal creation");

    const session = await getSessionFromRequest(request);

    console.log("[/api/portals/create] Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    console.log("[/api/portals/create] Getting user plan type");
    const planType = await getUserPlanType(userId);

    console.log("[/api/portals/create] Plan type:", planType);

    // Check portal limit
    console.log("[/api/portals/create] Checking portal limit");
    const portalCheck = await checkPortalLimit(userId, planType);

    console.log("[/api/portals/create] Portal check result:", portalCheck);

    if (!portalCheck.allowed) {
      return NextResponse.json(
        {
          error: portalCheck.reason,
          upgrade: true,
          currentPlan: planType,
        },
        { status: 403 },
      );
    }

    console.log("[/api/portals/create] Parsing request body");
    const body = await request.json();

    console.log("[/api/portals/create] Request body keys:", Object.keys(body));
    const {
      name,
      slug,
      customDomain,
      whiteLabeled,
      // Branding
      primaryColor,
      textColor,
      backgroundColor,
      cardBackgroundColor,
      logoUrl,
      // Storage
      storageProvider,
      storageFolderId,
      storageFolderPath,
      useClientFolders,
      // Security
      password,
      requireClientName,
      requireClientEmail,
      maxFileSize,
      allowedFileTypes,
      // Messaging
      welcomeMessage,
      submitButtonText,
      successMessage,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Portal name and slug are required" },
        { status: 400 },
      );
    }

    // Storage is now optional - if provided, validate it
    if (storageProvider && (!storageFolderId || !storageFolderPath)) {
      return NextResponse.json(
        {
          error:
            "Storage folder must be selected when storage provider is specified",
        },
        { status: 400 },
      );
    }

    // Validate file size - make it optional with default
    const finalMaxFileSize =
      maxFileSize && maxFileSize > 0 ? maxFileSize : 52428800; // Default 50MB

    console.log(
      "[/api/portals/create] Validation passed, checking slug uniqueness",
    );

    // Check if slug is already taken
    const existingPortal = await prisma.portal.findUnique({
      where: { slug },
    });

    if (existingPortal) {
      return NextResponse.json(
        { error: "Portal slug already exists" },
        { status: 400 },
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
          { status: 403 },
        );
      }

      // Check if custom domain is already taken
      const existingDomain = await prisma.portal.findUnique({
        where: { customDomain },
      });

      if (existingDomain) {
        return NextResponse.json(
          { error: "Custom domain already in use" },
          { status: 400 },
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
        { status: 403 },
      );
    }

    // Get user's default branding
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { portalLogo: true },
    });

    // Create the portal
    const portal = await prisma.portal.create({
      data: {
        name,
        slug,
        customDomain: customDomain || null,
        whiteLabeled: whiteLabeled || false,
        userId,
        // Branding
        primaryColor: primaryColor || "#3b82f6",
        textColor: textColor || "#0f172a",
        backgroundColor: backgroundColor || "#ffffff",
        cardBackgroundColor: cardBackgroundColor || "#ffffff",
        logoUrl: logoUrl || user?.portalLogo || null,
        // Storage
        storageProvider: storageProvider || null,
        storageFolderId: storageFolderId || null,
        storageFolderPath: storageFolderPath || null,
        useClientFolders: useClientFolders || false,
        // Security
        password: password ? hashPassword(password) : null,
        requireClientName:
          requireClientName !== undefined ? requireClientName : true,
        requireClientEmail: requireClientEmail || false,
        maxFileSize: BigInt(finalMaxFileSize),
        allowedFileTypes: allowedFileTypes || [],
        // Messaging
        welcomeMessage: welcomeMessage || null,
        submitButtonText: submitButtonText || "Initialize Transfer",
        successMessage: successMessage || "Transmission Verified",
      },
    });

    console.log(
      "[/api/portals/create] Portal created successfully:",
      portal.id,
    );

    // Convert BigInt to string for JSON serialization
    const portalResponse = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
    };

    return NextResponse.json({
      success: true,
      portal: portalResponse,
      message: "Portal created successfully",
    });
  } catch (error) {
    console.error("[/api/portals/create] Error creating portal:", error);
    console.error("[/api/portals/create] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to create portal",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
