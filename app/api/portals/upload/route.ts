import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getValidToken,
  uploadToGoogleDrive,
  uploadToDropbox,
} from "@/lib/storage-api";
import {
  getRateLimit,
  uploadRateLimit,
  fallbackUploadLimit,
} from "@/lib/rate-limit";
import { sendFileUploadNotification } from "@/lib/email-service";
import { hashPassword } from "@/lib/password-utils";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// Note: Body size limit in App Router is controlled by Vercel's platform limit (4.5 MB)
// For larger files, use the direct upload endpoints

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// POST /api/portals/upload - Upload files to a portal (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting based on IP address
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await getRateLimit(
      uploadRateLimit,
      fallbackUploadLimit,
      `upload:${ip}`,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
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

    const formData = await request.formData();
    const portalId = formData.get("portalId") as string;
    const files = formData.getAll("files") as File[];
    const passwords = formData.getAll("passwords") as string[];

    if (!portalId) {
      return NextResponse.json(
        { error: "Portal ID is required" },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Verify portal exists and get owner info
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: {
        user: true,
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    const userId = portal.userId;

    // Get cloud storage token (Google Drive or Dropbox)
    let accessToken = await getValidToken(userId, "google");
    let provider: "google" | "dropbox" = "google";

    if (!accessToken) {
      accessToken = await getValidToken(userId, "dropbox");
      provider = "dropbox";
    }

    // Cloud storage is required - no local fallback
    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Cloud storage not connected. Please connect Google Drive or Dropbox in Settings to upload files.",
        },
        { status: 400 }
      );
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        let storageUrl: string;
        let actualSize = file.size;

        // Upload to cloud storage
        if (provider === "google") {
          const result = await uploadToGoogleDrive(
            accessToken,
            `${portal.name}/${file.name}`,
            file,
            file.type || "application/octet-stream",
          );

          storageUrl = result.webViewLink || result.id;
          actualSize = result.size ? Number(result.size) : file.size;
        } else {
          const result = await uploadToDropbox(
            accessToken,
            `/${portal.name}/${file.name}`,
            file,
          );

          storageUrl = result.id;
          actualSize = result.size ? Number(result.size) : file.size;
        }

        // Store file metadata in database
        const fileIndex = files.indexOf(file);
        const password = passwords[fileIndex];
        let passwordHash = null;

        if (password && password.trim() !== "") {
          passwordHash = hashPassword(password.trim());
        }

        // Get uploader info from form data
        const uploaderName = formData.get("uploaderName") as string;
        const uploaderEmail = formData.get("uploaderEmail") as string;

        return await prisma.file.create({
          data: {
            name: file.name,
            size: BigInt(actualSize),
            mimeType: file.type || "application/octet-stream",
            storageUrl: storageUrl,
            portalId: portalId,
            passwordHash,
            uploaderName: uploaderName || null,
            uploaderEmail: uploaderEmail || null,
          },
        });
      }),
    );

    // Send email notification to portal owner
    try {
      const uploaderName = formData.get("uploaderName") as string;

      await sendFileUploadNotification({
        userEmail: portal.user.email,
        portalName: portal.name,
        files: uploadedFiles.map((f) => ({
          name: f.name,
          size: formatFileSize(Number(f.size)),
        })),
        uploaderName: uploaderName || undefined,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the upload if email fails
    }

    return NextResponse.json(
      {
        success: true,
        files: uploadedFiles.map((f: any) => ({
          ...f,
          size: f.size.toString(), // Convert BigInt to string for JSON
        })),
        provider,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Portal upload error:", error);
    
    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    
    return NextResponse.json({ 
      error: "Upload failed", 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 });
  }
}
