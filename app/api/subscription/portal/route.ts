import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: { "Content-Type": "application/json" },
    });

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

    if (!response.ok) {
      console.error("Creem portal error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create portal session" },
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
