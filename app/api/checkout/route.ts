import { NextResponse } from "next/server";
import { createCheckout } from "@creem_io/better-auth/server";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";

export async function POST(request: Request) {
  try {
    console.log("🔍 Checkout API called");

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

    console.log("🔍 Session:", session?.user?.id);

    if (!session?.user) {
      console.log("❌ No session found");

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
    const { planId, billingCycle = "monthly" } = body;

    console.log("🔍 Request body:", { planId, billingCycle });

    if (!planId || planId === "free") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 },
      );
    }

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get the appropriate product ID based on billing cycle
    const productId =
      billingCycle === "annual"
        ? plan.creemProductIdAnnual
        : plan.creemProductId;

    if (!productId) {
      console.error("❌ Product ID not configured:", { planId, billingCycle });

      return NextResponse.json(
        { error: "Product ID not configured for this plan" },
        { status: 500 },
      );
    }

    console.log("🔍 Creating checkout:", {
      productId,
      planId,
      billingCycle,
      userId: session.user.id,
      email: session.user.email,
      testMode: process.env.NODE_ENV === "development",
    });

    console.log("🔍 Metadata being sent:", {
      planId,
      billingCycle,
      userId: session.user.id,
      productId,
    });

    // Use Creem server-side SDK to create checkout
    // Use test mode if using a test API key or in development
    const isTestKey = process.env.CREEM_API_KEY?.startsWith("creem_test_");
    const useTestMode = process.env.NODE_ENV === "development" || isTestKey;

    console.log("🔍 Creem mode:", {
      isTestKey,
      useTestMode,
      nodeEnv: process.env.NODE_ENV,
    });

    const result = await createCheckout(
      {
        apiKey: process.env.CREEM_API_KEY!,
        testMode: useTestMode,
      },
      {
        productId,
        successUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?success=true`,
        // Pass email only - Creem will create/link customer by email
        customer: {
          email: session.user.email!,
        },
        metadata: {
          planId,
          billingCycle,
          userId: session.user.id,
          productId,
        },
      },
    );

    console.log("🔍 Creem result:", result);

    if (!result || !result.url) {
      console.error("❌ No URL returned from Creem:", result);

      return NextResponse.json(
        { error: "Failed to create checkout - no URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.url,
      productId,
      planId,
      billingCycle,
    });
  } catch (error: any) {
    console.error("❌ Checkout error:", error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);
    console.error("❌ Error details:", JSON.stringify(error, null, 2));

    // Provide more detailed error message
    let errorMessage = "Failed to create checkout session";

    if (error?.message) {
      errorMessage = error.message;
    }

    // Check for common error patterns
    if (error?.message?.includes("API key")) {
      errorMessage =
        "Payment system configuration error. Please contact support.";
    } else if (error?.message?.includes("product")) {
      errorMessage = "Invalid product configuration. Please contact support.";
    } else if (
      error?.message?.includes("network") ||
      error?.message?.includes("fetch")
    ) {
      errorMessage = "Unable to connect to payment service. Please try again.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 },
    );
  }
}
