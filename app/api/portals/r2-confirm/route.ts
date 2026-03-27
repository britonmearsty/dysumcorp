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
 * Validates WORKER_SECRET, creates/updates UploadSession, saves File record, updates staging record.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);
  console.log(
    `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
  );
  console.log(
    `[r2-confirm:${requestId}] POST /api/portals/r2-confirm (called by Worker)`,
  );

  try {
    const body = await request.json();
    console.log(
      `[r2-confirm:${requestId}] Request body:`,
      JSON.stringify(body, null, 2),
    );

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
      uploadSessionId: clientSessionId,
      skipNotification,
      error: transferError,
    } = body;

    // Authenticate the Worker
    console.log(`[r2-confirm:${requestId}] Authenticating worker...`);
    console.log(
      `[r2-confirm:${requestId}] workerSecret provided: ${!!workerSecret} (length: ${workerSecret?.length})`,
    );
    console.log(
      `[r2-confirm:${requestId}] env WORKER_SECRET present: ${!!process.env.WORKER_SECRET} (length: ${process.env.WORKER_SECRET?.length})`,
    );

    if (!workerSecret || workerSecret !== process.env.WORKER_SECRET) {
      console.error(
        `[r2-confirm:${requestId}] ❌ Unauthorized: worker secret mismatch`,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[r2-confirm:${requestId}] ✓ Worker authenticated`);

    if (!stagingKey || !status) {
      console.error(`[r2-confirm:${requestId}] ❌ Missing required fields`);
      return NextResponse.json(
        { error: "stagingKey and status are required" },
        { status: 400 },
      );
    }

    console.log(`[r2-confirm:${requestId}] stagingKey: ${stagingKey}`);
    console.log(`[r2-confirm:${requestId}] status: ${status}`);

    if (status === "completed") {
      console.log(`[r2-confirm:${requestId}] Processing COMPLETED status...`);

      // ── Resolve or create UploadSession ──────────────────────────────────
      let resolvedSessionId: string | null = clientSessionId ?? null;
      console.log(
        `[r2-confirm:${requestId}] clientSessionId: ${clientSessionId}`,
      );

      if (resolvedSessionId) {
        console.log(
          `[r2-confirm:${requestId}] Updating existing UploadSession: ${resolvedSessionId}`,
        );
        // Session already exists — increment counts
        await prisma.uploadSession.update({
          where: { id: resolvedSessionId },
          data: {
            fileCount: { increment: 1 },
            totalSize: { increment: BigInt(fileSize) },
          },
        });
        console.log(`[r2-confirm:${requestId}] ✓ UploadSession updated`);
      } else {
        console.log(`[r2-confirm:${requestId}] Creating new UploadSession...`);
        // No session yet — create one (first file in this batch)
        const session = await prisma.uploadSession.create({
          data: {
            portalId,
            uploaderName: uploaderName ?? null,
            uploaderEmail: uploaderEmail ?? null,
            uploaderNotes: uploaderNotes ?? null,
            fileCount: 1,
            totalSize: BigInt(fileSize),
          },
        });
        resolvedSessionId = session.id;
        console.log(
          `[r2-confirm:${requestId}] ✓ UploadSession created: ${resolvedSessionId}`,
        );
      }

      // ── Save File record ──────────────────────────────────────────────────
      console.log(`[r2-confirm:${requestId}] Creating File record...`);
      console.log(`[r2-confirm:${requestId}] File data:`, {
        name: fileName,
        size: fileSize,
        mimeType,
        storageFileId,
        storageUrl,
        provider,
        portalId,
        uploadSessionId: resolvedSessionId,
      });

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
          uploadSessionId: resolvedSessionId,
        },
      });
      console.log(
        `[r2-confirm:${requestId}] ✓ File record created: ${file.id}`,
      );

      // Increment trial file count for trial users
      const portal = await prisma.portal.findUnique({
        where: { id: portalId },
        select: { userId: true },
      });
      if (portal) {
        const user = await prisma.user.findUnique({
          where: { id: portal.userId },
          select: { subscriptionPlan: true },
        });
        if (user && user.subscriptionPlan === "trial") {
          await prisma.user.update({
            where: { id: portal.userId },
            data: { trialFileCount: { increment: 1 } },
          });
          console.log(
            `[r2-confirm:${requestId}] ✓ Trial file count incremented`,
          );
        }
      }

      // ── Update staging record with fileId ─────────────────────────────────
      console.log(
        `[r2-confirm:${requestId}] Updating R2StagingUpload to completed...`,
      );
      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: { status: "completed", fileId: file.id },
      });
      console.log(`[r2-confirm:${requestId}] ✓ R2StagingUpload updated`);

      // ── Email notification (respects skipNotification + user prefs) ───────
      if (!skipNotification) {
        console.log(`[r2-confirm:${requestId}] Sending email notification...`);
        try {
          const portal = await prisma.portal.findUnique({
            where: { id: portalId },
            select: {
              name: true,
              slug: true,
              user: { select: { email: true } },
            },
          });

          if (portal) {
            console.log(
              `[r2-confirm:${requestId}] Portal found for notification: ${portal.name}`,
            );
            await sendFileUploadNotification({
              userEmail: portal.user.email,
              portalName: portal.name,
              portalSlug: portal.slug,
              files: [
                { name: fileName, size: formatFileSize(Number(fileSize)) },
              ],
              uploaderName: uploaderName ?? undefined,
              uploaderEmail: uploaderEmail ?? undefined,
            });
            console.log(`[r2-confirm:${requestId}] ✓ Email notification sent`);
          } else {
            console.warn(
              `[r2-confirm:${requestId}] ⚠️ Portal not found for notification`,
            );
          }
        } catch (emailErr) {
          console.error(
            `[r2-confirm:${requestId}] ❌ Email notification failed (non-fatal):`,
            emailErr,
          );
        }
      } else {
        console.log(
          `[r2-confirm:${requestId}] Skipping email notification (skipNotification=true)`,
        );
      }

      console.log(
        `[r2-confirm:${requestId}] ✓✓✓ SUCCESS - Returning file data`,
      );
      console.log(
        `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
      );
      return NextResponse.json({
        success: true,
        fileId: file.id,
        uploadSessionId: resolvedSessionId,
      });
    }

    if (status === "failed") {
      console.error(
        `[r2-confirm:${requestId}] ❌ Worker reported FAILED status`,
      );
      console.error(`[r2-confirm:${requestId}] Transfer error:`, transferError);

      console.log(
        `[r2-confirm:${requestId}] Updating R2StagingUpload to failed...`,
      );
      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: { status: "failed" },
      });
      console.log(
        `[r2-confirm:${requestId}] ✓ R2StagingUpload marked as failed`,
      );

      console.error(
        `[r2-confirm:${requestId}] Transfer failed for stagingKey=${stagingKey}:`,
        transferError,
      );
      console.log(
        `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
      );
      return NextResponse.json({ success: true });
    }

    console.error(`[r2-confirm:${requestId}] ❌ Unknown status: ${status}`);
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  } catch (error) {
    console.error(`[r2-confirm:${requestId}] ❌❌❌ UNCAUGHT ERROR:`, error);
    console.error(
      `[r2-confirm:${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "N/A",
    );
    console.error(
      `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
