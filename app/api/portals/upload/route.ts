import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  getValidToken,
  uploadToGoogleDrive,
  uploadToDropbox,
} from "@/lib/storage-api";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/portals/upload - Upload files to a portal (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const portalId = formData.get("portalId") as string;
    const files = formData.getAll("files") as File[];

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
        return await prisma.file.create({
          data: {
            name: file.name,
            size: BigInt(actualSize),
            mimeType: file.type || "application/octet-stream",
            storageUrl: storageUrl,
            portalId: portalId,
          },
        });
      }),
    );

    return NextResponse.json({
      success: true,
      files: uploadedFiles.map((f: any) => ({
        ...f,
        size: f.size.toString(), // Convert BigInt to string for JSON
      })),
      provider: accessToken ? provider : "local",
    });
  } catch (error) {
    console.error("Portal upload error:", error);

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
