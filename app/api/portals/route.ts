import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { getSessionFromRequest } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/portals - List all portals for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    console.log("[/api/portals] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const take = limit ? parseInt(limit, 10) : undefined;

    console.log(
      "[/api/portals] Fetching portals for user:",
      session.user.id,
      "limit:",
      take,
    );

    const portals = await prisma.portal.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    console.log("[/api/portals] Found portals:", portals.length);

    // Convert BigInt fields to strings for JSON serialization
    const serializedPortals = portals.map((portal) => ({
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
    }));

    return NextResponse.json({ portals: serializedPortals });
  } catch (error) {
    console.error("Error fetching portals:", error);

    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}
