import { NextResponse } from "next/server";
import { createCheckout } from "@creem_io/better-auth/server";

import { auth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { PRICING_PLANS } from "@/config/pricing";

export async function POST(request: Request) {
  try {
    if (!process.env.CREEM_API_KEY) {
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
        ? plan.creemProductIdAnnual
        : plan.creemProductId;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID not configured for this plan" },
        { status: 500 },
      );
    }

    // Fetch the user's existing Creem customer ID and subscription history
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        creemCustomerId: true,
        hadTrial: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialStartedAt: true,
      },
    });

    const isTestKey = process.env.CREEM_API_KEY?.startsWith("creem_test_");
    const useTestMode = process.env.NODE_ENV === "development" || !!isTestKey;

    // Skip trial if any of these are true:
    // - hadTrial flag is set (set going forward by onGrantAccess)
    // - user previously had a pro subscription (expired/cancelled = they already subscribed)
    // - user has a trialStartedAt date (they already used a trial)
    const hadPreviousSubscription =
      dbUser?.subscriptionPlan === "expired" ||
      dbUser?.subscriptionStatus === "cancelled" ||
      dbUser?.subscriptionStatus === "expired" ||
      dbUser?.subscriptionStatus === "scheduled_cancel";

    const shouldSkipTrial =
      !!dbUser?.hadTrial ||
      !!dbUser?.trialStartedAt ||
      hadPreviousSubscription;

    const result = await createCheckout(
      { apiKey: process.env.CREEM_API_KEY!, testMode: useTestMode },
      {
        productId,
        successUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/dashboard/billing?success=true`,
        // Pass existing customer ID if available so Creem links to the same customer,
        // preserving trial history and preventing duplicate customer records.
        // Fall back to email for first-time customers.
        customer: dbUser?.creemCustomerId
          ? { id: dbUser.creemCustomerId }
          : { email: session.user.email! },
        // Skip trial for any user who has previously subscribed or used a trial
        skipTrial: shouldSkipTrial,
        metadata: {
          planId,
          billingCycle,
          userId: session.user.id,
          productId,
        },
      },
    );

    if (!result?.url) {
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
    console.error("Checkout error:", error);

    let errorMessage = "Failed to create checkout session";

    if (error?.message?.includes("API key")) {
      errorMessage = "Payment system configuration error. Please contact support.";
    } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
      errorMessage = "Unable to connect to payment service. Please try again.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 },
    );
  }
}
