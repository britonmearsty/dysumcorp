import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";
import {
  completeMultipartUpload,
  abortMultipartUpload,
  headR2Object,
  type CompletedPart,
} from "@/lib/r2-client";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { checkPortalTrialExpiration } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portals/r2-complete
 * Called by the browser after all parts have been uploaded.
 * Finalizes the multipart upload so R2 assembles the object.
 *
 * Body: { uploadToken, stagingKey, uploadId, parts: [{ partNumber, etag }] }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyUploadRateLimit(request);

  if (rateLimitResponse) return rateLimitResponse;

  const requestId = Math.random().toString(36).slice(2, 8);

  console.log(`[r2-complete:${requestId}] POST /api/portals/r2-complete`);

  try {
    const body = await request.json();
    const { uploadToken, stagingKey, uploadId, parts } = body;

    if (
      !uploadToken ||
      !stagingKey ||
      !uploadId ||
      !Array.isArray(parts) ||
      parts.length === 0
    ) {
      return NextResponse.json(
        {
          error: "uploadToken, stagingKey, uploadId, and parts[] are required",
        },
        { status: 400 },
      );
    }

    const token = validateUploadToken(uploadToken);

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired upload token" },
        { status: 401 },
      );
    }

    if (token.stagingKey !== stagingKey) {
      return NextResponse.json(
        { error: "stagingKey does not match token" },
        { status: 403 },
      );
    }

    // Validate parts shape
    const completedParts: CompletedPart[] = parts.map((p: any) => ({
      PartNumber: Number(p.partNumber),
      ETag: String(p.etag),
    }));

    // Sort by part number — required by S3/R2
    completedParts.sort((a, b) => a.PartNumber - b.PartNumber);

    console.log(
      `[r2-complete:${requestId}] Completing multipart: key=${stagingKey} uploadId=${uploadId} parts=${completedParts.length}`,
    );

    try {
      await completeMultipartUpload(stagingKey, uploadId, completedParts);
    } catch (err) {
      console.error(
        `[r2-complete:${requestId}] CompleteMultipartUpload failed, aborting:`,
        err,
      );
      await abortMultipartUpload(stagingKey, uploadId).catch(() => {});

      return NextResponse.json(
        { error: "Failed to complete multipart upload" },
        { status: 500 },
      );
    }

    // Mark staging record as upload-complete (worker will set it to "DELIVERED" after transfer)
    const r2Head = await headR2Object(stagingKey);

    await prisma.r2StagingUpload.update({
      where: { stagingKey },
      data: {
        status: "UPLOADED_TO_R2",
        r2Etag: r2Head?.etag ?? null,
        r2Hash: r2Head?.hash ?? null,
      },
    });

    console.log(
      `[r2-complete:${requestId}] ✓ Multipart complete, staging status → uploaded`,
    );

    // Check if trial portal has reached file limit and deactivate if so
    const portalId = token.portalId;
    if (portalId) {
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

      if (
        portal?.isActive &&
        portal.user?.subscriptionPlan === "free" &&
        portal.user?.hasCreatedTrialPortal
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
            console.log(
              `[r2-complete:${requestId}] 🚫 Trial portal ${portal.id} deactivated: file limit reached (${fileCount}/10)`,
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[r2-complete:${requestId}] ❌ UNCAUGHT ERROR:`, error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
