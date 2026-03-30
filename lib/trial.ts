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

  console.log("[checkAccess] User:", userId, "Data:", user);

  if (!user) {
    return { allowed: false, reason: "no_subscription" };
  }

  if (user.status === "deleted") {
    return { allowed: false, reason: "no_subscription" };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  console.log(
    "[checkAccess] plan:",
    plan,
    "status:",
    status,
    "user.status:",
    user.status,
  );

  // Paid subscriber - full access
  if (plan === "pro" && status === "active") {
    console.log("[checkAccess] Allowing: active_subscription");
    return { allowed: true, reason: "active_subscription" };
  }

  // Pro trial - 7-day free trial before billing
  if (plan === "pro" && status === "trialing") {
    console.log("[checkAccess] Allowing: trialing");
    return { allowed: true, reason: "trialing" };
  }

  // Expired subscription
  if (status === "cancelled" || plan === "expired") {
    console.log("[checkAccess] Denying: expired");
    return { allowed: false, reason: "expired" };
  }

  // No subscription - need to subscribe
  console.log(
    "[checkAccess] Denying: no_subscription (plan=" +
      plan +
      ", status=" +
      status +
      ")",
  );
  return { allowed: false, reason: "no_subscription" };
}
