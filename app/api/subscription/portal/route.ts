import { NextResponse } from "next/server";
import { createPortal } from "@creem_io/better-auth/server";

import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.CREEM_API_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creemCustomerId: true, subscriptionPlan: true },
    });

    if (!user?.creemCustomerId) {
      return NextResponse.json(
        {
          error: "Subscribe to access billing management and the customer portal.",
          code: "NO_SUBSCRIPTION",
        },
        { status: 400 },
      );
    }

    const isTestKey = process.env.CREEM_API_KEY.startsWith("creem_test_");
    const useTestMode = process.env.NODE_ENV === "development" || isTestKey;

    const result = await createPortal(
      { apiKey: process.env.CREEM_API_KEY, testMode: useTestMode },
      user.creemCustomerId,
    );

    if (!result?.url) {
      return NextResponse.json(
        { error: "No portal URL returned from Creem" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Portal session error:", error);

    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
