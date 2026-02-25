import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getValidToken } from "@/lib/storage-api";

// POST /api/files/sync - Sync files with cloud storage, removing any that were deleted from cloud
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds } = body;

    // Get all user's files if no specific fileIds provided
    let files;

    if (fileIds && fileIds.length > 0) {
      files = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          portal: {
            userId: session.user.id,
          },
        },
        select: {
          id: true,
          name: true,
          storageUrl: true,
          storageFileId: true,
          portal: {
            select: {
              storageProvider: true,
            },
          },
        },
      });
    } else {
      // Get all files for user's portals
      files = await prisma.file.findMany({
        where: {
          portal: {
            userId: session.user.id,
          },
        },
        select: {
          id: true,
          name: true,
          storageUrl: true,
          storageFileId: true,
          portal: {
            select: {
              storageProvider: true,
            },
          },
        },
      });
    }

    const results = {
      checked: files.length,
      deleted: 0,
      errors: [] as string[],
    };

    // Check each file in cloud storage
    for (const file of files) {
      try {
        // Determine provider from portal's storageProvider, fallback to URL detection
        const provider =
          file.portal?.storageProvider ||
          (file.storageUrl.includes("drive.google.com") ||
          file.storageUrl.includes("docs.google.com") ||
          file.storageUrl.includes("googledrive.com")
            ? "google"
            : "dropbox");

        let fileExistsInCloud = true;

        if (provider === "google") {
          const accessToken = await getValidToken(session.user.id, "google");

          if (accessToken) {
            // Get file ID from storageFileId or extract from URL
            let fileId = file.storageFileId;

            if (!fileId) {
              const match =
                file.storageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                file.storageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

              if (match) {
                fileId = match[1];
              }
            }

            if (fileId) {
              // Try to get file - if it fails, file was deleted
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              if (!response.ok) {
                fileExistsInCloud = false;
              }
            }
          }
        } else if (provider === "dropbox") {
          const accessToken = await getValidToken(session.user.id, "dropbox");

          if (accessToken) {
            // Check if file exists in Dropbox
            const response = await fetch(
              "https://api.dropboxapi.com/2/files/get_metadata",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: `/${file.name}`,
                }),
              },
            );

            if (!response.ok) {
              fileExistsInCloud = false;
            }
          }
        }

        // Delete from database if file doesn't exist in cloud
        if (!fileExistsInCloud) {
          await prisma.file.delete({
            where: { id: file.id },
          });
          results.deleted++;
        }
      } catch (error) {
        console.error(`Error checking file ${file.id}:`, error);
        results.errors.push(`Failed to check file: ${file.name}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error syncing files:", error);

    return NextResponse.json(
      { error: "Failed to sync files" },
      { status: 500 },
    );
  }
}

// GET /api/files/sync - Get sync status info
export async function GET() {
  return NextResponse.json({
    message:
      "Use POST to sync files. This will check cloud storage for deleted files and remove them from the database.",
  });
}
