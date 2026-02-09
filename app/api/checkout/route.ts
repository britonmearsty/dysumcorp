import { NextResponse } from "next/server";
import { createCheckout } from "@creem_io/better-auth/server";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";

export async function POST(request: Request) {
  try {
    console.log("🔍 Checkout API called");

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log("🔍 Session:", session?.user?.id);

    if (!session?.user) {
      console.log("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    });

    // Use Creem server-side SDK to create checkout
    // Note: Creem API only accepts one of customer.id OR customer.email, not both
    const result = await createCheckout(
      {
        apiKey: process.env.CREEM_API_KEY!,
        testMode: process.env.NODE_ENV === "development",
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
        },
      },
    );

    console.log("🔍 Creem result:", result);

    if (!result || !result.url) {
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
    console.error("❌ Error stack:", error?.stack);

    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
