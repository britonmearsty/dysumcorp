import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/portals/public/[slug] - Get portal by slug (public access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const portal = await prisma.portal.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        whiteLabeled: true,
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    return NextResponse.json({ portal });
  } catch (error) {
    console.error("Error fetching portal:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal" },
      { status: 500 }
    );
  }
}
