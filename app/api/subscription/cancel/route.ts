import { NextResponse } from "next/server";
import { cancelSubscription } from "@creem_io/better-auth/server";
import { auth, prisma } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's current data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        creemCustomerId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's Creem subscription
    // First try by referenceId (which should be the user's ID)
    let creemSubscription = await prisma.creem_subscription.findFirst({
      where: { referenceId: user.id },
      orderBy: { periodEnd: "desc" },
    });

    // If not found, try by creemCustomerId
    if (!creemSubscription && user.creemCustomerId) {
      creemSubscription = await prisma.creem_subscription.findFirst({
        where: { creemCustomerId: user.creemCustomerId },
        orderBy: { periodEnd: "desc" },
      });
    }

    if (!creemSubscription?.creemSubscriptionId) {
      console.error("❌ No active subscription found for user:", user.id);

      return NextResponse.json(
        {
          error:
            "No active subscription found in our records. If you believe this is an error, please use the Customer Portal to manage your subscription.",
        },
        { status: 404 },
      );
    }

    // Cancel subscription in Creem
    try {
      const result = await cancelSubscription(
        {
          apiKey: process.env.CREEM_API_KEY!,
          testMode: process.env.NODE_ENV === "development",
        },
        creemSubscription.creemSubscriptionId,
      );

      if (!result) {
        throw new Error("Creem returned failure when cancelling");
      }
    } catch (creemError: any) {
      console.error("❌ Creem cancellation error:", creemError);

      return NextResponse.json(
        {
          error: `Failed to cancel via payment provider: ${creemError.message || "Unknown error"}`,
        },
        { status: 500 },
      );
    }

    // Update local database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "cancelled",
      },
    });

    if (creemSubscription.id) {
      await prisma.creem_subscription.update({
        where: { id: creemSubscription.id },
        data: {
          cancelAtPeriodEnd: true,
          status: "cancelled",
        },
      });
    }

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
