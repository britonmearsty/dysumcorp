import { NextResponse } from "next/server";
import { Creem } from "creem";

import { auth, prisma } from "@/lib/auth";

function getCreemClient() {
  return new Creem({
    serverURL:
      process.env.NODE_ENV === "development"
        ? "https://test-api.creem.io"
        : "https://api.creem.io",
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (user.subscriptionStatus !== "active") {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 },
      );
    }

    let creemSubscription = await prisma.creem_subscription.findFirst({
      where: { referenceId: user.id },
      orderBy: { periodEnd: "desc" },
    });

    if (!creemSubscription && user.creemCustomerId) {
      creemSubscription = await prisma.creem_subscription.findFirst({
        where: { creemCustomerId: user.creemCustomerId },
        orderBy: { periodEnd: "desc" },
      });
    }

    if (!creemSubscription?.creemSubscriptionId) {
      return NextResponse.json(
        {
          error:
            "No active subscription found in our records. Please use the Customer Portal to manage your subscription.",
        },
        { status: 404 },
      );
    }

    const creem = getCreemClient();

    try {
      await creem.cancelSubscription({
        xApiKey: process.env.CREEM_API_KEY!,
        id: creemSubscription.creemSubscriptionId,
        mode: "scheduled",
      } as any);
    } catch (creemError: any) {
      console.error("Creem cancellation error:", creemError);

      return NextResponse.json(
        {
          error: `Failed to cancel via payment provider: ${creemError.message || "Unknown error"}`,
        },
        { status: 500 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "scheduled_cancel",
      },
    });

    await prisma.creem_subscription.update({
      where: { id: creemSubscription.id },
      data: {
        cancelAtPeriodEnd: true,
        status: "scheduled_cancel",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Subscription will be cancelled at the end of your billing period. You will continue to have access until then.",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
