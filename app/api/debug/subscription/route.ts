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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        creemCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get Creem subscriptions from database
    const creemSubscriptions = await prisma.creem_subscription.findMany({
      where: {
        OR: [
          { referenceId: session.user.id },
          { creemCustomerId: user?.creemCustomerId },
        ],
      },
    });

    return NextResponse.json({
      userFromDB: user,
      userFromSession: session.user,
      creemSubscriptions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to fetch debug info" },
      { status: 500 },
    );
  }
}
