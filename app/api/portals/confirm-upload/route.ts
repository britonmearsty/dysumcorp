import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { hashPassword } from "@/lib/password-utils";
import { sendFileUploadNotification } from "@/lib/email-service";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// POST /api/portals/confirm-upload - Confirm file upload and save metadata
// This endpoint doesn't require authentication - it's for public portal uploads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageUrl,
      storageFileId,
      provider,
      uploaderName,
      uploaderEmail,
      password,
      skipNotification,
    } = body;

    console.log("[Portal Confirm Upload] Request:", {
      portalId,
      fileName,
      fileSize,
      provider,
      uploaderName,
      uploaderEmail,
      skipNotification,
    });

    if (!portalId || !fileName || !fileSize || !storageFileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ensure storageUrl is at least an empty string
    const finalStorageUrl = storageUrl || "";

    // Verify portal exists and get owner info
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: {
        user: true,
      },
    });

    if (!portal) {
      console.log("[Portal Confirm Upload] Portal not found:", portalId);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Hash password if provided
    let passwordHash = null;

    if (password && password.trim() !== "") {
      passwordHash = hashPassword(password.trim());
    }

    // Save file metadata to database
    console.log("[Portal Confirm Upload] Saving file metadata to database...");
    const file = await prisma.file.create({
      data: {
        name: fileName,
        size: BigInt(fileSize),
        mimeType: mimeType || "application/octet-stream",
        storageUrl: finalStorageUrl,
        storageFileId: storageFileId || null,
        portalId: portalId,
        passwordHash,
        uploaderName: uploaderName || null,
        uploaderEmail: uploaderEmail || null,
      },
    });

    console.log("[Portal Confirm Upload] File metadata saved:", file.id);

    // Send email notification to portal owner if not skipped
    if (!skipNotification) {
      try {
        await sendFileUploadNotification({
          userEmail: portal.user.email,
          portalName: portal.name,
          portalSlug: portal.slug,
          files: [
            {
              name: fileName,
              size: formatFileSize(Number(fileSize)),
            },
          ],
          uploaderName: uploaderName || undefined,
          uploaderEmail: uploaderEmail || undefined,
        });
        console.log("[Portal Confirm Upload] Email notification sent");
      } catch (emailError) {
        console.error(
          "[Portal Confirm Upload] Failed to send email notification:",
          emailError,
        );
        // Don't fail the upload if email fails
      }
    } else {
      console.log(
        "[Portal Confirm Upload] Email notification skipped (batch mode)",
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        ...file,
        size: file.size.toString(), // Convert BigInt to string for JSON
      },
      provider,
    });
  } catch (error) {
    console.error("[Portal Confirm Upload] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to confirm upload";

    return NextResponse.json(
      {
        error: "Failed to confirm upload",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
