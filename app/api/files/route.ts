import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/files - List all files for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
