import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
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
    const session = await auth.api.getSession({
      headers: request.headers,
    });

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

    // Try to delete from cloud storage if it's a cloud URL
    if (
      file.storageUrl.startsWith("http") ||
      file.storageUrl.includes("drive.google.com")
    ) {
      try {
        const accessToken = await getValidToken(session.user.id, "google");

        if (accessToken) {
          // Extract file ID from URL or use storageUrl as ID
          const fileId = file.storageUrl.split("/").pop() || file.storageUrl;

          await deleteFromGoogleDrive(accessToken, fileId);
        }
      } catch (error) {
        console.error("Failed to delete from Google Drive:", error);
        // Continue with database deletion even if cloud deletion fails
      }
    } else if (file.storageUrl.includes("dropbox")) {
      try {
        const accessToken = await getValidToken(session.user.id, "dropbox");

        if (accessToken) {
          await deleteFromDropbox(accessToken, file.storageUrl);
        }
      } catch (error) {
        console.error("Failed to delete from Dropbox:", error);
        // Continue with database deletion even if cloud deletion fails
      }
    }

    // Delete from database
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
