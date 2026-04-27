import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

import { auth } from "@/lib/auth-server";
import { PRICING_PLANS } from "@/config/pricing";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server:
    process.env.POLAR_FORCE_SANDBOX === "true" || process.env.NODE_ENV !== "production"
      ? "sandbox"
      : "production",
});

export async function POST(request: Request) {
  try {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 500 },
      );
    }

    if (!process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
      return NextResponse.json(
        { error: "Application URL not configured. Please contact support." },
        { status: 500 },
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: "User email is required for checkout" },
        { status: 400 },
      );
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

    const productId =
      billingCycle === "annual"
        ? plan.polarProductIdAnnual
        : plan.polarProductId;

    if (!productId || productId.trim() === "") {
      console.error(`Missing POLAR_PRODUCT_ID_${billingCycle === "annual" ? "ANNUAL" : "MONTHLY"} environment variable`);
      return NextResponse.json(
        {
          error:
            "Product ID not configured. Please set POLAR_PRODUCT_ID_MONTHLY and POLAR_PRODUCT_ID_ANNUAL in your environment.",
        },
        { status: 500 },
      );
    }

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?success=true`,
      // externalCustomerId links the Polar customer to our user ID —
      // echoed back in every webhook so we never need a separate lookup.
      externalCustomerId: session.user.id,
      // Pre-fill email so the user doesn't have to type it at checkout.
      // Polar validates MX records in sandbox but real user emails pass fine.
      customerEmail: session.user.email,
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Failed to create checkout — no URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      productId,
      planId,
      billingCycle,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);

    let errorMessage = "Failed to create checkout session";

    if (error?.message?.includes("access token")) {
      errorMessage =
        "Payment system configuration error. Please contact support.";
    } else if (error?.message?.includes("non-null body")) {
      errorMessage =
        "Payment product not configured. Please contact support.";
    } else if (
      error?.message?.includes("network") ||
      error?.message?.includes("fetch")
    ) {
      errorMessage =
        "Unable to connect to payment service. Please try again.";
    } else if (error?.message) {
      errorMessage = error.message;
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
