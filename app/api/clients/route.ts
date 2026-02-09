import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
        uploaderEmail: {
          not: null,
        },
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

    // Group files by client email
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
      const email = file.uploaderEmail!;
      const existing = clientsMap.get(email);

      if (existing) {
        existing.totalFiles += 1;
        existing.totalSize += file.size;
        existing.portals.add(file.portal.name);
        if (file.uploadedAt > existing.lastUpload) {
          existing.lastUpload = file.uploadedAt;
        }
      } else {
        clientsMap.set(email, {
          name: file.uploaderName || "Unknown",
          email: email,
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
    console.error("Error fetching clients:", error);

    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}
