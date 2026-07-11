import { prisma } from "@/lib/prisma";

export const EARLY_ACCESS_SPOTS = 20;
export const EARLY_ACCESS_DAYS = 60;

export interface EarlyAccessAvailability {
  total: number;
  claimed: number;
  remaining: number;
}

/**
 * Returns the current availability counts for the early access promotion.
 * Reads directly from the DB — no caching.
 */
export async function getEarlyAccessAvailability(): Promise<EarlyAccessAvailability> {
  const claimed = await prisma.user.count({ where: { earlyAccess: true } });
  return {
    total: EARLY_ACCESS_SPOTS,
    claimed,
    remaining: Math.max(0, EARLY_ACCESS_SPOTS - claimed),
  };
}

// ============================================================
// ADMIN QUERIES — run in prisma studio or a script
// ============================================================
//
// List all current early access users with their expiry dates:
//   prisma.user.findMany({
//     where: { earlyAccess: true },
//     select: { id: true, email: true, name: true, earlyAccessExpiresAt: true }
//   })
//
// Revoke early access for a specific user by ID:
//   prisma.user.update({
//     where: { id: '<userId>' },
//     data: { earlyAccess: false, earlyAccessExpiresAt: null }
//   })
//
// Check current claimed spot count:
//   prisma.user.count({ where: { earlyAccess: true } })
//
// To adjust the spot cap, change EARLY_ACCESS_SPOTS in this file.
// The Claim_Handler reads this constant at runtime — no DB migration needed.
// ============================================================
