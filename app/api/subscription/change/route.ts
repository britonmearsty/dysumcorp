import { NextResponse } from "next/server";
import { createCheckout } from "@creem_io/better-auth/server";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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

    const body = await request.json();
    const { newPlanId } = body;

    if (!newPlanId) {
      return NextResponse.json(
        { error: "New plan ID is required" },
        { status: 400 },
      );
    }

    // Get current user subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        creemCustomerId: true,
      },
    });

    const currentPlanId = user?.subscriptionPlan || "free";

    if (currentPlanId === newPlanId) {
      return NextResponse.json(
        { error: "You are already on this plan" },
        { status: 400 },
      );
    }

    const newPlan = PRICING_PLANS[newPlanId as keyof typeof PRICING_PLANS];

    if (!newPlan) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 },
      );
    }

    // If user is on free plan, create a new checkout
    if (currentPlanId === "free") {
      const productId = newPlan.creemProductId;

      if (!productId) {
        return NextResponse.json(
          { error: "Product ID not configured" },
          { status: 500 },
        );
      }

      const result = await createCheckout(
        {
          apiKey: process.env.CREEM_API_KEY!,
          testMode: process.env.NODE_ENV === "development",
        },
        {
          productId,
          successUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?success=true`,
          customer: {
            email: session.user.email!,
          },
          metadata: {
            planId: newPlanId,
            billingCycle: "monthly",
            userId: session.user.id,
            isPlanChange: true,
          },
        },
      );

      if (!result || !result.url) {
        return NextResponse.json(
          { error: "Failed to create checkout" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        checkoutUrl: result.url,
        message: "Redirecting to checkout...",
      });
    }

    // For paid to paid plan changes, redirect to customer portal
    // Creem handles plan changes through the customer portal
    return NextResponse.json({
      redirectToPortal: true,
      message:
        "Please use the Customer Portal to change your plan. This ensures proper proration and billing.",
    });
  } catch (error: any) {
    console.error("Change plan error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to change plan" },
      { status: 500 },
    );
  }
}
