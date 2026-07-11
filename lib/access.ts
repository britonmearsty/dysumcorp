import { logger } from "./logger";
import { prisma } from "@/lib/prisma";

export type AccessReason = "pro_active" | "pro_cancelled_grace" | "early_access" | "free";

export interface AccessResult {
  allowed: boolean;
  reason: AccessReason;
  /** Only set when cancelled but still within the paid period */
  periodEnd?: Date;
  /** Only set when on active early access */
  expiresAt?: Date;
}

/** Fields required to evaluate access without a separate DB round-trip. */
export const USER_ACCESS_SELECT = {
  subscriptionPlan: true,
  subscriptionStatus: true,
  polarCurrentPeriodEnd: true,
  status: true,
  earlyAccess: true,
  earlyAccessExpiresAt: true,
} as const;

export type UserAccessFields = {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  polarCurrentPeriodEnd: Date | string | null;
  status: string | null;
  earlyAccess: boolean | null;
  earlyAccessExpiresAt: Date | string | null;
};

/**
 * Evaluate access from an already-fetched user row (no DB query).
 */
export function checkAccessFromUser(
  user: UserAccessFields | null | undefined,
): AccessResult {
  if (!user) {
    return { allowed: false, reason: "free" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  if (plan === "pro") {
    if (status === "active") {
      return { allowed: true, reason: "pro_active" };
    }

    if (status === "cancelled" && user.polarCurrentPeriodEnd) {
      const periodEnd = new Date(user.polarCurrentPeriodEnd);
      if (periodEnd > new Date()) {
        return { allowed: true, reason: "pro_cancelled_grace", periodEnd };
      }
    }
  }

  if (user.earlyAccess === true && user.earlyAccessExpiresAt) {
    const expiresAt = new Date(user.earlyAccessExpiresAt);
    if (expiresAt > new Date()) {
      return { allowed: true, reason: "early_access", expiresAt };
    }
  }

  return { allowed: false, reason: "free" };
}

/**
 * Single source of truth for access decisions.
 *
 * Allowed states:
 *   - pro + active              → paid subscriber, full access
 *   - pro + cancelled           → cancelled at period end, access continues until polarCurrentPeriodEnd
 *
 * Blocked states:
 *   - free + active (default)   → no subscription, portal creation blocked
 *   - pro + cancelled + expired → period has ended, portals deactivated by webhook
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_ACCESS_SELECT,
  });

  return checkAccessFromUser(user);
}

/**
 * Deactivate a free-tier portal when it hits the 10-file cap.
 * Pass ownerAccessAllowed from a presign-time check (or upload token) to skip a user lookup.
 */
export async function maybeDeactivateFreePortalAtFileLimit(
  portalId: string,
  ownerAccessAllowed: boolean,
  logPrefix = "",
): Promise<void> {
  if (ownerAccessAllowed) return;

  const portal = await prisma.portal.findUnique({
    where: { id: portalId },
    select: { id: true, isActive: true },
  });

  if (!portal?.isActive) return;

  const fileCount = await prisma.file.count({
    where: { portalId: portal.id },
  });

  if (fileCount >= 10) {
    await prisma.portal.update({
      where: { id: portal.id },
      data: { isActive: false },
    });
    if (logPrefix) {
      logger.log(
        `${logPrefix} Free portal ${portal.id} deactivated: file limit reached (${fileCount}/10)`,
      );
    }
  }
}
