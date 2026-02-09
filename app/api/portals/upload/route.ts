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

    // Try to get Google Drive token first, fallback to Dropbox
    let accessToken = await getValidToken(userId, "google");
    let provider: "google" | "dropbox" = "google";

    if (!accessToken) {
      accessToken = await getValidToken(userId, "dropbox");
      provider = "dropbox";
    }

    // If no cloud storage connected, use local storage fallback
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        let storageUrl = `/uploads/${portalId}/${file.name}`; // Fallback
        let actualSize = file.size;

        try {
          if (accessToken) {
            // Upload to cloud storage directly with the File object (Blob)
            if (provider === "google") {
              const result = await uploadToGoogleDrive(
                accessToken,
                `${portal.name}/${file.name}`,
                file, // Pass File object directly
                file.type || "application/octet-stream",
              );

              storageUrl = result.webViewLink || result.id;
              actualSize = result.size ? Number(result.size) : file.size;
            } else {
              const result = await uploadToDropbox(
                accessToken,
                `/${portal.name}/${file.name}`,
                file, // Pass File object directly
              );

              storageUrl = result.id;
              actualSize = result.size ? Number(result.size) : file.size;
            }
          }
        } catch (uploadError) {
          console.error(
            "Cloud upload failed, using local fallback:",
            uploadError,
          );
          // Continue with local storage URL
        }

        // Store file metadata in database
        const fileIndex = files.indexOf(file);
        const password = passwords[fileIndex];
        let passwordHash = null;

        if (password && password.trim() !== "") {
          passwordHash = hashPassword(password.trim());
        }

        return await prisma.file.create({
          data: {
            name: file.name,
            size: BigInt(actualSize),
            mimeType: file.type || "application/octet-stream",
            storageUrl: storageUrl,
            portalId: portalId,
            passwordHash,
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
        provider: accessToken ? provider : "local",
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

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
