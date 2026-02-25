import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/portals/public/[slug] - Get portal by slug (public access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
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
        // Branding
        primaryColor: true,
        textColor: true,
        backgroundColor: true,
        cardBackgroundColor: true,
        logoUrl: true,
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
        submitButtonText: true,
        successMessage: true,
        // Note: userId is intentionally excluded to prevent user enumeration
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json(
        { error: "Portal is not active" },
        { status: 403 },
      );
    }

    // Serialize BigInt
    const serializedPortal = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
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
