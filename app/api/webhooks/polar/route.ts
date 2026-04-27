import { Webhooks } from "@polar-sh/nextjs";

import { prisma } from "@/lib/prisma";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  /**
   * Subscription becomes active — new subscription or renewal.
   * Grant full access and reactivate any deactivated portals.
   */
  onSubscriptionActive: async (payload) => {
    const sub = payload.data;
    const userId = sub.customer.externalId;
    if (!userId) {
      console.error("[Polar] onSubscriptionActive: no customer.externalId");
      return;
    }

    console.log(`[Polar] Subscription active for user ${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
        polarCustomerId: sub.customerId,
        polarSubscriptionId: sub.id,
        polarCurrentPeriodEnd: sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd)
          : null,
      },
    });

    // Reactivate portals that were deactivated when subscription lapsed
    await prisma.portal.updateMany({
      where: { userId },
      data: { isActive: true },
    });
  },

  /**
   * Subscription updated — handles cancel_at_period_end being set to true.
   * User still has access until the period ends; do NOT deactivate portals.
   */
  onSubscriptionUpdated: async (payload) => {
    const sub = payload.data;
    const userId = sub.customer.externalId;
    if (!userId) return;

    // Only act on cancel_at_period_end changes here — active renewals are
    // handled by onSubscriptionActive.
    if (sub.cancelAtPeriodEnd) {
      console.log(
        `[Polar] Subscription scheduled to cancel at period end for user ${userId}`,
      );
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "cancelled",
          polarCurrentPeriodEnd: sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd)
            : null,
        },
      });
    }
  },

  /**
   * Subscription canceled — cancel_at_period_end was set.
   * Access continues until polarCurrentPeriodEnd. Do NOT deactivate portals.
   * Polar will fire subscription.revoked when the period actually ends.
   */
  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data;
    const userId = sub.customer.externalId;
    if (!userId) return;

    console.log(
      `[Polar] Subscription canceled (grace period active) for user ${userId}`,
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "cancelled",
        polarCurrentPeriodEnd: sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd)
          : null,
      },
    });
    // Portals remain active — user keeps access until period end
  },

  /**
   * Subscription revoked — billing period has ended, access fully removed.
   * Deactivate all portals and reset user to free plan.
   */
  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data;
    const userId = sub.customer.externalId;
    if (!userId) {
      console.error("[Polar] onSubscriptionRevoked: no customer.externalId");
      return;
    }

    console.log(`[Polar] Subscription revoked for user ${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: "free",
        subscriptionStatus: "active", // reset to default free state
        polarSubscriptionId: null,
        polarCurrentPeriodEnd: null,
      },
    });

    // Deactivate all portals — user must resubscribe to reactivate
    await prisma.portal.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  },

  /**
   * Customer created — store the Polar customer ID for portal redirects.
   */
  onCustomerCreated: async (payload) => {
    const customer = payload.data;
    const userId = customer.externalId;
    if (!userId) return;

    console.log(
      `[Polar] Customer created: ${customer.id} for user ${userId}`,
    );

    await prisma.user.update({
      where: { id: userId },
      data: { polarCustomerId: customer.id },
    });
  },

  /**
   * Catch-all for any unhandled events — log for debugging.
   */
  onPayload: async (payload) => {
    console.log(`[Polar] Webhook received: ${payload.type}`);
  },
});
