import { NextResponse } from "next/server";
import { cancelSubscription } from "@creem_io/better-auth/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Creem subscription
    const creemSubscription = await prisma.creem_subscription.findFirst({
      where: { referenceId: session.user.id },
    });

    if (!creemSubscription?.creemSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // Cancel subscription in Creem
    const result = await cancelSubscription(
      {
        apiKey: process.env.CREEM_API_KEY!,
        testMode: process.env.NODE_ENV === "development",
      },
      creemSubscription.creemSubscriptionId,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 },
      );
    }

    // Update local database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "cancelled",
      },
    });

    await prisma.creem_subscription.update({
      where: { id: creemSubscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
