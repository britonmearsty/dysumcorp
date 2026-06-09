import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

// GET /api/clients - Get all unique clients who uploaded files
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all files uploaded to user's portals with uploader info
    const files = await prisma.file.findMany({
      where: {
        portal: {
          userId: session.user.id,
        },
        OR: [{ uploaderEmail: { not: null } }, { uploaderName: { not: null } }],
      },
      select: {
        uploaderName: true,
        uploaderEmail: true,
        uploadedAt: true,
        size: true,
        portal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Group files by client email or name
    const clientsMap = new Map<
      string,
      {
        name: string;
        email: string;
        totalFiles: number;
        totalSize: bigint;
        lastUpload: Date;
        portals: Set<string>;
      }
    >();

    files.forEach((file) => {
      // Use email as primary identifier, fall back to name
      const identifier = file.uploaderEmail || file.uploaderName || "Unknown";
      const existing = clientsMap.get(identifier);

      if (existing) {
        existing.totalFiles += 1;
        existing.totalSize += file.size;
        existing.portals.add(file.portal.name);
        if (file.uploadedAt > existing.lastUpload) {
          existing.lastUpload = file.uploadedAt;
        }
        // Update email if we get one later
        if (file.uploaderEmail && !existing.email) {
          existing.email = file.uploaderEmail;
        }
      } else {
        clientsMap.set(identifier, {
          name: file.uploaderName || file.uploaderEmail || "Unknown",
          email: file.uploaderEmail || "",
          totalFiles: 1,
          totalSize: file.size,
          lastUpload: file.uploadedAt,
          portals: new Set([file.portal.name]),
        });
      }
    });

    // Convert to array and format
    const clients = Array.from(clientsMap.values()).map((client) => ({
      name: client.name,
      email: client.email,
      totalFiles: client.totalFiles,
      totalSize: client.totalSize.toString(),
      lastUpload: client.lastUpload.toISOString(),
      portals: Array.from(client.portals),
    }));

    // Sort by last upload date (most recent first)
    clients.sort(
      (a, b) =>
        new Date(b.lastUpload).getTime() - new Date(a.lastUpload).getTime(),
    );

    return NextResponse.json({ clients });
  } catch (error) {
    logger.error("Error fetching clients:", error);

    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}
