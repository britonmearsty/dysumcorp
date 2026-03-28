import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { applyPublicPortalRateLimit } from "@/lib/rate-limit";
import { checkAccess } from "@/lib/trial";

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
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check owner's trial/subscription — return generic unavailable, never expose trial details
    const access = await checkAccess(portal.userId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check trial file limit for free users (trial plan with no subscription)
    const user = await prisma.user.findUnique({
      where: { id: portal.userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialFileLimit: true,
        trialFileCount: true,
      },
    });

    if (
      user &&
      user.subscriptionPlan === "trial" &&
      user.trialFileCount >= user.trialFileLimit
    ) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Determine if owner is a subscriber (pro plan with active subscription)
    const isSubscriber =
      user?.subscriptionPlan === "pro" && user?.subscriptionStatus === "active";

    // Serialize BigInt — strip userId before returning
    const { userId: _userId, ...portalData } = portal;
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
    };

    return NextResponse.json({ portal: serializedPortal });
  } catch (error) {
    console.error("Error fetching portal:", error);

    return NextResponse.json(
      { error: "Failed to fetch portal" },
      { status: 500 },
    );
  }
}
