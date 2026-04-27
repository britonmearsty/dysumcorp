import { prisma } from "@/lib/prisma";

export type AccessReason = "pro_active" | "pro_cancelled_grace" | "free";

export interface AccessResult {
  allowed: boolean;
  reason: AccessReason;
  /** Only set when cancelled but still within the paid period */
  periodEnd?: Date;
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
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      polarCurrentPeriodEnd: true,
      status: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "free" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  if (plan === "pro") {
    if (status === "active") {
      return { allowed: true, reason: "pro_active" };
    }

    // Cancelled but still within the billing period — Polar fires subscription.revoked
    // when the period actually ends, at which point we set plan back to "free".
    // Until then, access is still valid.
    if (status === "cancelled" && user.polarCurrentPeriodEnd) {
      const periodEnd = new Date(user.polarCurrentPeriodEnd);
      if (periodEnd > new Date()) {
        return { allowed: true, reason: "pro_cancelled_grace", periodEnd };
      }
    }
  }

  return { allowed: false, reason: "free" };
}
