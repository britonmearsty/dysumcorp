import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { checkTeamMemberLimit, getUserPlanType } from "@/lib/plan-limits";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/teams - List all teams owned by user
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: { ownerId: session.user.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const planType = await getUserPlanType(userId);

    // Check team member limit
    const memberCheck = await checkTeamMemberLimit(userId, planType);
    if (!memberCheck.allowed) {
      return NextResponse.json(
        {
          error: memberCheck.reason,
          upgrade: true,
          currentPlan: planType,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        ownerId: userId,
      },
      include: {
        members: true,
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
