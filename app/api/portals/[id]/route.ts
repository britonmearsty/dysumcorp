import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { getSessionFromRequest } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { hashPassword } from "@/lib/password-utils";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/portals/[id] - Get single portal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portal = await prisma.portal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        files: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
            storageUrl: true,
            uploadedAt: true,
            passwordHash: true,
            downloads: true,
            uploaderName: true,
            uploaderEmail: true,
          },
        },
        _count: {
          select: { files: true },
        },
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Serialize BigInt fields
    const serializedPortal = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
      files: portal.files.map((file) => ({
        ...file,
        size: file.size.toString(),
      })),
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

// PATCH /api/portals/[id] - Update portal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(`[Portal Update] Starting update for portal: ${id}`);

    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      console.log("[Portal Update] Unauthorized - no session");

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    console.log("[Portal Update] Request body:", JSON.stringify(body, null, 2));

    const {
      name,
      customDomain,
      whiteLabeled,
      primaryColor,
      textColor,
      backgroundColor,
      cardBackgroundColor,
      logoUrl,
      storageProvider,
      storageFolderId,
      storageFolderPath,
      useClientFolders,
      password,
      requireClientName,
      requireClientEmail,
      maxFileSize,
      allowedFileTypes,
      welcomeMessage,
      submitButtonText,
      successMessage,
    } = body;

    // Verify ownership
    const existingPortal = await prisma.portal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPortal) {
      console.log("[Portal Update] Portal not found or unauthorized");

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    console.log(
      "[Portal Update] Existing portal found, building update data...",
    );

    // Build update data object
    const updateData: any = {};

    // Identity
    if (name !== undefined) updateData.name = name;

    // Branding
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (backgroundColor !== undefined)
      updateData.backgroundColor = backgroundColor;
    if (cardBackgroundColor !== undefined)
      updateData.cardBackgroundColor = cardBackgroundColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
    if (customDomain !== undefined)
      updateData.customDomain = customDomain || null;
    if (whiteLabeled !== undefined) updateData.whiteLabeled = whiteLabeled;

    // Storage
    if (storageProvider !== undefined)
      updateData.storageProvider = storageProvider;
    if (storageFolderId !== undefined)
      updateData.storageFolderId = storageFolderId;
    if (storageFolderPath !== undefined)
      updateData.storageFolderPath = storageFolderPath;
    if (useClientFolders !== undefined)
      updateData.useClientFolders = useClientFolders;

    // Security
    if (password !== undefined)
      updateData.password = password ? hashPassword(password) : null;
    if (requireClientName !== undefined)
      updateData.requireClientName = requireClientName;
    if (requireClientEmail !== undefined)
      updateData.requireClientEmail = requireClientEmail;

    // Handle maxFileSize conversion carefully
    if (maxFileSize !== undefined) {
      try {
        console.log(
          `[Portal Update] Converting maxFileSize: ${maxFileSize} (type: ${typeof maxFileSize})`,
        );
        // Convert to number first if it's a string, then to BigInt
        const fileSizeNum =
          typeof maxFileSize === "string"
            ? parseInt(maxFileSize, 10)
            : maxFileSize;

        if (isNaN(fileSizeNum)) {
          throw new Error(`Invalid maxFileSize value: ${maxFileSize}`);
        }
        updateData.maxFileSize = BigInt(fileSizeNum);
        console.log(
          `[Portal Update] Converted maxFileSize to BigInt: ${updateData.maxFileSize}`,
        );
      } catch (conversionError) {
        console.error(
          "[Portal Update] Error converting maxFileSize:",
          conversionError,
        );

        return NextResponse.json(
          { error: `Invalid maxFileSize value: ${maxFileSize}` },
          { status: 400 },
        );
      }
    }

    if (allowedFileTypes !== undefined)
      updateData.allowedFileTypes = allowedFileTypes;

    // Messaging
    if (welcomeMessage !== undefined)
      updateData.welcomeMessage = welcomeMessage || null;
    if (submitButtonText !== undefined)
      updateData.submitButtonText = submitButtonText;
    if (successMessage !== undefined)
      updateData.successMessage = successMessage;

    console.log(
      "[Portal Update] Update data prepared:",
      JSON.stringify(updateData, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    // Update portal
    console.log("[Portal Update] Executing database update...");
    const portal = await prisma.portal.update({
      where: { id },
      data: updateData,
    });

    console.log("[Portal Update] Portal updated successfully");

    // Serialize BigInt
    const serializedPortal = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
    };

    return NextResponse.json({ success: true, portal: serializedPortal });
  } catch (error) {
    console.error("[Portal Update] Error updating portal:", error);

    // Provide more detailed error message
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update portal";

    console.error("[Portal Update] Error details:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to update portal",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/portals/[id] - Delete portal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingPortal = await prisma.portal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPortal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Delete portal (cascade will delete files)
    await prisma.portal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portal:", error);

    return NextResponse.json(
      { error: "Failed to delete portal" },
      { status: 500 },
    );
  }
}
