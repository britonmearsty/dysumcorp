import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portals/[id]/upload-sessions - Get all upload sessions for a portal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portalId } = await params;

    // Verify portal belongs to user
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      select: { userId: true },
    });

    if (!portal || portal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Portal not found or access denied" },
        { status: 404 },
      );
    }

    // Fetch all upload sessions with file count and total size
    const uploadSessions = await prisma.uploadSession.findMany({
      where: { portalId },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "asc" },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const serializedSessions = uploadSessions.map((session) => ({
      ...session,
      totalSize: session.totalSize.toString(),
      files: session.files.map((file) => ({
        ...file,
        size: file.size.toString(),
      })),
    }));

    return NextResponse.json({ uploadSessions: serializedSessions });
  } catch (error) {
    console.error("[Upload Sessions] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch upload sessions" },
      { status: 500 },
    );
  }
}
