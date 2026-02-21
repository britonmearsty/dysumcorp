import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { getSessionFromRequest } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getValidToken,
  deleteFromGoogleDrive,
  deleteFromDropbox,
} from "@/lib/storage-api";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// DELETE /api/files/[id] - Delete a file
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

    // Get file with portal info
    const file = await prisma.file.findFirst({
      where: {
        id,
        portal: {
          userId: session.user.id,
        },
      },
      include: {
        portal: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Try to delete from cloud storage
    let cloudDeleteSuccess = false;

    // Determine storage provider and file ID
    const isGoogleDrive =
      file.storageUrl.includes("drive.google.com") ||
      file.storageUrl.includes("docs.google.com") ||
      file.storageUrl.includes("googledrive.com");
    const isDropbox = file.storageUrl.includes("dropbox.com");

    // Use storageFileId if available, otherwise extract from URL
    let cloudFileId = file.storageFileId;

    if (!cloudFileId && isGoogleDrive) {
      // Try to extract file ID from URL
      const match =
        file.storageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        file.storageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        cloudFileId = match[1];
      }
    }

    if (isGoogleDrive && cloudFileId) {
      try {
        const accessToken = await getValidToken(session.user.id, "google");

        if (accessToken) {
          await deleteFromGoogleDrive(accessToken, cloudFileId);
          cloudDeleteSuccess = true;
        }
      } catch (error) {
        console.error("Failed to delete from Google Drive:", error);
      }
    } else if (isDropbox) {
      try {
        const accessToken = await getValidToken(session.user.id, "dropbox");

        if (accessToken) {
          // For Dropbox, use the path from storageUrl or construct it
          const dropboxPath = file.storageUrl.includes("dropbox.com")
            ? `/${file.name}` // Dropbox paths are typically just filenames
            : file.storageUrl;
          await deleteFromDropbox(accessToken, dropboxPath);
          cloudDeleteSuccess = true;
        }
      } catch (error) {
        console.error("Failed to delete from Dropbox:", error);
      }
    }

    // Delete from database
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      cloudDeleted: cloudDeleteSuccess,
    });
  } catch (error) {
    console.error("Error deleting file:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
