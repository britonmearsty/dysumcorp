import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

const VALID_PLANS = ["trial", "pro", "expired"] as const;

type ValidPlan = (typeof VALID_PLANS)[number];

export async function POST(request: Request) {
  try {
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
        { error: "Invalid planId. Must be 'trial', 'pro', or 'expired'" },
        { status: 400 },
      );
    }

    // Determine subscription status based on plan
    const subscriptionStatus =
      planId === "pro"
        ? "active"
        : planId === "trial"
          ? "trialing"
          : "cancelled";

    // Build update data
    const updateData: Record<string, unknown> = {
      subscriptionPlan: planId,
      subscriptionStatus,
    };

    // When setting to trial, set trialStartedAt only if not already set
    if (planId === "trial") {
      // Use raw query to check since generated client may not have trialStartedAt yet
      const rows = await prisma.$queryRaw<{ trialStartedAt: Date | null }[]>`
        SELECT "trialStartedAt" FROM "user" WHERE id = ${userId} LIMIT 1
      `;
      const existingTrialStart = rows[0]?.trialStartedAt;

      if (!existingTrialStart) {
        updateData.trialStartedAt = new Date();
        updateData.hadTrial = true;
      }
    }

    const updatedUser = await (prisma.user.update as any)({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialStartedAt: true,
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
