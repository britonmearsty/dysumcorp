import { NextResponse } from "next/server";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle = "monthly" } = body;

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

    // Create Creem checkout session
    // Note: This is a simplified version. You'll need to implement the actual Creem checkout API
    const checkoutUrl = `https://checkout.creem.io/checkout?product=${productId}&customer=${session.user.email}&success_url=${encodeURIComponent(
      `${process.env.BETTER_AUTH_URL}/dashboard/billing?success=true`,
    )}&cancel_url=${encodeURIComponent(
      `${process.env.BETTER_AUTH_URL}/dashboard/billing?canceled=true`,
    )}`;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      productId,
      planId,
      billingCycle,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
