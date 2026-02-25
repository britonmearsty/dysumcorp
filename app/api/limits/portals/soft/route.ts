import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkPortalLimit, getUserPlanType } from "@/lib/plan-limits";
import { getSessionFromRequest } from "@/lib/auth-server";
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
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userPlan = await getUserPlanType(userId);

    const limitCheck = await checkPortalLimit(userId, userPlan);

    const current = limitCheck.current || 0;
    const limit = limitCheck.limit || 0;
    const percentage = limit ? (current / limit) * 100 : 0;

    // Get grace usage from database for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const graceUsageRecords = await prisma.graceUsage.findMany({
      where: {
        userId,
        resourceType: "portal",
        usedAt: {
          gte: new Date(`${currentMonth}-01`),
        },
      },
    });

    const graceUsed = graceUsageRecords.reduce(
      (acc, record) => acc + record.amount,
      0,
    );
    const graceTotal = Math.max(Math.ceil(limit * 0.1), 1);

    const softLimitLevel = calculateSoftLimitLevel(
      percentage,
      limitCheck.allowed,
      graceUsed,
      graceTotal,
    );
    const canProceed = limitCheck.allowed || graceUsed < graceTotal;

    let recommendation;

    if (
      !limitCheck.allowed ||
      softLimitLevel === "critical" ||
      softLimitLevel === "exceeded"
    ) {
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
      requiresUpgrade: !limitCheck.allowed && graceUsed >= graceTotal,
      graceUsed: graceUsed > 0 ? graceUsed : undefined,
      graceTotal: current >= limit ? graceTotal : undefined,
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { resourceType = "portal", amount = 1, notes } = body;

    // Record grace usage
    await prisma.graceUsage.create({
      data: {
        userId,
        resourceType,
        amount,
        notes,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording grace usage:", error);

    return NextResponse.json(
      { error: "Failed to record grace usage" },
      { status: 500 },
    );
  }
}

function calculateSoftLimitLevel(
  percentage: number,
  hardBlocked: boolean,
  graceUsed: number,
  graceTotal: number,
): "normal" | "warning" | "critical" | "exceeded" {
  if (hardBlocked && graceUsed >= graceTotal) {
    return "exceeded";
  }

  if (hardBlocked || percentage >= 100) {
    return "critical";
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
    pro: "pro",
  };

  const suggestedPlan = planUpgrades[currentPlan];

  const resourceMessages: Record<string, Record<PlanType, string>> = {
    portals: {
      free: "Upgrade to Pro for unlimited portals",
      pro: "You already have unlimited portals",
    },
    storage: {
      free: "Upgrade to Pro for 500GB storage",
      pro: "You already have 500GB storage",
    },
    customDomains: {
      free: "Upgrade to Pro for 1 custom domain",
      pro: "You already have 1 custom domain",
    },
  };

  return {
    suggestedPlan,
    message:
      resourceMessages[resourceType]?.[currentPlan] ||
      "Upgrade your plan for more resources",
  };
}
