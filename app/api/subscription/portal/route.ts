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
      // Check if user is on trial (waiting to be charged)
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
      // Free user exploring
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

    console.log("[Portal] Creating portal for customer:", user.creemCustomerId);

    const response = await fetch("https://api.creem.io/v1/customers/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: creemApiKey,
      },
      body: JSON.stringify({
        customer_id: user.creemCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing`,
      }),
    });

    const data = await response.json();

    console.log("[Portal] Creem response:", response.status, data);

    if (!response.ok) {
      console.error("Creem portal error:", data);
      return NextResponse.json(
        {
          error: data.message || `Creem error: ${response.status}`,
          details: data,
          creemStatus: response.status,
        },
        { status: response.status },
      );
    }

    if (!data.url) {
      return NextResponse.json(
        { error: "No portal URL returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
