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
 *   - pro + active              → paid subscriber, full access
 *   - pro + trialing            → card on file, within 7-day trial (Creem will charge on day 7)
 *   - pro + scheduled_cancel    → paid subscriber who cancelled at period end; access until periodEnd
 *   - deleted + pro + active/trialing/scheduled_cancel → subscription still valid in Creem
 *
 * Blocked states:
 *   - trial + trialing (new user, no card) → no subscription yet
 *   - expired + cancelled       → trial was cancelled, or subscription fully ended
 *   - expired + expired         → subscription period ended without renewal
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
    if (
      plan === "pro" &&
      (status === "active" || status === "trialing" || status === "scheduled_cancel")
    ) {
      return { allowed: true, reason: "active_subscription" };
    }
    return { allowed: false, reason: "no_subscription" };
  }

  // Paid subscriber - full access
  if (plan === "pro" && status === "active") {
    return { allowed: true, reason: "active_subscription" };
  }

  // Pro trial - card on file, within 7-day trial (Creem will charge on day 7)
  if (plan === "pro" && status === "trialing") {
    return { allowed: true, reason: "trialing" };
  }

  // Scheduled cancel - paid subscriber cancelled at period end; access continues until periodEnd
  if (plan === "pro" && status === "scheduled_cancel") {
    const subscription = await prisma.creem_subscription.findFirst({
      where: { referenceId: userId },
      select: { periodEnd: true },
    });

    if (
      subscription?.periodEnd &&
      new Date(subscription.periodEnd) > new Date()
    ) {
      return { allowed: true, reason: "active_subscription" };
    }

    // Period has ended — treat as expired
    return { allowed: false, reason: "expired" };
  }

  // Cancelled (trial cancelled or immediate cancel) — block immediately
  if (status === "cancelled") {
    return { allowed: false, reason: "expired" };
  }

  // Expired subscription period ended without renewal
  if (plan === "expired" || status === "expired") {
    return { allowed: false, reason: "expired" };
  }

  // New user with no subscription (plan="trial", status="trialing")
  return { allowed: false, reason: "no_subscription" };
}
