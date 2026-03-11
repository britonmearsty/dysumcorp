import { prisma } from "@/lib/prisma";
import { PRICING_PLANS, PlanType, PlanLimits } from "@/config/pricing";

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
  const limits = PRICING_PLANS[planType].limits;
  const currentCount = await prisma.portal.count({
    where: { userId },
  });

  // In soft mode, allow 10% overage or 1 extra portal minimum
  const effectiveLimit = softMode
    ? limits.portals + Math.max(Math.ceil(limits.portals * 0.1), 1)
    : limits.portals;

  if (currentCount >= effectiveLimit) {
    // Hard block - exceeded even the soft limit
    return {
      allowed: false,
      reason: `Portal limit exceeded. Your ${planType} plan allows ${limits.portals} portal(s) and grace period is exhausted.`,
      current: currentCount,
      limit: limits.portals,
    };
  }

  if (currentCount >= limits.portals) {
    if (softMode) {
      // Allow with warning in soft mode
      return {
        allowed: true,
        reason: `Portal limit reached. Your ${planType} plan allows ${limits.portals} portal(s). You have ${effectiveLimit - currentCount} grace uses remaining.`,
        current: currentCount,
        limit: limits.portals,
      };
    } else {
      // Hard block in non-soft mode
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
  const limits = PRICING_PLANS[planType].limits;
  const limitBytes = limits.storage * 1024 * 1024 * 1024; // Convert GB to bytes

  // Get all files for user's portals
  const files = await prisma.file.findMany({
    where: {
      portal: {
        userId,
      },
    },
    select: {
      size: true,
    },
  });

  const currentBytes = files.reduce(
    (acc: number, file: any) => acc + Number(file.size),
    0,
  );
  const totalBytes = currentBytes + additionalBytes;

  if (totalBytes > limitBytes) {
    return {
      allowed: false,
      reason: `Storage limit exceeded. Your ${planType} plan allows ${limits.storage}GB.`,
      current: Math.round((currentBytes / (1024 * 1024 * 1024)) * 100) / 100,
      limit: limits.storage,
    };
  }

  return {
    allowed: true,
    current: Math.round((currentBytes / (1024 * 1024 * 1024)) * 100) / 100,
    limit: limits.storage,
  };
}

export async function checkCustomDomainLimit(
  userId: string,
  planType: PlanType,
): Promise<PlanLimitCheck> {
  const limits = PRICING_PLANS[planType].limits;

  if (limits.customDomains === 0) {
    return {
      allowed: false,
      reason: `Custom domains not available on ${planType} plan.`,
      current: 0,
      limit: 0,
    };
  }

  const currentCount = await prisma.portal.count({
    where: {
      userId,
      customDomain: {
        not: null,
      },
    },
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
  const limits = PRICING_PLANS[planType].limits;
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
  });

  return (user?.subscriptionPlan as PlanType) || "free";
}

export async function recordGraceUsage(
  userId: string,
  resourceType: "portal" | "storage",
  amount: number = 1,
  notes?: string,
): Promise<void> {
  await prisma.graceUsage.create({
    data: {
      userId,
      resourceType,
      amount,
      notes,
    },
  });
}

export async function getGraceUsage(
  userId: string,
  resourceType: "portal" | "storage",
): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const records = await prisma.graceUsage.findMany({
    where: {
      userId,
      resourceType,
      usedAt: {
        gte: new Date(`${currentMonth}-01`),
      },
    },
  });

  return records.reduce((acc, record) => acc + record.amount, 0);
}
