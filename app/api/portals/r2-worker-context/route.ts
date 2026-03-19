import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";
import {
  getValidToken,
  findOrCreateRootFolder,
  findOrCreatePortalFolder,
  findOrCreateClientFolder,
} from "@/lib/storage-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portals/r2-worker-context
 * Called by the Cloudflare Worker to get storage credentials before transferring.
 * Validates the upload token and returns the access token + folder info.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadToken, uploaderName, workerSecret } = body;

    if (!uploadToken) {
      return NextResponse.json({ error: "uploadToken is required" }, { status: 400 });
    }

    // Accept either a valid WORKER_SECRET (from the Cloudflare Worker)
    // or a valid upload token (from direct calls). Worker path is preferred
    // because the token HMAC may differ between Node crypto and Web Crypto.
    const isWorkerCall = workerSecret && workerSecret === process.env.WORKER_SECRET;

    console.log("[worker-context] isWorkerCall:", isWorkerCall);
    console.log("[worker-context] received secret prefix:", workerSecret?.slice(0, 8));
    console.log("[worker-context] env secret prefix:", process.env.WORKER_SECRET?.slice(0, 8));

    if (!isWorkerCall) {
      const token = validateUploadToken(uploadToken);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Decode token payload (skip signature check for worker calls — worker already validated)
    let tokenPayload: { portalId: string; uploaderName?: string };
    try {
      tokenPayload = JSON.parse(Buffer.from(uploadToken, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    const provider = portal.storageProvider === "dropbox" ? "dropbox" : "google";
    const accessToken = await getValidToken(portal.userId, provider);

    if (!accessToken) {
      return NextResponse.json(
        { error: `No ${provider} storage connected for this portal` },
        { status: 400 },
      );
    }

    // Resolve folder hierarchy
    let parentFolderId: string;
    let folderPath: string;

    if (portal.storageFolderId) {
      parentFolderId = portal.storageFolderId;
      folderPath = portal.storageFolderPath || portal.name;
    } else {
      const rootFolder = await findOrCreateRootFolder(accessToken, portal.userId, provider);
      const portalFolder = await findOrCreatePortalFolder(
        accessToken,
        rootFolder.id,
        portal.name,
        provider,
      );
      parentFolderId = portalFolder.id;
      folderPath = `dysumcorp/${portal.name}`;
    }

    // Client sub-folder if enabled
    const clientName = uploaderName ?? tokenPayload.uploaderName;
    if (portal.useClientFolders && clientName?.trim()) {
      const clientFolder = await findOrCreateClientFolder(
        accessToken,
        parentFolderId,
        clientName.trim(),
        provider,
      );
      parentFolderId = clientFolder.id;
      folderPath = `${folderPath}/${clientFolder.name}`;
    }

    return NextResponse.json({
      provider,
      accessToken,
      parentFolderId,
      folderPath,
      portalName: portal.name,
      useClientFolders: portal.useClientFolders,
    });
  } catch (error) {
    console.error("[r2-worker-context] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
