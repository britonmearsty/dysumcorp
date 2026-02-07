import { NextRequest, NextResponse } from "next/server";

import { checkCustomDomainLimit, getUserPlanType } from "@/lib/plan-limits";

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

export async function POST(request: NextRequest) {
  const { userId, planType, checkType } = await request.json();

  if (!userId || !planType || !checkType) {
    return NextResponse.json(
      { error: "User ID, plan type, and check type required" },
      { status: 400 },
    );
  }

  try {
    let result;

    switch (checkType) {
      case "customDomain":
        result = await checkCustomDomainLimit(userId, planType);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid check type" },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to check plan limit:", error);
    return NextResponse.json(
      { error: "Failed to check plan limit" },
      { status: 500 },
    );
  }
}
