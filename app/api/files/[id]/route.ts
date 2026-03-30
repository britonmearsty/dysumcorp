import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import {
  getValidToken,
  deleteFromGoogleDrive,
  deleteFromDropbox,
} from "@/lib/storage-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/files/[id]
// Body (optional): { deleteFromStorage?: boolean }
// If deleteFromStorage is omitted, falls back to user's storageDeleteBehavior preference
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional body
    let deleteFromStorage: boolean | undefined;

    try {
      const body = await request.json();

      if (typeof body.deleteFromStorage === "boolean") {
        deleteFromStorage = body.deleteFromStorage;
      }
    } catch {
      // no body — fall through to preference lookup
    }

    // If not explicitly passed, resolve from user preference
    if (deleteFromStorage === undefined) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { storageDeleteBehavior: true },
      });
      const behavior = user?.storageDeleteBehavior ?? "ask";

      if (behavior === "always") deleteFromStorage = true;
      else if (behavior === "never") deleteFromStorage = false;
      else deleteFromStorage = false; // "ask" with no explicit value → don't delete
    }

    // Get file with portal info
    const file = await prisma.file.findFirst({
      where: { id, portal: { userId: session.user.id } },
      include: { portal: true },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    let cloudDeleted = false;

    if (deleteFromStorage) {
      const isGoogleDrive =
        file.storageUrl.includes("drive.google.com") ||
        file.storageUrl.includes("docs.google.com") ||
        file.storageUrl.includes("googledrive.com");

      // For Dropbox: storageUrl is empty string; detect via portal provider or storageFileId prefix
      const isDropbox =
        file.storageUrl.includes("dropbox.com") ||
        file.portal.storageProvider === "dropbox" ||
        (file.storageFileId?.startsWith("id:") ?? false);

      if (isGoogleDrive) {
        let cloudFileId = file.storageFileId;

        if (!cloudFileId) {
          const match =
            file.storageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
            file.storageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

          if (match) cloudFileId = match[1];
        }
        if (cloudFileId) {
          try {
            const accessToken = await getValidToken(session.user.id, "google");

            if (accessToken) {
              await deleteFromGoogleDrive(accessToken, cloudFileId);
              cloudDeleted = true;
            }
          } catch (err) {
            console.error("Failed to delete from Google Drive:", err);
          }
        }
      } else if (isDropbox && file.storageFileId) {
        // Use storageFileId (id:xxx format) — works regardless of where file was moved
        try {
          const accessToken = await getValidToken(session.user.id, "dropbox");

          if (accessToken) {
            await deleteFromDropbox(accessToken, file.storageFileId);
            cloudDeleted = true;
          }
        } catch (err) {
          console.error("Failed to delete from Dropbox:", err);
        }
      }
    }

    await prisma.file.delete({ where: { id } });

    return NextResponse.json({ success: true, cloudDeleted });
  } catch (error) {
    console.error("Error deleting file:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
