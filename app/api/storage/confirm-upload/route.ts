import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { getSessionFromRequest } from "@/lib/auth-server";
import { sendFileUploadNotification } from "@/lib/email-service";
import { hashPassword } from "@/lib/password-utils";

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

// POST /api/storage/confirm-upload - Confirm direct upload and save metadata
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageUrl,
      password,
      uploaderName,
      uploaderEmail,
    } = body;

    if (!portalId || !fileName || !fileSize || !storageUrl) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: portalId, fileName, fileSize, storageUrl",
        },
        { status: 400 }
      );
    }

    // Verify portal exists and belongs to user
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: { user: true },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (portal.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim() !== "") {
      passwordHash = hashPassword(password.trim());
    }

    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        name: fileName,
        size: BigInt(fileSize),
        mimeType: mimeType || "application/octet-stream",
        storageUrl: storageUrl,
        portalId: portalId,
        passwordHash,
        uploaderName: uploaderName || null,
        uploaderEmail: uploaderEmail || null,
      },
    });

    // Send email notification to portal owner
    try {
      await sendFileUploadNotification({
        userEmail: portal.user.email,
        portalName: portal.name,
        files: [
          {
            name: fileName,
            size: formatFileSize(Number(fileSize)),
          },
        ],
        uploaderName: uploaderName || undefined,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the upload if email fails
    }

    return NextResponse.json({
      success: true,
      file: {
        ...file,
        size: file.size.toString(), // Convert BigInt to string for JSON
      },
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
