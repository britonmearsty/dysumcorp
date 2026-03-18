import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFileUploadNotification } from "@/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * POST /api/portals/r2-confirm
 * Called by the Cloudflare Worker after completing (or failing) the R2 → Drive/Dropbox transfer.
 * Validates WORKER_SECRET, then saves the File record and updates the staging record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workerSecret,
      stagingKey,
      status,
      portalId,
      fileName,
      fileSize,
      mimeType,
      storageFileId,
      storageUrl,
      provider,
      uploaderName,
      uploaderEmail,
      uploaderNotes,
      uploadSessionId,
      error: transferError,
    } = body;

    // Authenticate the Worker
    if (!workerSecret || workerSecret !== process.env.WORKER_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stagingKey || !status) {
      return NextResponse.json(
        { error: "stagingKey and status are required" },
        { status: 400 },
      );
    }

    if (status === "completed") {
      // Save file metadata
      const file = await prisma.file.create({
        data: {
          name: fileName,
          size: BigInt(fileSize),
          mimeType: mimeType ?? "application/octet-stream",
          storageUrl: storageUrl ?? "",
          storageFileId: storageFileId ?? null,
          portalId,
          uploaderName: uploaderName ?? null,
          uploaderEmail: uploaderEmail ?? null,
          uploadSessionId: uploadSessionId ?? null,
        },
      });

      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: { status: "completed" },
      });

      // Send email notification (respects portal owner's notification prefs)
      try {
        const portal = await prisma.portal.findUnique({
          where: { id: portalId },
          select: { name: true, slug: true, user: { select: { email: true } } },
        });

        if (portal) {
          await sendFileUploadNotification({
            userEmail: portal.user.email,
            portalName: portal.name,
            portalSlug: portal.slug,
            files: [{ name: fileName, size: formatFileSize(Number(fileSize)) }],
            uploaderName: uploaderName ?? undefined,
            uploaderEmail: uploaderEmail ?? undefined,
          });
        }
      } catch (emailErr) {
        console.error("[r2-confirm] Email notification failed:", emailErr);
        // Non-fatal — file is already saved
      }

      return NextResponse.json({
        success: true,
        fileId: file.id,
      });
    }

    if (status === "failed") {
      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: { status: "failed" },
      });

      console.error(
        `[r2-confirm] Transfer failed for stagingKey=${stagingKey}:`,
        transferError,
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  } catch (error) {
    console.error("[r2-confirm] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
