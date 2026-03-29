import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { hashPassword, validatePassword } from "@/lib/password-utils";
import { checkAccess } from "@/lib/trial";
import { sendPortalCreatedNotification } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check subscription access
    const access = await checkAccess(userId);

    // Users with active subscription or trial can create unlimited portals
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: "A subscription is required to create portals.",
          code:
            access.reason === "expired"
              ? "SUBSCRIPTION_EXPIRED"
              : "CHECKOUT_REQUIRED",
        },
        { status: 402 },
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      customDomain,
      whiteLabeled,
      // Branding
      primaryColor,
      secondaryColor,
      textColor,
      backgroundColor,
      cardBackgroundColor,
      gradientEnabled,
      logoUrl,
      companyWebsite,
      companyEmail,
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
      welcomeToastMessage,
      welcomeToastDelay,
      welcomeToastDuration,
      submitButtonText,
      successMessage,
      textboxSectionEnabled,
      textboxSectionTitle,
      textboxSectionRequired,
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

    // Check if custom domain is already taken
    if (customDomain) {
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

    // No password validation - allow any password length

    // Get user's default branding and notification settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { portalLogo: true, email: true, name: true },
    });

    // Hash password if provided
    const hashedPassword = password ? await hashPassword(password) : null;

    // Create the portal
    const portal = await prisma.portal.create({
      data: {
        name,
        slug,
        customDomain: customDomain || null,
        whiteLabeled: whiteLabeled || false,
        userId,
        isActive: true,
        // Branding
        primaryColor: primaryColor || "#6366f1",
        secondaryColor: secondaryColor || "#8b5cf6",
        textColor: textColor || "#1e293b",
        backgroundColor: backgroundColor || "#f1f5f9",
        cardBackgroundColor: cardBackgroundColor || "#ffffff",
        gradientEnabled: gradientEnabled !== undefined ? gradientEnabled : true,
        logoUrl: logoUrl || user?.portalLogo || null,
        companyWebsite: companyWebsite || null,
        companyEmail: companyEmail || null,
        // Storage
        storageProvider: storageProvider || null,
        storageFolderId: storageFolderId || null,
        storageFolderPath: storageFolderPath || null,
        useClientFolders: useClientFolders || false,
        // Security
        password: hashedPassword,
        requireClientName:
          requireClientName !== undefined ? requireClientName : true,
        requireClientEmail: requireClientEmail || false,
        maxFileSize: BigInt(finalMaxFileSize),
        allowedFileTypes: allowedFileTypes || [],
        // Messaging
        welcomeMessage: welcomeMessage || null,
        welcomeToastMessage: welcomeToastMessage || null,
        welcomeToastDelay:
          welcomeToastDelay !== undefined ? welcomeToastDelay : 1000,
        welcomeToastDuration:
          welcomeToastDuration !== undefined ? welcomeToastDuration : 3000,
        submitButtonText: submitButtonText || "Initialize Transfer",
        successMessage: successMessage || "Transmission Verified",
        textboxSectionEnabled: textboxSectionEnabled ?? false,
        textboxSectionTitle: textboxSectionTitle || null,
        textboxSectionRequired: textboxSectionRequired ?? false,
      },
    });

    // Send portal creation notification email
    if (user?.email) {
      try {
        await sendPortalCreatedNotification({
          to: user.email,
          userName: user.name || user.email.split("@")[0],
          portalName: portal.name,
          portalSlug: portal.slug,
        });
      } catch (emailError) {
        // Don't fail the request if email fails - log in development only
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to send notification email:", emailError);
        }
      }
    }

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

    return NextResponse.json(
      {
        error: "Failed to create portal",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 },
    );
  }
}
