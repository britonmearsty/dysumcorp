import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";
import { headR2Object } from "@/lib/r2-client";
import { applyUploadRateLimit } from "@/lib/rate-limit";
import { checkPortalTrialExpiration } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portals/r2-single-complete
 * Called by the browser after a single-shot (non-multipart) upload completes.
 * Captures the R2 ETag for idempotency tracking.
 *
 * Body: { uploadToken, stagingKey }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyUploadRateLimit(request);

  if (rateLimitResponse) return rateLimitResponse;

  const requestId = Math.random().toString(36).slice(2, 8);

  console.log(
    `[r2-single-complete:${requestId}] POST /api/portals/r2-single-complete`,
  );

  try {
    const body = await request.json();
    const { uploadToken, stagingKey } = body;

    if (!uploadToken || !stagingKey) {
      return NextResponse.json(
        { error: "uploadToken and stagingKey are required" },
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

    console.log(
      `[r2-single-complete:${requestId}] Capturing r2Etag for: ${stagingKey}`,
    );

    const r2Head = await headR2Object(stagingKey);

    if (!r2Head) {
      console.error(
        `[r2-single-complete:${requestId}] R2 object not found: ${stagingKey}`,
      );

      return NextResponse.json(
        { error: "R2 object not found" },
        { status: 404 },
      );
    }

    await prisma.r2StagingUpload.update({
      where: { stagingKey },
      data: {
        status: "UPLOADED_TO_R2",
        r2Etag: r2Head.etag ?? null,
        r2Hash: r2Head.hash ?? null,
      },
    });

    console.log(
      `[r2-single-complete:${requestId}] ✓ r2Etag captured: ${r2Head.etag}`,
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
              `[r2-single-complete:${requestId}] 🚫 Trial portal ${portal.id} deactivated: file limit reached (${fileCount}/10)`,
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      `[r2-single-complete:${requestId}] ❌ UNCAUGHT ERROR:`,
      error,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
