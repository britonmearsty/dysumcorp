import { NextRequest, NextResponse } from "next/server";

import { checkPortalLimit, getUserPlanType } from "@/lib/plan-limits";
import { authClient } from "@/lib/auth-client";
import { PlanType } from "@/config/pricing";

export interface SoftLimitResponse {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  percentage: number;
  softLimitLevel: "normal" | "warning" | "critical" | "exceeded";
  canProceed: boolean;
  requiresUpgrade: boolean;
  graceUsed?: number;
  graceTotal?: number;
  recommendation?: {
    suggestedPlan: PlanType;
    message: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await authClient.getSession();

    if (!session?.data?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.data.user.id;
    const userPlan = await getUserPlanType(userId);

    // Get basic limit check
    const limitCheck = await checkPortalLimit(userId, userPlan);

    const current = limitCheck.current || 0;
    const limit = limitCheck.limit || 0;
    const percentage = limit ? (current / limit) * 100 : 0;
    const softLimitLevel = calculateSoftLimitLevel(
      percentage,
      limitCheck.allowed,
    );

    // Calculate grace period for exceeded limits
    let graceUsed: number | undefined;
    let graceTotal: number | undefined;
    let canProceed = limitCheck.allowed;

    if (softLimitLevel === "exceeded") {
      const overage = current - limit;

      graceTotal = Math.max(Math.ceil(limit * 0.1), 1); // 10% grace or 1 minimum

      // In a real implementation, you'd track grace usage in the database
      // For now, we'll simulate it by allowing the grace period
      graceUsed = Math.min(overage, graceTotal);
      canProceed = graceUsed < graceTotal;
    }

    // Determine upgrade recommendation
    let recommendation;

    if (!limitCheck.allowed || softLimitLevel === "exceeded") {
      recommendation = getUpgradeRecommendation(userPlan, "portals");
    }

    const response: SoftLimitResponse = {
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      current,
      limit,
      percentage,
      softLimitLevel,
      canProceed,
      requiresUpgrade: !limitCheck.allowed || softLimitLevel === "critical",
      graceUsed,
      graceTotal,
      recommendation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking portal limits:", error);

    return NextResponse.json(
      { error: "Failed to check portal limits" },
      { status: 500 },
    );
  }
}

function calculateSoftLimitLevel(
  percentage: number,
  hardBlocked: boolean,
): "normal" | "warning" | "critical" | "exceeded" {
  if (hardBlocked || percentage >= 100) {
    return "exceeded";
  }

  if (percentage >= 90) {
    return "critical";
  }

  if (percentage >= 80) {
    return "warning";
  }

  return "normal";
}

function getUpgradeRecommendation(
  currentPlan: PlanType,
  resourceType: string,
): { suggestedPlan: PlanType; message: string } {
  const planUpgrades: Record<PlanType, PlanType> = {
    free: "pro",
    pro: "team",
    team: "enterprise",
    enterprise: "enterprise",
  };

  const suggestedPlan = planUpgrades[currentPlan];

  const resourceMessages: Record<string, Record<PlanType, string>> = {
    portals: {
      free: "Upgrade to Professional for 10 portals",
      pro: "Upgrade to Business for 50 portals",
      team: "Upgrade to Enterprise for unlimited portals",
      enterprise: "Contact support for additional resources",
    },
    storage: {
      free: "Upgrade to Professional for 50GB storage",
      pro: "Upgrade to Business for 250GB storage",
      team: "Upgrade to Enterprise for 1TB storage",
      enterprise: "Contact support for additional storage",
    },
    customDomains: {
      free: "Upgrade to Professional for custom domains",
      pro: "Upgrade to Business for 5 custom domains",
      team: "Upgrade to Enterprise for unlimited custom domains",
      enterprise: "You already have unlimited custom domains",
    },
  };

  return {
    suggestedPlan,
    message:
      resourceMessages[resourceType]?.[currentPlan] ||
      "Upgrade your plan for more resources",
  };
}
