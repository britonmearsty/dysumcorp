import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { hashPassword } from "@/lib/password-utils";
import { isValidUUID } from "@/lib/validation";
import {
  getValidToken,
  deleteFromGoogleDrive,
  deleteFromDropbox,
} from "@/lib/storage-api";

// GET /api/portals/[id] - Get single portal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Validate UUID format - prevents IDOR probe attempts
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid portal ID format" },
        { status: 400 },
      );
    }

    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portal = await prisma.portal.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
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

    // Serialize BigInt fields and apply defaults for messaging
    const serializedPortal = {
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
      // Do NOT apply defaults for messaging fields - keep them as-is
      welcomeMessage: portal.welcomeMessage,
      welcomeToastMessage: portal.welcomeToastMessage,
      welcomeToastDelay: portal.welcomeToastDelay ?? 1000,
      welcomeToastDuration: portal.welcomeToastDuration ?? 3000,
      submitButtonText: portal.submitButtonText || "Initialize Transfer",
      successMessage: portal.successMessage || "Transmission Verified",
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

    // Validate UUID format - prevents IDOR probe attempts
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid portal ID format" },
        { status: 400 },
      );
    }

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
      secondaryColor,
      textColor,
      backgroundColor,
      cardBackgroundColor,
      gradientEnabled,
      logoUrl,
      companyWebsite,
      companyEmail,
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
      welcomeToastMessage,
      welcomeToastDelay,
      welcomeToastDuration,
      submitButtonText,
      successMessage,
      textboxSectionEnabled,
      textboxSectionTitle,
      textboxSectionPlaceholder,
      textboxSectionRequired,
    } = body;

    // Build update data object
    const updateData: any = {};

    // Identity
    if (name !== undefined) updateData.name = name;

    // Branding
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined)
      updateData.secondaryColor = secondaryColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (backgroundColor !== undefined)
      updateData.backgroundColor = backgroundColor;
    if (cardBackgroundColor !== undefined)
      updateData.cardBackgroundColor = cardBackgroundColor;
    if (gradientEnabled !== undefined)
      updateData.gradientEnabled = gradientEnabled;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
    if (companyWebsite !== undefined)
      updateData.companyWebsite = companyWebsite || null;
    if (companyEmail !== undefined)
      updateData.companyEmail = companyEmail || null;
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

    // Security - handle password with async hashing (no validation - allow any password)
    if (password !== undefined) {
      if (password) {
        updateData.password = await hashPassword(password);
      } else {
        updateData.password = null;
      }
    }
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
    if (welcomeToastMessage !== undefined)
      updateData.welcomeToastMessage = welcomeToastMessage || null;
    if (welcomeToastDelay !== undefined)
      updateData.welcomeToastDelay = welcomeToastDelay;
    if (welcomeToastDuration !== undefined)
      updateData.welcomeToastDuration = welcomeToastDuration;
    if (submitButtonText !== undefined)
      updateData.submitButtonText = submitButtonText;
    if (successMessage !== undefined)
      updateData.successMessage = successMessage;
    if (textboxSectionEnabled !== undefined)
      updateData.textboxSectionEnabled = textboxSectionEnabled;
    if (textboxSectionTitle !== undefined)
      updateData.textboxSectionTitle = textboxSectionTitle || null;
    if (textboxSectionPlaceholder !== undefined)
      updateData.textboxSectionPlaceholder = textboxSectionPlaceholder || null;
    if (textboxSectionRequired !== undefined)
      updateData.textboxSectionRequired = textboxSectionRequired;

    console.log(
      "[Portal Update] Update data prepared:",
      JSON.stringify(updateData, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    // Find portal first (supports UUID and slug)
    console.log("[Portal Update] Looking up portal...");
    const existingPortal = await prisma.portal.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!existingPortal) {
      console.log("[Portal Update] Portal not found");
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Update portal
    console.log("[Portal Update] Executing database update...");
    const portal = await prisma.portal.update({
      where: { id: existingPortal.id },
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
// Body (optional): { deleteFromStorage?: boolean }
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Validate UUID format - prevents IDOR probe attempts
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid portal ID format" },
        { status: 400 },
      );
    }

    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional body
    let deleteFromStorage: boolean | undefined;

    try {
      const body = await request.json();

      if (typeof body.deleteFromStorage === "boolean") {
        deleteFromStorage = body.deleteFromStorage;
      }
    } catch {
      // no body
    }

    // Resolve from user preference if not explicitly passed
    if (deleteFromStorage === undefined) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storageDeleteBehavior: true },
      });
      const behavior = user?.storageDeleteBehavior ?? "ask";

      if (behavior === "always") deleteFromStorage = true;
      else deleteFromStorage = false;
    }

    // Verify ownership (supports UUID and slug)
    const existingPortal = await prisma.portal.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        userId: session.user.id,
      },
    });

    if (!existingPortal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Delete files from cloud storage if requested
    if (deleteFromStorage) {
      const portalFiles = await prisma.file.findMany({
        where: { portalId: existingPortal.id },
        select: { id: true, name: true, storageUrl: true, storageFileId: true },
      });
      const provider = existingPortal.storageProvider;

      for (const file of portalFiles) {
        try {
          const isGoogleDrive =
            file.storageUrl.includes("drive.google.com") ||
            file.storageUrl.includes("docs.google.com") ||
            provider === "google";
          const isDropbox =
            file.storageUrl.includes("dropbox.com") ||
            provider === "dropbox" ||
            (file.storageFileId?.startsWith("id:") ?? false);

          if (isGoogleDrive) {
            let cloudFileId = file.storageFileId;

            if (!cloudFileId) {
              const match =
                file.storageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                file.storageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

              if (match) cloudFileId = match[1];
            }
            if (cloudFileId) {
              const token = await getValidToken(session.user.id, "google");

              if (token) await deleteFromGoogleDrive(token, cloudFileId);
            }
          } else if (isDropbox && file.storageFileId) {
            const token = await getValidToken(session.user.id, "dropbox");

            if (token) await deleteFromDropbox(token, file.storageFileId);
          }
        } catch (err) {
          console.error(`Failed to delete file ${file.id} from cloud:`, err);
        }
      }
    }

    // Delete portal (cascade deletes files from DB)
    await prisma.portal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portal:", error);

    return NextResponse.json(
      { error: "Failed to delete portal" },
      { status: 500 },
    );
  }
}
