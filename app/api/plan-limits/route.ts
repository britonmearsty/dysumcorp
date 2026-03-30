import { NextRequest, NextResponse } from "next/server";

import { getUserPlanType } from "@/lib/plan-limits";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const planType = await getUserPlanType(userId);

    return NextResponse.json({ planType });
  } catch (error) {
    console.error("Failed to get user plan:", error);

    return NextResponse.json(
      { error: "Failed to get user plan" },
      { status: 500 },
    );
  }
}
