import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { hashPassword } from "@/lib/password-utils";

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
        { status: 400 },
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
    let passwordHash: string | null = null;

    if (password && password.trim() !== "") {
      passwordHash = await hashPassword(password.trim());
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
      { status: 500 },
    );
  }
}
