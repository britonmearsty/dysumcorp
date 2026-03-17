import { prisma } from "@/lib/prisma";

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

export interface AccessResult {
  allowed: boolean;
  reason: "active_subscription" | "trial_active" | "trial_expired" | "no_trial";
  trialDaysRemaining?: number; // present when trial is active
  trialDaysExpired?: number;   // present when trial has expired
}

/**
 * Returns the exact expiry Date for a given trial start timestamp.
 * Property 1: always exactly 14 days after trialStartedAt.
 */
export function getTrialExpiry(trialStartedAt: Date): Date {
  return new Date(trialStartedAt.getTime() + TRIAL_DURATION_MS);
}

/**
 * Returns the number of full calendar days remaining in the trial.
 * Property 8: ceil((expiry - now) / 1 day), positive integer.
 */
export function getTrialDaysRemaining(trialStartedAt: Date, now: Date = new Date()): number {
  const expiry = getTrialExpiry(trialStartedAt);
  const msRemaining = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

/**
 * Returns the number of full calendar days since the trial expired.
 */
export function getTrialDaysExpired(trialStartedAt: Date, now: Date = new Date()): number {
  const expiry = getTrialExpiry(trialStartedAt);
  const msExpired = now.getTime() - expiry.getTime();
  return Math.max(0, Math.ceil(msExpired / (24 * 60 * 60 * 1000)));
}

/**
 * Single source of truth for access decisions.
 * Always reads fresh from DB — never relies on session cache.
 */
export async function checkAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialStartedAt: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: "no_trial" };
  }

  // Active subscriber always gets access (Property 6, 10)
  if (
    user.subscriptionPlan === "pro" &&
    user.subscriptionStatus === "active"
  ) {
    return { allowed: true, reason: "active_subscription" };
  }

  // No trial ever started
  if (!user.trialStartedAt) {
    return { allowed: false, reason: "no_trial" };
  }

  const now = new Date();
  const expiry = getTrialExpiry(user.trialStartedAt);

  if (now < expiry) {
    // Trial is still active (Property 4)
    return {
      allowed: true,
      reason: "trial_active",
      trialDaysRemaining: getTrialDaysRemaining(user.trialStartedAt, now),
    };
  }

  // Trial has expired (Property 5)
  return {
    allowed: false,
    reason: "trial_expired",
    trialDaysExpired: getTrialDaysExpired(user.trialStartedAt, now),
  };
}

/**
 * Provisions a trial for a newly created user.
 * Idempotent: will not overwrite an existing trialStartedAt (Property 3).
 * Uses updateMany with a null-check condition to prevent race conditions.
 */
export async function provisionTrial(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      id: userId,
      trialStartedAt: null,
    },
    data: {
      trialStartedAt: new Date(),
      subscriptionPlan: "trial",
      subscriptionStatus: "trialing",
      hadTrial: true,
    },
  });
}
