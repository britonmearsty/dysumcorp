import { prisma } from "@/lib/prisma";

export interface AccessResult {
  allowed: boolean;
  reason: "active_subscription" | "trialing" | "no_subscription" | "expired";
}

/**
 * Single source of truth for access decisions.
 * Creem owns the trial period and billing — we just read the subscription status
 * that Creem webhooks write into our DB via onGrantAccess / onRevokeAccess.
 *
 * Allowed states:
 *   - pro + active    → paid subscriber
 *   - pro + trialing  → card on file, within 7-day trial (Creem will charge on day 7)
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "no_subscription" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  if (plan === "pro" && status === "active") {
    return { allowed: true, reason: "active_subscription" };
  }

  if (plan === "pro" && status === "trialing") {
    return { allowed: true, reason: "trialing" };
  }

  if (status === "cancelled" || plan === "expired") {
    return { allowed: false, reason: "expired" };
  }

  return { allowed: false, reason: "no_subscription" };
}
