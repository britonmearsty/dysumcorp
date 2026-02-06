import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { checkTeamMemberLimit, getUserPlanType } from "@/lib/plan-limits";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify team ownership
    const team = await prisma.team.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email, userEmail, role = "member" } = body;
    const emailToUse = email || userEmail;

    if (!emailToUse) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: emailToUse },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Add member
    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: targetUser.id,
        role,
        joinedAt: new Date(),
      },
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
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Verify team ownership
    const team = await prisma.team.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
