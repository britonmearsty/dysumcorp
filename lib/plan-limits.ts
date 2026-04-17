import { prisma } from "@/lib/prisma";
import { PRICING_PLANS, PlanType, PlanLimits } from "@/config/pricing";

// trial gets pro limits; expired gets zero limits (no access)
function getEffectivePlan(planType: PlanType) {
  if (planType === "pro" || planType === "trial") return PRICING_PLANS["pro"];

  return {
    ...PRICING_PLANS["pro"],
    limits: {
      ...PRICING_PLANS["pro"].limits,
      portals: 0,
      storage: 0,
      customDomains: 0,
    },
  };
}

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

export interface FeatureAccessCheck {
  allowed: boolean;
  reason?: string;
  upgrade?: boolean;
  currentPlan?: PlanType;
}

export async function checkPortalLimit(
  userId: string,
  planType: PlanType,
  softMode: boolean = false,
): Promise<PlanLimitCheck> {
  const limits = getEffectivePlan(planType).limits;
  const currentCount = await prisma.portal.count({ where: { userId } });

  const effectiveLimit = softMode
    ? limits.portals + Math.max(Math.ceil(limits.portals * 0.1), 1)
    : limits.portals;

  if (currentCount >= effectiveLimit) {
    return {
      allowed: false,
      reason: `Portal limit exceeded. Your ${planType} plan allows ${limits.portals} portal(s) and grace period is exhausted.`,
      current: currentCount,
      limit: limits.portals,
    };
  }

  if (currentCount >= limits.portals) {
    if (softMode) {
      return {
        allowed: true,
        reason: `Portal limit reached. Your ${planType} plan allows ${limits.portals} portal(s). You have ${effectiveLimit - currentCount} grace uses remaining.`,
        current: currentCount,
        limit: limits.portals,
      };
    } else {
      return {
        allowed: false,
        reason: `Portal limit reached. Your ${planType} plan allows ${limits.portals} portal(s).`,
        current: currentCount,
        limit: limits.portals,
      };
    }
  }

  return { allowed: true, current: currentCount, limit: limits.portals };
}

export async function checkStorageLimit(
  userId: string,
  planType: PlanType,
  additionalBytes: number = 0,
): Promise<PlanLimitCheck> {
  const limits = getEffectivePlan(planType).limits;
  const limitBytes = limits.storage * 1024 * 1024 * 1024;

  const files = await prisma.file.findMany({
    where: { portal: { userId } },
    select: { size: true },
  });

  const usedBytes = files.reduce(
    (acc: number, f: { size: bigint | number }) => acc + Number(f.size),
    0,
  );
  const totalBytes = usedBytes + additionalBytes;

  if (totalBytes > limitBytes) {
    return {
      allowed: false,
      reason: `Storage limit exceeded. Your ${planType} plan allows ${limits.storage}GB.`,
      current: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
      limit: limits.storage,
    };
  }

  return {
    allowed: true,
    current: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
    limit: limits.storage,
  };
}

export async function checkCustomDomainLimit(
  userId: string,
  planType: PlanType,
): Promise<PlanLimitCheck> {
  const limits = getEffectivePlan(planType).limits;

  if (limits.customDomains === 0) {
    return {
      allowed: false,
      reason: `Custom domains not available on ${planType} plan.`,
      current: 0,
      limit: 0,
    };
  }

  const currentCount = await prisma.portal.count({
    where: { userId, customDomain: { not: null } },
  });

  if (currentCount >= limits.customDomains) {
    return {
      allowed: false,
      reason: `Custom domain limit reached. Your ${planType} plan allows ${limits.customDomains} domain(s).`,
      current: currentCount,
      limit: limits.customDomains,
    };
  }

  return { allowed: true, current: currentCount, limit: limits.customDomains };
}

export function checkFeatureAccess(
  planType: PlanType,
  feature: keyof PlanLimits,
): FeatureAccessCheck {
  const limits = getEffectivePlan(planType).limits;
  const allowed = limits[feature] === true;

  if (!allowed) {
    return {
      allowed: false,
      reason: `This feature is not available on the ${planType} plan. Upgrade to Pro to unlock this feature.`,
      upgrade: true,
      currentPlan: planType,
    };
  }

  return { allowed: true, currentPlan: planType };
}

export async function getUserPlanType(userId: string): Promise<PlanType> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true, subscriptionStatus: true, status: true },
  });

  if (!user?.subscriptionPlan) {
    return "trial";
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  // If user is deleted but has active subscription, show as pro
  if (user.status === "deleted") {
    if (plan === "pro" && (status === "active" || status === "trialing" || status === "scheduled_cancel")) {
      return "pro";
    }
    return "expired";
  }

  if (plan === "pro" && (status === "active" || status === "trialing" || status === "scheduled_cancel")) {
    return "pro";
  }

  if (status === "cancelled" || plan === "expired") {
    return "expired";
  }

  return "trial";
}
