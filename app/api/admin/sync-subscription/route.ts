import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

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

    const validPlans = ["free", "pro"];

    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be 'free' or 'pro'" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: planId,
        subscriptionStatus: "active",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error: unknown) {
    console.error("Manual sync error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync subscription";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
