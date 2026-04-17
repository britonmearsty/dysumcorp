import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

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
      // New user with no subscription at all
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
    const baseUrl = isTestKey
      ? "https://test-api.creem.io"
      : "https://api.creem.io";

    const response = await fetch(`${baseUrl}/v1/customers/billing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey,
      },
      body: JSON.stringify({
        customer_id: user.creemCustomerId,
      }),
    });

    const data = await response.json();

    if (response.status === 403 || response.status === 401) {
      return NextResponse.json(
        {
          error:
            "Unable to access billing portal. Please verify your API key has the correct permissions in Creem dashboard.",
          code: "API_KEY_FORBIDDEN",
          details: data,
        },
        { status: response.status },
      );
    }

    if (!response.ok) {
      console.error("Creem portal error:", response.status, data);
      return NextResponse.json(
        {
          error: data.message || `Creem error: ${response.status}`,
          details: data,
          creemStatus: response.status,
        },
        { status: response.status },
      );
    }

    const portalUrl = data.customer_portal_link;

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
