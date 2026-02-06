import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get portal count
    const portalsUsed = await prisma.portal.count({
      where: { userId },
    });

    // Get storage used (sum of all file sizes)
    const files = await prisma.file.findMany({
      where: {
        portal: {
          userId,
        },
      },
      select: {
        size: true,
      },
    });

    const storageUsedBytes = files.reduce((acc: number, file: any) => acc + Number(file.size), 0);
    const storageUsed = Number((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)); // Convert to GB

    // Get team members count (teams where user is owner)
    const teams = await prisma.team.findMany({
      where: { ownerId: userId },
      include: {
        members: true,
      },
    });

    const teamMembersUsed = teams.reduce((acc: number, team: any) => acc + team.members.length, 0) + 1; // +1 for owner

    // Get custom domains count
    const customDomainsUsed = await prisma.portal.count({
      where: {
        userId,
        customDomain: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      portalsUsed,
      storageUsed,
      teamMembersUsed,
      customDomainsUsed,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
