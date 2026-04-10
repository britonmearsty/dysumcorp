import { prisma } from "@/lib/prisma";

export interface AccessResult {
  allowed: boolean;
  reason: "active_subscription" | "trialing" | "no_subscription" | "expired";
  fileCount?: number;
  fileLimit?: number;
}

/**
 * Single source of truth for access decisions.
 * Creem owns the trial period and billing — we just read the subscription status
 * that Creem webhooks write into our DB via onGrantAccess / onRevokeAccess.
 *
 * Allowed states:
 *   - pro + active    → paid subscriber
 *   - pro + trialing  → card on file, within 7-day trial (Creem will charge on day 7)
 *   - deleted + pro + active/trialing → allow access (subscription still valid in Creem)
 *   - anything else   → no access, need to subscribe
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      status: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "no_subscription" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  // Deleted users with active subscription can still access (subscription valid in Creem)
  if (user.status === "deleted") {
    if (plan === "pro" && (status === "active" || status === "trialing")) {
      return { allowed: true, reason: "active_subscription" };
    }

    return { allowed: false, reason: "no_subscription" };
  }

  // Paid subscriber - full access
  if (plan === "pro" && status === "active") {
    return { allowed: true, reason: "active_subscription" };
  }

  // Pro trial - 7-day free trial before billing
  if (plan === "pro" && status === "trialing") {
    return { allowed: true, reason: "trialing" };
  }

  // Expired subscription - no access
  if (plan === "expired" || status === "expired") {
    return { allowed: false, reason: "expired" };
  }

  // Cancelled but still has access until period end
  if (status === "cancelled") {
    // Check if still within the billing period by checking creem_subscription
    const subscription = await prisma.creem_subscription.findFirst({
      where: { referenceId: userId },
      select: { periodEnd: true },
    });

    if (
      subscription?.periodEnd &&
      new Date(subscription.periodEnd) > new Date()
    ) {
      // Still within period - allow access
      return { allowed: true, reason: "active_subscription" };
    }

    // Period has passed - no access
    return { allowed: false, reason: "expired" };
  }

  // No subscription - need to subscribe
  return { allowed: false, reason: "no_subscription" };
}
