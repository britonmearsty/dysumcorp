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
import {
  getRateLimit,
  downloadRateLimit,
  fallbackDownloadLimit,
} from "@/lib/rate-limit";
import { sendFileDownloadNotification } from "@/lib/email-service";
import { verifyPassword } from "@/lib/password-utils";

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

    // Apply rate limiting based on IP address
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await getRateLimit(
      downloadRateLimit,
      fallbackDownloadLimit,
      `download:${ip}`,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many download requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

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

    // Send email notification to portal owner (async, don't wait)
    try {
      const portalOwner = await prisma.user.findUnique({
        where: { id: file.portal.userId },
        select: { email: true },
      });

      if (portalOwner?.email) {
        sendFileDownloadNotification({
          userEmail: portalOwner.email,
          fileName: file.name,
          portalName: file.portal.name,
          downloaderName: session.user.name || undefined,
        }).catch((error) => {
          console.error("Failed to send download notification:", error);
        });
      }
    } catch (error) {
      console.error("Error preparing download notification:", error);
    }

    // Check if file has expired
    if (file.expiresAt && file.expiresAt < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    // Check if file is password protected
    if (file.passwordHash) {
      const password = request.headers.get("x-file-password");
      if (!password) {
        return NextResponse.json(
          {
            error: "Password required",
            requiresPassword: true,
          },
          { status: 401 },
        );
      }

      // Verify password
      if (!verifyPassword(password, file.passwordHash)) {
        return NextResponse.json(
          {
            error: "Invalid password",
            requiresPassword: true,
          },
          { status: 401 },
        );
      }
    }

    // If it's a cloud storage URL, download from it
    if (file.storageUrl.startsWith("http")) {
      try {
        let buffer: Buffer | null = null;

        // Try Google Drive first
        const googleToken = await getValidToken(session.user.id, "google");

        if (googleToken) {
          // Extract file ID from Google Drive URL
          let fileId = file.storageUrl;
          if (file.storageUrl.includes("drive.google.com")) {
            const match = file.storageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
              fileId = match[1];
            }
          } else if (file.storageUrl.includes("docs.google.com")) {
            const match = file.storageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
              fileId = match[1];
            }
          }

          buffer = await downloadFromGoogleDrive(googleToken, fileId);
        }

        // Try Dropbox if Google Drive failed
        if (!buffer) {
          const dropboxToken = await getValidToken(session.user.id, "dropbox");

          if (dropboxToken) {
            // For Dropbox, storageUrl is the file ID, we need to get the file path
            // This is a simplified approach - you might need to store the full path
            buffer = await downloadFromDropbox(dropboxToken, file.storageUrl);
          }
        }

        if (buffer) {
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": file.mimeType,
              "Content-Disposition": `attachment; filename="${file.name}"`,
              "Cache-Control": "private, max-age=3600",
              "X-RateLimit-Limit": rateLimitResult.limit.toString(),
              "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
              "X-RateLimit-Reset": rateLimitResult.reset.toString(),
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
