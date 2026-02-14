import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { triggerUsageTracking } from "@/lib/usage-tracking";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// POST /api/admin/usage/trigger - Trigger usage tracking update (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you might want to add an admin role to the User model)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true },
    });

    if (!user || user.subscriptionPlan !== "enterprise") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    await triggerUsageTracking();

    return NextResponse.json({
      success: true,
      message: "Usage tracking update triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering usage tracking:", error);

    return NextResponse.json(
      { error: "Failed to trigger usage tracking" },
      { status: 500 },
    );
  }
}
