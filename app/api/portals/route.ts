import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/portals - List all portals for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portals = await prisma.portal.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ portals });
  } catch (error) {
    console.error("Error fetching portals:", error);

    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}
