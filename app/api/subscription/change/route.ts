import { NextResponse } from "next/server";
import { createCheckout } from "@creem_io/better-auth/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.CREEM_API_KEY) {
      console.error("❌ CREEM_API_KEY is not configured");
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 500 },
      );
    }

    if (!process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
      console.error("❌ NEXT_PUBLIC_BETTER_AUTH_URL is not configured");
      return NextResponse.json(
        { error: "Application URL not configured. Please contact support." },
        { status: 500 },
      );
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.email) {
      console.error("❌ User has no email address");
      return NextResponse.json(
        { error: "User email is required for checkout" },
        { status: 400 },
      );
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
        console.error("❌ Product ID not configured for plan:", newPlanId);
        return NextResponse.json(
          { error: "Product ID not configured" },
          { status: 500 },
        );
      }

      console.log("🔍 Creating checkout for plan change:", {
        productId,
        newPlanId,
        currentPlanId,
        userId: session.user.id,
        email: session.user.email,
      });

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

      console.log("🔍 Checkout result:", result);

      if (!result || !result.url) {
        console.error("❌ No URL returned from Creem:", result);
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
    console.error("❌ Change plan error:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);

    // Provide more detailed error message
    let errorMessage = "Failed to change plan";

    if (error?.message) {
      errorMessage = error.message;
    }

    // Check for common error patterns
    if (error?.message?.includes("API key")) {
      errorMessage = "Payment system configuration error. Please contact support.";
    } else if (error?.message?.includes("product")) {
      errorMessage = "Invalid product configuration. Please contact support.";
    } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
      errorMessage = "Unable to connect to payment service. Please try again.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 },
    );
  }
}
