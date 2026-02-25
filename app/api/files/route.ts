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

    const files = await prisma.file.findMany({
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

    return NextResponse.json({
      files: files.map((f: any) => ({
        ...f,
        size: f.size.toString(), // Convert BigInt to string for JSON
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
