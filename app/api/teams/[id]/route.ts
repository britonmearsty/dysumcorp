import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingTeam = await prisma.team.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Delete team (cascade will delete members)
    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);

    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
    const { name } = body;

    // Verify ownership
    const existingTeam = await prisma.team.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Update team
    const team = await prisma.team.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Error updating team:", error);

    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}
