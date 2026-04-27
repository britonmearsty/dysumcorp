import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server:
    process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { polarCustomerId: true, subscriptionPlan: true },
    });

    if (!user?.polarCustomerId) {
      return NextResponse.json(
        {
          error:
            "No active subscription found. Subscribe to access billing management.",
          code: "NO_SUBSCRIPTION",
        },
        { status: 400 },
      );
    }

    // Create a Polar customer portal session
    const portalSession = await polar.customerSessions.create({
      customerId: user.polarCustomerId,
    });

    if (!portalSession.customerPortalUrl) {
      return NextResponse.json(
        { error: "No portal URL returned from Polar" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: portalSession.customerPortalUrl });
  } catch (error) {
    console.error("Portal session error:", error);

    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
