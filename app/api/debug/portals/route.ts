import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { getSession } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all portals for this user
    const portals = await prisma.portal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get portal count
    const count = await prisma.portal.count({
      where: { userId },
    });

    return NextResponse.json({
      userId,
      count,
      portals,
      message: `Found ${count} portal(s) for user ${userId}`,
    });
  } catch (error) {
    console.error("Error fetching portals:", error);

    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}
