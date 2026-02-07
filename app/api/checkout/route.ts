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

    // Use Better Auth Creem plugin to create checkout
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/creem/create-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          productId,
          successUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?success=true`,
          cancelUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?canceled=true`,
          metadata: {
            planId,
            billingCycle,
            userId: session.user.id,
          },
        }),
      },
    );

    const checkoutData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: checkoutData.error || "Failed to create checkout" },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutData.url,
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
