import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { applyPublicPortalRateLimit } from "@/lib/rate-limit";
import { checkAccess, checkPortalTrialExpiration } from "@/lib/access";

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

    // REVERSIBILITY: Remove this trial check to revert trial feature
    // Check if this is a free user's trial portal
    let isTrialPortal = false;
    let trialExpired = false;
    
    if (!access.allowed) {
      // User might be on free trial - check if this is their trial portal
      const user = await prisma.user.findUnique({
        where: { id: portal.userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          hasCreatedTrialPortal: true,
        },
      });

      // If user is free and has created a trial portal, allow access if not expired
      if (user?.subscriptionPlan === "free" && user?.hasCreatedTrialPortal) {
        const trialCheck = await checkPortalTrialExpiration(portal.id);
        isTrialPortal = true;
        trialExpired = trialCheck.isExpired;
        
        if (trialExpired) {
          return NextResponse.json({ error: "Portal not found" }, { status: 404 });
        }
        // Trial portal is active, allow access
      } else {
        // Not a trial portal, block access
        return NextResponse.json({ error: "Portal not found" }, { status: 404 });
      }
    }

    // Check trial file limit for free users (trial plan with no subscription)
    const user = await prisma.user.findUnique({
      where: { id: portal.userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        hasCreatedTrialPortal: true,
      },
    });

    // Determine if owner is a subscriber (pro plan with active or trialing subscription)
    const isSubscriber =
      user?.subscriptionPlan === "pro" && user?.subscriptionStatus === "active";
    
    // REVERSIBILITY: Remove this line to revert trial feature
    // Check if this is an active trial portal
    if (user?.subscriptionPlan === "free" && user?.hasCreatedTrialPortal) {
      const trialCheck = await checkPortalTrialExpiration(portal.id);
      isTrialPortal = true;
      trialExpired = trialCheck.isExpired;
    }

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
      // REVERSIBILITY: Remove this line to revert trial feature
      isTrialPortal,
      trialExpired,
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
