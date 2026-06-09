import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";
import { applyStatusPollRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/portals/r2-status?stagingKey=...&uploadToken=...
 * Polled by the browser to check whether the Worker has finished the transfer.
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyStatusPollRateLimit(request);

  if (rateLimitResponse) return rateLimitResponse;

  const requestId = Math.random().toString(36).slice(2, 8);

  logger.log(
    `[r2-status:${requestId}] ═══════════════════════════════════════════════════════`,
  );
  logger.log(`[r2-status:${requestId}] GET /api/portals/r2-status`);

  try {
    const { searchParams } = new URL(request.url);
    const stagingKey = searchParams.get("stagingKey");
    const uploadToken = searchParams.get("uploadToken");

    logger.log(`[r2-status:${requestId}] stagingKey: ${stagingKey}`);
    logger.log(
      `[r2-status:${requestId}] uploadToken length: ${uploadToken?.length}`,
    );

    if (!stagingKey || !uploadToken) {
      logger.error(`[r2-status:${requestId}] ❌ Missing required params`);

      return NextResponse.json(
        { error: "stagingKey and uploadToken are required" },
        { status: 400 },
      );
    }

    logger.log(`[r2-status:${requestId}] Validating upload token...`);
    const token = validateUploadToken(uploadToken);

    if (!token) {
      logger.error(`[r2-status:${requestId}] ❌ Token validation failed`);

      return NextResponse.json(
        { error: "Invalid or expired upload token" },
        { status: 401 },
      );
    }
    logger.log(`[r2-status:${requestId}] ✓ Token valid`);

    // Ensure the token was issued for this exact staging key
    if (token.stagingKey !== stagingKey) {
      logger.error(`[r2-status:${requestId}] ❌ stagingKey mismatch`);
      logger.error(
        `[r2-status:${requestId}] Token stagingKey: ${token.stagingKey}`,
      );
      logger.error(
        `[r2-status:${requestId}] Request stagingKey: ${stagingKey}`,
      );

      return NextResponse.json(
        { error: "stagingKey does not match token" },
        { status: 403 },
      );
    }
    logger.log(`[r2-status:${requestId}] ✓ stagingKey matches token`);

    logger.log(`[r2-status:${requestId}] Querying R2StagingUpload record...`);
    const staging = await prisma.r2StagingUpload.findUnique({
      where: { stagingKey },
    });

    if (!staging) {
      logger.error(`[r2-status:${requestId}] ❌ Staging record not found`);

      return NextResponse.json(
        { error: "Staging record not found" },
        { status: 404 },
      );
    }

    logger.log(`[r2-status:${requestId}] Staging record found:`, {
      id: staging.id,
      status: staging.status,
      fileId: staging.fileId,
      createdAt: staging.createdAt,
      updatedAt: staging.updatedAt,
    });

    if (staging.status === "DELIVERED" || staging.status === "completed") {
      logger.log(
        `[r2-status:${requestId}] Status is COMPLETED, fetching File record...`,
      );
      // Use the direct fileId FK set by r2-confirm — no fuzzy matching
      const file = staging.fileId
        ? await prisma.file.findUnique({
            where: { id: staging.fileId },
            select: {
              id: true,
              name: true,
              size: true,
              mimeType: true,
              storageUrl: true,
              uploadedAt: true,
              uploadSessionId: true,
            },
          })
        : null;

      if (file) {
        logger.log(`[r2-status:${requestId}] ✓ File record found:`, {
          id: file.id,
          name: file.name,
          size: file.size.toString(),
          uploadSessionId: file.uploadSessionId,
        });
      } else {
        logger.warn(
          `[r2-status:${requestId}] ⚠️ Status completed but no File record found (fileId: ${staging.fileId})`,
        );
      }

      logger.log(`[r2-status:${requestId}] ✓✓✓ Returning completed status`);
      logger.log(
        `[r2-status:${requestId}] ═══════════════════════════════════════════════════════`,
      );

      return NextResponse.json({
        status: "completed",
        file: file ? { ...file, size: file.size.toString() } : null,
        delivery: {
          provider: staging.targetProvider,
          path: staging.targetPath,
          fileId: staging.targetFileId,
        },
      });
    }

    logger.log(
      `[r2-status:${requestId}] Status: ${staging.status} (still processing)`,
    );
    logger.log(
      `[r2-status:${requestId}] ═══════════════════════════════════════════════════════`,
    );

    return NextResponse.json({ status: staging.status });
  } catch (error) {
    logger.error(`[r2-status:${requestId}] ❌❌❌ UNCAUGHT ERROR:`, error);
    logger.error(
      `[r2-status:${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "N/A",
    );
    logger.error(
      `[r2-status:${requestId}] ═══════════════════════════════════════════════════════`,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
