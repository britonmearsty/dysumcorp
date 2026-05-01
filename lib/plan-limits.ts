import { prisma } from "@/lib/prisma";
import { PRICING_PLANS, PlanType, PlanLimits } from "@/config/pricing";

function getEffectivePlan(planType: PlanType) {
  if (planType === "pro") return PRICING_PLANS["pro"];

  // REVERSIBILITY: To revert trial feature, change portals back to 0
  // Free users get trial limits: 1 portal, 10 files, no premium features
  return {
    ...PRICING_PLANS["pro"],
    limits: {
      ...PRICING_PLANS["pro"].limits,
      portals: 1, // Trial: 1 portal allowed
      storage: 0,
      customDomains: 0,
      whiteLabeling: false,
      passwordProtection: false,
      expiringLinks: false,
      customBranding: false,
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
): Promise<PlanLimitCheck> {
  const limits = getEffectivePlan(planType).limits;

  if (limits.portals === 0) {
    return {
      allowed: false,
      reason: "A Pro subscription is required to create portals.",
      current: 0,
      limit: 0,
    };
  }

  // REVERSIBILITY: Remove this block to revert trial feature
  // Check if free user has already used their trial portal
  if (planType === "free" && limits.portals === 1) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasCreatedTrialPortal: true },
    });

    if (user?.hasCreatedTrialPortal) {
      return {
        allowed: false,
        reason: "You've used your free trial portal. Upgrade to Pro to create more portals.",
        current: 1,
        limit: 1,
      };
    }
  }

  // Pro has unlimited portals (999999) — always allowed
  return { allowed: true, current: 0, limit: limits.portals };
}

export async function checkStorageLimit(
  userId: string,
  planType: PlanType,
  additionalBytes: number = 0,
): Promise<PlanLimitCheck> {
  const limits = getEffectivePlan(planType).limits;
  // Storage is not enforced - files go to user's cloud (Google Drive/Dropbox)
  const storageLimit = limits.storage ?? Number.MAX_SAFE_INTEGER;
  const limitBytes = storageLimit * 1024 * 1024 * 1024;

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
      reason: `Storage limit exceeded. Your ${planType} plan allows ${storageLimit}GB.`,
      current: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
      limit: storageLimit,
    };
  }

  return {
    allowed: true,
    current: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
    limit: storageLimit,
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

// REVERSIBILITY: Remove this function to revert trial file limit feature
export async function checkPortalFileLimit(
  portalId: string,
  planType: PlanType,
): Promise<PlanLimitCheck> {
  // Pro users have no file limit
  if (planType === "pro") {
    return { allowed: true, current: 0, limit: 999999 };
  }

  // Free trial: 10 files max per portal
  const fileLimit = 10;
  const currentCount = await prisma.file.count({
    where: { portalId },
  });

  if (currentCount >= fileLimit) {
    return {
      allowed: false,
      reason: "Your trial portal has reached the 10 file limit. Upgrade to Pro for unlimited file uploads.",
      current: currentCount,
      limit: fileLimit,
    };
  }

  return { allowed: true, current: currentCount, limit: fileLimit };
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
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      polarCurrentPeriodEnd: true,
      status: true,
    },
  });

  if (!user) return "free";

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  if (plan === "pro") {
    if (status === "active") return "pro";

    // Cancelled but still within the paid period
    if (status === "cancelled" && user.polarCurrentPeriodEnd) {
      if (new Date(user.polarCurrentPeriodEnd) > new Date()) return "pro";
    }
  }

  return "free";
}
