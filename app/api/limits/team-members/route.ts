import { NextRequest, NextResponse } from "next/server";

import { checkTeamMemberLimit, getUserPlanType } from "@/lib/plan-limits";
import { authClient } from "@/lib/auth-client";

export async function GET(request: NextRequest) {
  try {
    const session = await authClient.getSession();

    if (!session?.data?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.data.user.id;
    const planType = await getUserPlanType(userId);
    const teamLimit = await checkTeamMemberLimit(userId, planType);

    return NextResponse.json({
      allowed: teamLimit.allowed,
      reason: teamLimit.reason,
      current: teamLimit.current,
      limit: teamLimit.limit,
      planType,
    });
  } catch (error) {
    console.error("Error checking team member limit:", error);

    return NextResponse.json(
      { error: "Failed to check team member limit" },
      { status: 500 },
    );
  }
}
