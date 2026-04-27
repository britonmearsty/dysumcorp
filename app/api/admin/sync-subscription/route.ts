import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { applyAdminRateLimit } from "@/lib/rate-limit";

const VALID_PLANS = ["free", "pro"] as const;

type ValidPlan = (typeof VALID_PLANS)[number];

export async function POST(request: Request) {
  try {
    // Rate limit admin endpoints
    const rateLimitResponse = await applyAdminRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await isAdmin(request.headers);

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { planId, userId } = body;

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "planId and userId are required" },
        { status: 400 },
      );
    }

    if (!VALID_PLANS.includes(planId as ValidPlan)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be 'free' or 'pro'" },
        { status: 400 },
      );
    }

    // Determine subscription status based on plan
    const subscriptionStatus = planId === "pro" ? "active" : "active";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: planId,
        subscriptionStatus,
        // Clear Polar period end when manually setting to free
        ...(planId === "free" ? { polarCurrentPeriodEnd: null } : {}),
      },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Manual sync error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync subscription";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
