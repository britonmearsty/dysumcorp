import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendFileUploadNotification } from "@/lib/email-service";
import { checkPortalTrialExpiration } from "@/lib/access";
import { logger } from "@/lib/logger";

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

  logger.log(
    `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
  );
  logger.log(
    `[r2-confirm:${requestId}] POST /api/portals/r2-confirm (called by Worker)`,
  );

  try {
    const body = await request.json();

    logger.log(
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
      attempts: clientAttempts,
    } = body;

    // Map worker status to our state machine
    const statusMap: Record<string, string> = {
      uploaded_to_r2: "UPLOADED_TO_R2",
      uploading_to_r2: "UPLOADING_TO_R2",
      routing: "ROUTING",
      completed: "DELIVERED",
      failed: "FAILED",
    };
    const mappedStatus = statusMap[status] ?? status;

    // Authenticate the Worker
    logger.log(
      `[r2-confirm:${requestId}] Validating worker secret...`,
    );
    logger.log(
      `[r2-confirm:${requestId}] workerSecret provided: ${!!workerSecret} (length: ${workerSecret?.length})`,
    );
    logger.log(
      `[r2-confirm:${requestId}] env WORKER_SECRET present: ${!!process.env.WORKER_SECRET} (length: ${process.env.WORKER_SECRET?.length})`,
    );

    if (!workerSecret || workerSecret !== process.env.WORKER_SECRET) {
      logger.error(
        `[r2-confirm:${requestId}] ❌ Unauthorized: worker secret mismatch`,
      );

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.log(`[r2-confirm:${requestId}] ✓ Worker secret valid`);

    if (!stagingKey || !status) {
      logger.error(
        `[r2-confirm:${requestId}] ❌ Missing required fields`,
      );

      return NextResponse.json(
        { error: "stagingKey and status are required" },
        { status: 400 },
      );
    }

    logger.log(
      `[r2-confirm:${requestId}] Looking up staging record for key: ${stagingKey}`,
    );
    logger.log(
      `[r2-confirm:${requestId}] status: ${status} -> mapped: ${mappedStatus}`,
    );

    // Handle intermediate/progress statuses from worker
    if (
      mappedStatus === "UPLOADED_TO_R2" ||
      mappedStatus === "UPLOADING_TO_R2" ||
      mappedStatus === "ROUTING"
    ) {
      logger.log(
        `[r2-confirm:${requestId}] Updating staging to intermediate status: ${mappedStatus}`,
      );
      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: { status: mappedStatus },
      });

      return NextResponse.json({ success: true, status: mappedStatus });
    }

    if (mappedStatus === "DELIVERED" || status === "completed") {
      logger.log(
        `[r2-confirm:${requestId}] Processing COMPLETED status...`,
      );

      // ── Resolve or create UploadSession ──────────────────────────────────
      let resolvedSessionId: string | null = clientSessionId ?? null;

      logger.log(
        `[r2-confirm:${requestId}] clientSessionId: ${clientSessionId}`,
      );

      if (resolvedSessionId) {
        logger.log(
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
        logger.log(
          `[r2-confirm:${requestId}] ✓ UploadSession updated`,
        );
      } else {
        logger.log(
          `[r2-confirm:${requestId}] Creating new UploadSession...`,
        );
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
        logger.log(
          `[r2-confirm:${requestId}] ✓ UploadSession created: ${resolvedSessionId}`,
        );
      }

      // ── Save File record ──────────────────────────────────────────────────
      logger.log(
        `[r2-confirm:${requestId}] Creating file record...`,
      );
      logger.log(
        `[r2-confirm:${requestId}] File data:`,
        {
          name: fileName,
          size: fileSize,
          mimeType,
          storageFileId,
          storageUrl,
          provider,
          portalId,
          uploadSessionId: resolvedSessionId,
        },
      );

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

      logger.log(
        `[r2-confirm:${requestId}] ✓ File record created: ${file.id}`,
      );

      // Check if trial portal has reached file limit and deactivate if so
      const portal = await prisma.portal.findUnique({
        where: { id: portalId },
        select: {
          id: true,
          userId: true,
          isActive: true,
          user: {
            select: {
              subscriptionPlan: true,
              hasCreatedTrialPortal: true,
            },
          },
        },
      });

      if (portal?.isActive && portal.user) {
        if (
          portal.user.subscriptionPlan === "free" &&
          portal.user.hasCreatedTrialPortal
        ) {
          const trialCheck = await checkPortalTrialExpiration(portal.id);
          if (!trialCheck.isExpired) {
            const fileCount = await prisma.file.count({
              where: { portalId: portal.id },
            });
            if (fileCount >= 10) {
              await prisma.portal.update({
                where: { id: portal.id },
                data: { isActive: false },
              });
              logger.log(
                `[r2-confirm:${requestId}] 🚫 Trial portal ${portal.id} deactivated: file limit reached (${fileCount}/10)`,
              );
            }
          }
        }
      }

      // ── Update staging record with delivery details ─────────────────────────
      logger.log(
        `[r2-confirm:${requestId}] Updating R2StagingUpload to DELIVERED...`,
      );
      // Get current attempts to increment (track total delivery attempts)
      const staging = await prisma.r2StagingUpload.findUnique({
        where: { stagingKey },
        select: { attempts: true },
      });
      const currentAttempts = staging?.attempts ?? 0;

      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: {
          status: "DELIVERED",
          fileId: file.id,
          targetProvider: provider,
          targetPath: storageUrl ?? null,
          targetFileId: storageFileId ?? null,
          attempts: currentAttempts + 1,
          lastError: null, // Clear error on success
        },
      });
      logger.log(
        `[r2-confirm:${requestId}] ✓ R2StagingUpload updated with delivery details`,
      );

      // ── Email notification (respects skipNotification + user prefs) ───────
      if (!skipNotification) {
        logger.log(
          `[r2-confirm:${requestId}] Sending upload notification email...`,
        );
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
            logger.log(
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
            logger.log(
              `[r2-confirm:${requestId}] ✓ Email notification sent`,
            );
          } else {
            logger.warn(
              `[r2-confirm:${requestId}] ⚠️ Portal not found for notification`,
            );
          }
        } catch (emailErr) {
          logger.error(
            `[r2-confirm:${requestId}] ❌ Failed to send email notification:`,
            emailErr,
          );
        }
      } else {
        logger.log(
          `[r2-confirm:${requestId}] Skipping email notification (skipNotification=true)`,
        );
      }

      logger.log(
        `[r2-confirm:${requestId}] ✓ Delivery confirmed successfully`,
      );
      logger.log(
        `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════\n`,
      );

      return NextResponse.json({
        success: true,
        fileId: file.id,
        uploadSessionId: resolvedSessionId,
      });
    }

    if (mappedStatus === "FAILED" || status === "failed") {
      logger.error(
        `[r2-confirm:${requestId}] ❌ Worker reported FAILED status`,
      );
      logger.error(
        `[r2-confirm:${requestId}] Transfer error:`,
        transferError,
      );

      // Get current staging record to increment attempts
      const staging = await prisma.r2StagingUpload.findUnique({
        where: { stagingKey },
        select: { attempts: true },
      });
      const currentAttempts = staging?.attempts ?? 0;

      logger.log(
        `[r2-confirm:${requestId}] Updating R2StagingUpload to FAILED (attempt ${currentAttempts + 1})...`,
      );
      await prisma.r2StagingUpload.update({
        where: { stagingKey },
        data: {
          status: "FAILED",
          attempts: currentAttempts + 1,
          lastError: transferError ?? "Unknown error",
        },
      });
      logger.log(
        `[r2-confirm:${requestId}] ✓ R2StagingUpload updated to DELIVERED`,
      );

      logger.error(
        `[r2-confirm:${requestId}] Transfer failed for stagingKey=${stagingKey}:`,
        transferError,
      );
      logger.log(
        `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
      );

      return NextResponse.json({
        success: true,
        attempts: currentAttempts + 1,
      });
    }

    logger.error(`[r2-confirm:${requestId}] ❌ Unknown status: ${status}`);

    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  } catch (error) {
    logger.error(
      `[r2-confirm:${requestId}] ❌ UNCAUGHT ERROR:`,
      error,
    );
    logger.error(
      `[r2-confirm:${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "N/A",
    );
    logger.error(
      `[r2-confirm:${requestId}] ═══════════════════════════════════════════════════════`,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
