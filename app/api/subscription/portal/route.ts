import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { generateBillingPortalLink } from "@creem_io/better-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        creemCustomerId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    });

    if (!user?.creemCustomerId) {
      if (user?.subscriptionStatus === "trialing") {
        return NextResponse.json(
          {
            error:
              "You're currently on your 7-day free trial. Your billing portal will be available after the trial ends. Contact support if you need assistance.",
            code: "TRIALING",
          },
          { status: 400 },
        );
      }
      if (user?.subscriptionPlan === "trial") {
        return NextResponse.json(
          {
            error:
              "Subscribe to access billing management and the customer portal.",
            code: "NO_SUBSCRIPTION",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 },
      );
    }

    const creemApiKey = process.env.CREEM_API_KEY;

    if (!creemApiKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 },
      );
    }

    const isTestKey = creemApiKey.startsWith("creem_test_");

    const result = await generateBillingPortalLink(
      {
        apiKey: creemApiKey,
        testMode: isTestKey,
      },
      { customerId: user.creemCustomerId },
    );

    const portalUrl = result.url;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "No portal URL returned from Creem" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal session error:", error);

    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
