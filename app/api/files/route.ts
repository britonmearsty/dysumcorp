import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";

// GET /api/files - List all files for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const take = limit ? parseInt(limit, 10) : undefined;

    // Try to include uploadSession, but fall back if the relation doesn't exist yet
    let files;

    try {
      files = await prisma.file.findMany({
        where: {
          portal: {
            userId: session.user.id,
          },
        },
        include: {
          portal: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          uploadSession: {
            select: {
              id: true,
              uploaderName: true,
              uploaderEmail: true,
              uploaderNotes: true,
              uploadedAt: true,
              fileCount: true,
              totalSize: true,
            },
          },
        },
        orderBy: { uploadedAt: "desc" },
        take,
      });
    } catch (relationError: any) {
      // If uploadSession relation doesn't exist yet, fetch without it
      console.log(
        "[Files API] Falling back to query without uploadSession:",
        relationError.message,
      );
      files = await prisma.file.findMany({
        where: {
          portal: {
            userId: session.user.id,
          },
        },
        include: {
          portal: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { uploadedAt: "desc" },
        take,
      });
    }

    return NextResponse.json({
      files: files.map((f: any) => ({
        ...f,
        size: f.size.toString(), // Convert BigInt to string for JSON
        uploadSession: f.uploadSession
          ? {
              ...f.uploadSession,
              totalSize: f.uploadSession.totalSize?.toString(),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching files:", error);

    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}
