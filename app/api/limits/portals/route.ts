import { NextRequest, NextResponse } from "next/server";
import { checkPortalLimit, getUserPlanType } from "@/lib/plan-limits";
import { authClient } from "@/lib/auth-client";

export async function GET(request: NextRequest) {
  try {
    const session = await authClient.getSession();
    if (!session?.data?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.data.user.id;
    const planType = await getUserPlanType(userId);
    const portalLimit = await checkPortalLimit(userId, planType);

    return NextResponse.json({
      allowed: portalLimit.allowed,
      reason: portalLimit.reason,
      current: portalLimit.current,
      limit: portalLimit.limit,
      planType,
    });
  } catch (error) {
    console.error("Error checking portal limit:", error);
    return NextResponse.json(
      { error: "Failed to check portal limit" },
      { status: 500 },
    );
  }
}
