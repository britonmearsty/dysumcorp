import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getValidToken,
  downloadFromGoogleDrive,
  downloadFromDropbox,
} from "@/lib/storage-api";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/files/[id]/download - Download a file
export async function GET(
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

    // Increment download counter
    await prisma.file.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });

    // If it's a cloud storage URL, download from it instead of redirecting
    if (file.storageUrl.startsWith("http")) {
      try {
        let buffer: Buffer | null = null;

        // Try Google Drive first
        const googleToken = await getValidToken(session.user.id, "google");

        if (googleToken) {
          const fileId = file.storageUrl.split("/").pop() || file.storageUrl;

          buffer = await downloadFromGoogleDrive(googleToken, fileId);
        }

        // Try Dropbox if Google Drive failed
        if (!buffer) {
          const dropboxToken = await getValidToken(session.user.id, "dropbox");

          if (dropboxToken) {
            buffer = await downloadFromDropbox(dropboxToken, file.storageUrl);
          }
        }

        if (buffer) {
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": file.mimeType,
              "Content-Disposition": `attachment; filename="${file.name}"`,
            },
          });
        }
      } catch (error) {
        console.error("Failed to download from cloud storage:", error);
      }
    }

    // If all else fails, return error
    return NextResponse.json(
      { error: "File not available for download" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error downloading file:", error);

    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}
