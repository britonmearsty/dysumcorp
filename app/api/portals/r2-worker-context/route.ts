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
 * Auth: either WORKER_SECRET header/body OR valid upload token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadToken, uploaderName, workerSecret } = body;

    const envSecret = process.env.WORKER_SECRET;

    // Debug logging
    console.log("[worker-context] workerSecret present:", !!workerSecret, "prefix:", workerSecret?.slice(0, 6));
    console.log("[worker-context] env WORKER_SECRET present:", !!envSecret, "prefix:", envSecret?.slice(0, 6));
    console.log("[worker-context] match:", workerSecret === envSecret);

    // Authenticate: WORKER_SECRET takes priority (worker calls)
    const isWorkerCall = !!(workerSecret && envSecret && workerSecret === envSecret);

    if (!isWorkerCall) {
      // Fall back to upload token validation (direct/browser calls)
      if (!uploadToken) {
        return NextResponse.json({ error: "uploadToken is required" }, { status: 400 });
      }
      const token = validateUploadToken(uploadToken);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Decode token payload to get portalId
    if (!uploadToken) {
      return NextResponse.json({ error: "uploadToken is required" }, { status: 400 });
    }

    let tokenPayload: { portalId: string; uploaderName?: string };
    try {
      tokenPayload = JSON.parse(Buffer.from(uploadToken, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    if (!tokenPayload.portalId) {
      return NextResponse.json({ error: "Invalid token: missing portalId" }, { status: 400 });
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

    console.log("[worker-context] success, provider:", provider, "portalId:", portal.id);

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
