import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  sendFileUploadNotification,
  getUserNotificationSettings,
} from "@/lib/email-service";

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

// POST /api/portals/batch-notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalId, files, uploaderName, uploaderEmail } = body;

    if (!portalId || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get portal and owner info
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: { user: true },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Send the batch notification
    try {
      const settings = await getUserNotificationSettings(portal.user.email);

      if (settings && !settings.notifyOnUpload) {
        console.log(
          `Upload notifications disabled for user: ${portal.user.email}`,
        );

        return NextResponse.json({
          success: true,
          message: "Notifications disabled",
        });
      }

      await sendFileUploadNotification({
        userEmail: portal.user.email,
        portalName: portal.name,
        portalSlug: portal.slug,
        files: files.map((f: any) => ({
          name: f.name,
          size: formatFileSize(f.size),
        })),
        uploaderName: uploaderName || undefined,
        uploaderEmail: uploaderEmail || undefined,
      });

      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error("[Batch Notification] Failed to send email:", emailError);

      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Batch Notification] Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
