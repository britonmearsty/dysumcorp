import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { getUserUsageStats } from "@/lib/usage-tracking";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/admin/usage/stats/:userId - Get usage stats for a user (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or requesting their own stats
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true },
    });

    const isAdmin = user?.subscriptionPlan === "enterprise";
    const isOwnStats = session.user.id === userId;

    if (!isAdmin && !isOwnStats) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const stats = await getUserUsageStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting usage stats:", error);

    return NextResponse.json(
      { error: "Failed to get usage stats" },
      { status: 500 },
    );
  }
}
