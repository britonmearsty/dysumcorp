import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getValidToken,
  uploadToGoogleDrive,
  uploadToDropbox,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
} from "@/lib/storage-api";
import {
  getRateLimit,
  uploadRateLimit,
  fallbackUploadLimit,
} from "@/lib/rate-limit";
import { sendFileUploadNotification } from "@/lib/email-service";
import { hashPassword } from "@/lib/password-utils";

// Route segment config for App Router
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

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
// NOTE: This endpoint has a 4.5MB body size limit due to Vercel/Next.js constraints
// For files larger than 4MB, clients should be directed to use a different method
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

    console.log("[Portal Upload] Starting upload process...");

    // Check content length before parsing
    const contentLength = request.headers.get("content-length");
    const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB Vercel limit

    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      console.log(
        `[Portal Upload] File too large: ${contentLength} bytes (max: ${MAX_SIZE})`,
      );

      return NextResponse.json(
        {
          error: "File too large. Maximum file size is 4MB for direct uploads.",
          maxSize: MAX_SIZE,
          receivedSize: parseInt(contentLength),
        },
        { status: 413 },
      );
    }

    const formData = await request.formData();

    console.log("[Portal Upload] FormData parsed successfully");
    const portalId = formData.get("portalId") as string;
    const files = formData.getAll("files") as File[];
    const passwords = formData.getAll("passwords") as string[];

    console.log(
      `[Portal Upload] Portal ID: ${portalId}, Files: ${files.length}`,
    );

    if (!portalId) {
      console.log("[Portal Upload] Error: Missing portal ID");

      return NextResponse.json(
        { error: "Portal ID is required" },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      console.log("[Portal Upload] Error: No files provided");

      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Log file sizes
    files.forEach((file, i) => {
      console.log(
        `[Portal Upload] File ${i + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
    });

    // Verify portal exists and get owner info
    console.log("[Portal Upload] Fetching portal from database...");
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        storageProvider: true,
        storageFolderId: true,
        storageFolderPath: true,
        useClientFolders: true,
        user: true,
      },
    });

    if (!portal) {
      console.log("[Portal Upload] Error: Portal not found");

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    console.log(
      `[Portal Upload] Portal found: ${portal.name}, Owner: ${portal.user.email}`,
    );
    const userId = portal.userId;

    // Get cloud storage token (Google Drive or Dropbox)
    console.log("[Portal Upload] Checking for Google Drive connection...");
    let accessToken = await getValidToken(userId, "google");
    let provider: "google" | "dropbox" = "google";

    if (!accessToken) {
      console.log("[Portal Upload] No Google Drive, checking Dropbox...");
      accessToken = await getValidToken(userId, "dropbox");
      provider = "dropbox";
    }

    // Cloud storage is required - no local fallback
    if (!accessToken) {
      console.log("[Portal Upload] Error: No cloud storage connected");

      return NextResponse.json(
        {
          error:
            "Cloud storage not connected. Please connect Google Drive or Dropbox in Settings to upload files.",
        },
        { status: 400 },
      );
    }

    console.log(`[Portal Upload] Using ${provider} for storage`);

    // Determine folder structure
    let parentFolderId: string;
    let folderPath: string;

    if (portal.storageFolderId) {
      // Use custom folder selected in portal settings
      parentFolderId = portal.storageFolderId;
      folderPath = portal.storageFolderPath || portal.name;
    } else {
      // Default: use dysumcorp/portalname structure
      const rootFolder = await findOrCreateRootFolder(
        accessToken,
        portal.userId,
      );
      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
      );

      parentFolderId = portalFolder.id;
      folderPath = `dysumcorp/${portal.name}`;
    }

    // Get uploader info for client folder creation
    const uploaderName = formData.get("uploaderName") as string;
    const uploaderEmail = formData.get("uploaderEmail") as string;

    // Handle client folder if enabled
    if (portal.useClientFolders && uploaderName && uploaderName.trim()) {
      const clientFolder = await findOrCreateClientFolder(
        accessToken,
        parentFolderId,
        uploaderName.trim(),
      );

      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    console.log("[Portal Upload] Starting file uploads...");
    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        console.log(
          `[Portal Upload] Uploading file ${index + 1}/${files.length}: ${file.name}`,
        );
        let storageUrl: string;
        let actualSize = file.size;

        // Upload to cloud storage
        try {
          if (provider === "google") {
            console.log(
              `[Portal Upload] Uploading to Google Drive: ${file.name}`,
            );
            const result = await uploadToGoogleDrive(
              accessToken,
              `${folderPath}/${file.name}`,
              file,
              file.type || "application/octet-stream",
              parentFolderId,
            );

            storageUrl =
              result.webViewLink ||
              `https://drive.google.com/file/d/${result.id}/view`;
            actualSize = result.size ? Number(result.size) : file.size;
            console.log(
              `[Portal Upload] Google Drive upload successful: ${file.name}`,
            );
          } else {
            console.log(`[Portal Upload] Uploading to Dropbox: ${file.name}`);
            const result = await uploadToDropbox(
              accessToken,
              `/${folderPath}/${file.name}`,
              file,
            );

            storageUrl = result.id;
            actualSize = result.size ? Number(result.size) : file.size;
            console.log(
              `[Portal Upload] Dropbox upload successful: ${file.name}`,
            );
          }
        } catch (uploadError) {
          console.error(
            `[Portal Upload] Failed to upload ${file.name}:`,
            uploadError,
          );
          throw uploadError;
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
    const skipNotification = formData.get("skipNotification") === "true";

    if (!skipNotification) {
      try {
        const uploaderName = formData.get("uploaderName") as string;

        await sendFileUploadNotification({
          userEmail: portal.user.email,
          portalName: portal.name,
          portalSlug: portal.slug,
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
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json(
      {
        error: "Upload failed",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
