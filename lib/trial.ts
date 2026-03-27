import { prisma } from "@/lib/prisma";

export interface AccessResult {
  allowed: boolean;
  reason:
    | "active_subscription"
    | "trialing"
    | "no_subscription"
    | "expired"
    | "trial_limit_exceeded";
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
 *   - trial + not over file limit → can create 1 portal, limited to 15 files
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialFileLimit: true,
      trialFileCount: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "no_subscription" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  // Paid subscriber - full access
  if (plan === "pro" && status === "active") {
    return { allowed: true, reason: "active_subscription" };
  }

  if (plan === "pro" && status === "trialing") {
    return { allowed: true, reason: "trialing" };
  }

  // Trial users - check file limit
  if (plan === "trial") {
    if (user.trialFileCount >= user.trialFileLimit) {
      return {
        allowed: false,
        reason: "trial_limit_exceeded",
        fileCount: user.trialFileCount,
        fileLimit: user.trialFileLimit,
      };
    }
    return { allowed: true, reason: "trialing" };
  }

  // Expired or no subscription
  if (status === "cancelled" || plan === "expired") {
    return { allowed: false, reason: "expired" };
  }

  return { allowed: false, reason: "no_subscription" };
}
