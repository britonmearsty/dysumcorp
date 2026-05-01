import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserPlanType } from "@/lib/plan-limits";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const planType = await getUserPlanType(userId);
    
    // REVERSIBILITY: Remove this block to revert trial feature
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasCreatedTrialPortal: true },
    });

    return NextResponse.json({ 
      planType,
      hasCreatedTrialPortal: user?.hasCreatedTrialPortal || false,
    });
  } catch (error) {
    console.error("Failed to get user plan:", error);

    return NextResponse.json(
      { error: "Failed to get user plan" },
      { status: 500 },
    );
  }
}
