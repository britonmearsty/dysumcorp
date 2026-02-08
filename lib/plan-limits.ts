import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PRICING_PLANS, PlanType } from "@/config/pricing";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
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

  if (currentCount >= limits.portals) {
    if (softMode && currentCount < effectiveLimit) {
      // Allow with warning
      return {
        allowed: false,
        reason: `Portal limit reached. Your ${planType} plan allows ${limits.portals} portal(s). You have ${effectiveLimit - currentCount} grace uses remaining.`,
        current: currentCount,
        limit: limits.portals,
      };
    } else if (currentCount >= effectiveLimit) {
      // Hard block
      return {
        allowed: false,
        reason: `Portal limit exceeded. Your ${planType} plan allows ${limits.portals} portal(s) and grace period is exhausted.`,
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

export async function checkTeamMemberLimit(
  userId: string,
  planType: PlanType,
): Promise<PlanLimitCheck> {
  const limits = PRICING_PLANS[planType].limits;

  // Get all teams owned by user
  const teams = await prisma.team.findMany({
    where: { ownerId: userId },
    include: {
      members: true,
    },
  });

  const currentCount =
    teams.reduce((acc: number, team: any) => acc + team.members.length, 0) + 1; // +1 for owner

  if (currentCount >= limits.teamMembers) {
    return {
      allowed: false,
      reason: `Team member limit reached. Your ${planType} plan allows ${limits.teamMembers} member(s).`,
      current: currentCount,
      limit: limits.teamMembers,
    };
  }

  return { allowed: true, current: currentCount, limit: limits.teamMembers };
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
  feature: keyof typeof PRICING_PLANS.free.limits,
): boolean {
  const limits = PRICING_PLANS[planType].limits;

  return limits[feature] === true;
}

export async function getUserPlanType(userId: string): Promise<PlanType> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return (user?.subscriptionPlan as PlanType) || "free";
}
