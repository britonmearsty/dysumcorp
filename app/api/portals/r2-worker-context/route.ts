import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
  verifyGoogleDriveFolderExists,
} from "@/lib/storage-api";
import {
  applyUploadRateLimit,
  applyRateLimit,
  UPLOAD_LIMIT,
  FALLBACK_UPLOAD_LIMIT,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portals/r2-worker-context
 * Called by the Cloudflare Worker to get storage credentials before transferring.
 * Auth: either WORKER_SECRET header/body OR valid upload token.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);

  logger.log(
    `[worker-context:${requestId}] ═══════════════════════════════════════════════════════`,
  );
  logger.log(
    `[worker-context:${requestId}] POST /api/portals/r2-worker-context`,
  );

  // IP-based rate limit — same budget as upload endpoints (50/min).
  // Worker calls come from a fixed Cloudflare egress IP so this won't
  // affect them in practice; it guards against token-holder abuse.
  const rateLimitResponse = await applyUploadRateLimit(request);

  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    logger.log(
      `[worker-context:${requestId}] Request body:`,
      JSON.stringify(body, null, 2),
    );

    const {
      uploadToken,
      uploaderName,
      workerSecret,
      parentFolderId: preResolvedFolderId,
      folderPath: preResolvedFolderPath,
    } = body;

    const envSecret = process.env.WORKER_SECRET;

    // Debug logging
    logger.log(
      `[worker-context:${requestId}] workerSecret present: ${!!workerSecret}, prefix: ${workerSecret?.slice(0, 6)}`,
    );
    logger.log(
      `[worker-context:${requestId}] env WORKER_SECRET present: ${!!envSecret}, prefix: ${envSecret?.slice(0, 6)}`,
    );
    logger.log(
      `[worker-context:${requestId}] match: ${workerSecret === envSecret}`,
    );

    // Authenticate: WORKER_SECRET takes priority (worker calls)
    const isWorkerCall = !!(
      workerSecret &&
      envSecret &&
      workerSecret === envSecret
    );

    logger.log(`[worker-context:${requestId}] isWorkerCall: ${isWorkerCall}`);

    if (!isWorkerCall) {
      logger.log(
        `[worker-context:${requestId}] Not a worker call, validating upload token...`,
      );
      // Fall back to upload token validation (direct/browser calls)
      if (!uploadToken) {
        logger.error(
          `[worker-context:${requestId}] ❌ uploadToken is required`,
        );

        return NextResponse.json(
          { error: "uploadToken is required" },
          { status: 400 },
        );
      }
      const token = validateUploadToken(uploadToken);

      if (!token) {
        logger.error(
          `[worker-context:${requestId}] ❌ Token validation failed`,
        );

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      logger.log(`[worker-context:${requestId}] ✓ Upload token valid`);

      // Per-stagingKey limit: 5 context fetches per key per minute.
      // This endpoint creates Drive/Dropbox folders — spamming it is expensive.
      if (token.stagingKey) {
        const keyLimit = await applyRateLimit(
          UPLOAD_LIMIT,
          FALLBACK_UPLOAD_LIMIT,
          `worker-ctx:${token.stagingKey}`,
        );

        if (keyLimit) return keyLimit;
      }
    } else {
      logger.log(
        `[worker-context:${requestId}] ✓ Worker authenticated via WORKER_SECRET`,
      );
    }

    // Decode token payload to get portalId
    if (!uploadToken) {
      logger.error(
        `[worker-context:${requestId}] ❌ uploadToken is required for decoding`,
      );

      return NextResponse.json(
        { error: "uploadToken is required" },
        { status: 400 },
      );
    }

    logger.log(`[worker-context:${requestId}] Decoding token payload...`);
    let tokenPayload: { portalId: string; uploaderName?: string };

    try {
      tokenPayload = JSON.parse(
        Buffer.from(uploadToken, "base64").toString("utf-8"),
      );
      logger.log(
        `[worker-context:${requestId}] ✓ Token decoded, portalId: ${tokenPayload.portalId}`,
      );
    } catch {
      logger.error(`[worker-context:${requestId}] ❌ Token decode failed`);

      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 },
      );
    }

    if (!tokenPayload.portalId) {
      logger.error(`[worker-context:${requestId}] ❌ Token missing portalId`);

      return NextResponse.json(
        { error: "Invalid token: missing portalId" },
        { status: 400 },
      );
    }

    logger.log(
      `[worker-context:${requestId}] Fetching portal: ${tokenPayload.portalId}`,
    );

    const portal = await prisma.portal.findUnique({
      where: { id: tokenPayload.portalId },
      select: {
        id: true,
        name: true,
        userId: true,
        storageProvider: true,
        storageFolderId: true,
        storageFolderPath: true,
        useClientFolders: true,
      },
    });

    if (!portal) {
      logger.error(`[worker-context:${requestId}] ❌ Portal not found`);

      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    logger.log(`[worker-context:${requestId}] ✓ Portal found:`, {
      id: portal.id,
      name: portal.name,
      userId: portal.userId,
      storageProvider: portal.storageProvider,
      storageFolderId: portal.storageFolderId,
      useClientFolders: portal.useClientFolders,
    });

    const provider =
      portal.storageProvider === "dropbox" ? "dropbox" : "google";

    logger.log(`[worker-context:${requestId}] Resolved provider: ${provider}`);

    logger.log(
      `[worker-context:${requestId}] Getting valid OAuth token for userId: ${portal.userId}...`,
    );
    const accessToken = await getValidToken(portal.userId, provider);

    if (!accessToken) {
      logger.error(
        `[worker-context:${requestId}] ❌ No ${provider} storage connected`,
      );

      return NextResponse.json(
        { error: `No ${provider} storage connected for this portal` },
        { status: 400 },
      );
    }
    logger.log(
      `[worker-context:${requestId}] ✓ Access token retrieved (length: ${accessToken.length})`,
    );

    // Resolve folder hierarchy
    logger.log(`[worker-context:${requestId}] Resolving folder hierarchy...`);
    let parentFolderId: string;
    let folderPath: string;

    // Short-circuit: if the client pre-resolved the folder, skip all Drive/Dropbox API calls.
    // This prevents the race condition where concurrent worker calls each try to create
    // the same folder, resulting in duplicate folders.
    if (preResolvedFolderId && preResolvedFolderPath) {
      logger.log(
        `[worker-context:${requestId}] ✓ Using pre-resolved folder: ${preResolvedFolderId} (${preResolvedFolderPath})`,
      );
      parentFolderId = preResolvedFolderId;
      folderPath = preResolvedFolderPath;
    } else if (portal.storageFolderId) {
      logger.log(
        `[worker-context:${requestId}] Using portal's configured folder`,
      );

      // Verify the stored folder still exists (may have been deleted from Drive/Dropbox)
      let folderStillExists = true;

      if (provider === "google") {
        folderStillExists = await verifyGoogleDriveFolderExists(
          accessToken,
          portal.storageFolderId,
        );
        if (!folderStillExists) {
          logger.warn(
            `[worker-context:${requestId}] ⚠️ Stored folder ${portal.storageFolderId} not found in Drive, falling back to auto-create`,
          );
        }
      }

      if (folderStillExists) {
        parentFolderId = portal.storageFolderId;
        folderPath = portal.storageFolderPath || portal.name;
        logger.log(
          `[worker-context:${requestId}] parentFolderId: ${parentFolderId}, folderPath: ${folderPath}`,
        );
      } else {
        // Folder is gone — create a new one and update the portal record
        const rootFolder = await findOrCreateRootFolder(
          accessToken,
          portal.userId,
          provider,
        );

        logger.log(
          `[worker-context:${requestId}] ✓ Root folder: ${rootFolder.id}`,
        );

        const portalFolder = await findOrCreatePortalFolder(
          accessToken,
          rootFolder.id,
          portal.name,
          provider,
        );

        logger.log(
          `[worker-context:${requestId}] ✓ New portal folder: ${portalFolder.id}`,
        );

        parentFolderId = portalFolder.id;
        folderPath = `dysumcorp/${portal.name}`;

        // Persist the new folder ID so future uploads don't hit this again
        await prisma.portal.update({
          where: { id: portal.id },
          data: {
            storageFolderId: parentFolderId,
            storageFolderPath: folderPath,
          },
        });
        logger.log(
          `[worker-context:${requestId}] ✓ Portal storageFolderId updated to ${parentFolderId}`,
        );
      }
    } else {
      logger.log(
        `[worker-context:${requestId}] Creating default folder structure...`,
      );
      const rootFolder = await findOrCreateRootFolder(
        accessToken,
        portal.userId,
        provider,
      );

      logger.log(
        `[worker-context:${requestId}] ✓ Root folder: ${rootFolder.id}`,
      );

      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
        provider,
      );

      logger.log(
        `[worker-context:${requestId}] ✓ Portal folder: ${portalFolder.id}`,
      );

      parentFolderId = portalFolder.id;
      folderPath = `dysumcorp/${portal.name}`;
      logger.log(`[worker-context:${requestId}] folderPath: ${folderPath}`);
    }

    // Client sub-folder if enabled — skip when folder was pre-resolved (already includes client folder)
    const clientName = uploaderName ?? tokenPayload.uploaderName;

    logger.log(
      `[worker-context:${requestId}] useClientFolders: ${portal.useClientFolders}, clientName: "${clientName}", preResolved: ${!!preResolvedFolderId}`,
    );

    if (!preResolvedFolderId && portal.useClientFolders && clientName?.trim()) {
      logger.log(
        `[worker-context:${requestId}] Creating client folder for: "${clientName.trim()}"`,
      );
      const clientFolder = await findOrCreateClientFolder(
        accessToken,
        parentFolderId,
        clientName.trim(),
        provider,
      );

      logger.log(
        `[worker-context:${requestId}] ✓ Client folder: ${clientFolder.id} (${clientFolder.name})`,
      );
      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    logger.log(
      `[worker-context:${requestId}] ✓✓✓ SUCCESS - Returning context`,
    );
    logger.log(`[worker-context:${requestId}] Final context:`, {
      provider,
      parentFolderId,
      folderPath,
      portalName: portal.name,
      useClientFolders: portal.useClientFolders,
    });
    logger.log(
      `[worker-context:${requestId}] ═══════════════════════════════════════════════════════`,
    );

    return NextResponse.json({
      provider,
      accessToken,
      parentFolderId,
      folderPath,
      portalName: portal.name,
      useClientFolders: portal.useClientFolders,
    });
  } catch (error) {
    logger.error(
      `[worker-context:${requestId}] ❌❌❌ UNCAUGHT ERROR:`,
      error,
    );
    logger.error(
      `[worker-context:${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "N/A",
    );
    logger.error(
      `[worker-context:${requestId}] ═══════════════════════════════════════════════════════`,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
