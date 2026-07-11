import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { applyPublicPortalRateLimit } from "@/lib/rate-limit";
import { USER_ACCESS_SELECT } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/portals/public/[slug] - Get portal by slug (public access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rateLimitResponse = await applyPublicPortalRateLimit(request);

  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const portal = await prisma.portal.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        whiteLabeled: true,
        isActive: true,
        userId: true,
        // Branding
        primaryColor: true,
        secondaryColor: true,
        textColor: true,
        backgroundColor: true,
        cardBackgroundColor: true,
        gradientEnabled: true,
        logoUrl: true,
        companyWebsite: true,
        companyEmail: true,
        // Storage
        storageProvider: true,
        storageFolderId: true,
        storageFolderPath: true,
        useClientFolders: true,
        // Security
        password: true,
        requireClientName: true,
        requireClientEmail: true,
        maxFileSize: true,
        allowedFileTypes: true,
        // Messaging
        welcomeMessage: true,
        welcomeToastMessage: true,
        welcomeToastDelay: true,
        welcomeToastDuration: true,
        submitButtonText: true,
        successMessage: true,
        textboxSectionEnabled: true,
        textboxSectionTitle: true,
        textboxSectionPlaceholder: true,
        textboxSectionRequired: true,
        // Expiry
        expiresAt: true,
        maxUploads: true,
        uploadCount: true,
        // Checklist
        checklistItems: {
          select: {
            id: true,
            label: true,
            required: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        user: {
          select: USER_ACCESS_SELECT,
        },
        _count: {
          select: { files: true },
        },
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check expiry before portal loads
    if (portal.expiresAt && new Date(portal.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: "This portal has expired",
          code: "PORTAL_EXPIRED",
        },
        { status: 403 },
      );
    }

    // Check upload count limit
    if (
      portal.maxUploads !== null &&
      portal.maxUploads !== undefined &&
      portal.uploadCount >= portal.maxUploads
    ) {
      return NextResponse.json(
        {
          error: "This portal has reached its upload limit",
          code: "PORTAL_UPLOAD_LIMIT_REACHED",
        },
        { status: 403 },
      );
    }

    // Check owner's subscription (included in portal query — no extra user lookup)
    const isSubscriber =
      portal.user?.subscriptionPlan === "pro" &&
      portal.user?.subscriptionStatus === "active";

    const fileCount = portal._count.files;
    const fileLimit = isSubscriber ? 999999 : 10;

    // Serialize BigInt — strip userId and internal relations before returning
    const { userId: _userId, user: _user, _count: _fileCountMeta, ...portalData } =
      portal;
    const serializedPortal = {
      ...portalData,
      maxFileSize: portal.maxFileSize.toString(),
      welcomeMessage: portal.welcomeMessage,
      welcomeToastMessage: portal.welcomeToastMessage,
      welcomeToastDelay: portal.welcomeToastDelay ?? 1000,
      welcomeToastDuration: portal.welcomeToastDuration ?? 3000,
      submitButtonText: portal.submitButtonText || "Initialize Transfer",
      successMessage: portal.successMessage || "Transmission Verified",
      isOwnerSubscriber: isSubscriber,
      fileCount,
      fileLimit,
      expiresAt: portal.expiresAt?.toISOString() ?? null,
      maxUploads: portal.maxUploads,
      uploadCount: portal.uploadCount,
      checklistItems: portal.checklistItems,
    };

    return NextResponse.json({ portal: serializedPortal });
  } catch (error) {
    logger.error("Error fetching portal:", error);

    return NextResponse.json(
      { error: "Failed to fetch portal" },
      { status: 500 },
    );
  }
}
