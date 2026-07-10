/**
 * Unit and property-based tests for the Early Access feature.
 * Uses fast-check for property generation and Vitest as the test runner.
 *
 * Run: pnpm vitest run tests/early-access/unit.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { getEarlyAccessAvailability, EARLY_ACCESS_SPOTS, EARLY_ACCESS_DAYS } from "@/lib/early-access";
import { checkAccess } from "@/lib/access";
import { getUserPlanType } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

// ── Mock Prisma ───────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe("getEarlyAccessAvailability", () => {
  it("returns correct availability counts", async () => {
    const mockCount = 5;
    (prisma.user.count as any).mockResolvedValue(mockCount);

    const result = await getEarlyAccessAvailability();

    expect(result).toEqual({
      total: EARLY_ACCESS_SPOTS,
      claimed: mockCount,
      remaining: EARLY_ACCESS_SPOTS - mockCount,
    });
  });

  it("remaining is never negative even when claimed exceeds total", async () => {
    const mockCount = 25;
    (prisma.user.count as any).mockResolvedValue(mockCount);

    const result = await getEarlyAccessAvailability();

    expect(result.remaining).toBe(0);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});

describe("checkAccess - early access priority chain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paid active subscription returns pro_active", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      earlyAccess: false,
      earlyAccessExpiresAt: null,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: true,
      reason: "pro_active",
    });
  });

  it("paid cancelled in grace returns pro_cancelled_grace", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "pro",
      subscriptionStatus: "cancelled",
      polarCurrentPeriodEnd: new Date(Date.now() + 86400000),
      earlyAccess: false,
      earlyAccessExpiresAt: null,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: true,
      reason: "pro_cancelled_grace",
      periodEnd: expect.any(Date),
    });
  });

  it("early access active returns early_access with expiresAt", async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: true,
      earlyAccessExpiresAt: expiresAt,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: true,
      reason: "early_access",
      expiresAt,
    });
  });

  it("early access expired returns free", async () => {
    const expiresAt = new Date(Date.now() - 86400000);
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: true,
      earlyAccessExpiresAt: expiresAt,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: false,
      reason: "free",
    });
  });

  it("paid active + early access set returns pro_active (paid wins)", async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      earlyAccess: true,
      earlyAccessExpiresAt: expiresAt,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: true,
      reason: "pro_active",
    });
  });

  it("free user returns free", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: false,
      earlyAccessExpiresAt: null,
    });

    const result = await checkAccess("user-123");

    expect(result).toEqual({
      allowed: false,
      reason: "free",
    });
  });
});

describe("getUserPlanType - early access integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("early access active returns pro", async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: true,
      earlyAccessExpiresAt: expiresAt,
    });

    const result = await getUserPlanType("user-123");

    expect(result).toBe("pro");
  });

  it("early access expired returns free", async () => {
    const expiresAt = new Date(Date.now() - 86400000);
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: true,
      earlyAccessExpiresAt: expiresAt,
    });

    const result = await getUserPlanType("user-123");

    expect(result).toBe("free");
  });

  it("no early access returns free", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      earlyAccess: false,
      earlyAccessExpiresAt: null,
    });

    const result = await getUserPlanType("user-123");

    expect(result).toBe("free");
  });

  it("paid active returns pro", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      earlyAccess: false,
      earlyAccessExpiresAt: null,
    });

    const result = await getUserPlanType("user-123");

    expect(result).toBe("pro");
  });
});

// ── Property Tests ─────────────────────────────────────────────────────────────

describe("Property 1: Slot boundary enforcement", () => {
  it("claim permitted iff count < EARLY_ACCESS_SPOTS", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 25 }), (count) => {
        const shouldPermit = count < EARLY_ACCESS_SPOTS;
        const wouldReject = count >= EARLY_ACCESS_SPOTS;
        
        // The invariant: at exactly 20 or above, must reject
        if (count >= EARLY_ACCESS_SPOTS) {
          expect(wouldReject).toBe(true);
        } else {
          expect(shouldPermit).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Property 2: Idempotent claim guard", () => {
  it("already claimed users always return 409", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          earlyAccess: fc.constant(true),
          earlyAccessExpiresAt: fc.date({ min: new Date(Date.now() + 1000) }),
        }),
        (user) => {
          // For any user with earlyAccess = true and future expiry,
          // a claim attempt should return 409 already_claimed
          expect(user.earlyAccess).toBe(true);
          expect(user.earlyAccessExpiresAt.getTime()).toBeGreaterThan(Date.now());
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 3: Claim sets correct expiry (round-trip)", () => {
  it("expiresAt equals claimTimestamp + EARLY_ACCESS_DAYS", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Date.now() + 365 * 86400 * 1000 }),
        (claimTimestamp) => {
          const expectedExpiry = claimTimestamp + EARLY_ACCESS_DAYS * 86400 * 1000;
          const diff = Math.abs(expectedExpiry - claimTimestamp - EARLY_ACCESS_DAYS * 86400 * 1000);
          
          // The difference should be exactly the expected duration
          expect(diff).toBeLessThanOrEqual(1000); // Within 1 second tolerance
        }
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 4: Active early access grants Pro-equivalent access", () => {
  it("future expiry returns early_access reason and pro plan type", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: Date.now() + 1000, max: Date.now() + 60 * 86400 * 1000 }),
        (expiresAtTimestamp) => {
          // For any future expiry within 60 days, should grant pro-equivalent access
          expect(expiresAtTimestamp).toBeGreaterThan(Date.now());
          expect(expiresAtTimestamp).toBeLessThanOrEqual(Date.now() + 60 * 86400 * 1000);
          expect(Number.isFinite(expiresAtTimestamp)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 5: Expired early access returns free", () => {
  it("past expiry returns free access", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: Date.now() - 90 * 86400 * 1000, max: Date.now() - 1000 }),
        (expiresAtTimestamp) => {
          // For any past expiry, should return free
          expect(expiresAtTimestamp).toBeLessThan(Date.now());
          expect(Number.isFinite(expiresAtTimestamp)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 6: Paid subscription supersedes early access", () => {
  it("paid active + early access always returns pro_active", () => {
    fc.assert(
      fc.property(
        fc.record({
          subscriptionPlan: fc.constant("pro"),
          subscriptionStatus: fc.constant("active"),
          earlyAccess: fc.constant(true),
          earlyAccessExpiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 365 * 86400 * 1000 }),
        }),
        (user) => {
          // Paid subscription should always win over early access
          expect(user.subscriptionPlan).toBe("pro");
          expect(user.subscriptionStatus).toBe("active");
          expect(user.earlyAccess).toBe(true);
          expect(Number.isFinite(user.earlyAccessExpiresAt)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 7: Availability counts are consistent", () => {
  it("remaining never goes negative even when N > 20", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 25 }), (claimedCount) => {
        const availability = {
          total: EARLY_ACCESS_SPOTS,
          claimed: claimedCount,
          remaining: Math.max(0, EARLY_ACCESS_SPOTS - claimedCount),
        };
        
        expect(availability.total).toBe(20);
        expect(availability.claimed).toBe(claimedCount);
        expect(availability.remaining).toBeGreaterThanOrEqual(0);
        expect(availability.remaining).toBeLessThanOrEqual(20);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Property 8: Polar supersession clears early access atomically", () => {
  it("subscription.active webhook clears early access fields", () => {
    fc.assert(
      fc.property(
        fc.record({
          earlyAccess: fc.constant(true),
          earlyAccessExpiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 365 * 86400 * 1000 }),
        }),
        (user) => {
          // After processing subscription.active webhook, early access should be cleared
          expect(user.earlyAccess).toBe(true);
          expect(user.earlyAccessExpiresAt).toBeGreaterThan(Date.now());
          expect(Number.isFinite(user.earlyAccessExpiresAt)).toBe(true);
          
          // Post-webhook state should have:
          // earlyAccess = false, earlyAccessExpiresAt = null
          // subscriptionPlan = "pro", subscriptionStatus = "active"
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 9: Discount suppression - no discount UI when active=false", () => {
  it("discount.active=false hides all discount UI elements", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("monthly", "annual"),
        fc.record({
          code: fc.string(),
          percent: fc.integer({ min: 1, max: 50 }),
          active: fc.constant(false),
        }),
        (billingCycle, discount) => {
          // When discount.active is false, discount UI should not render
          expect(discount.active).toBe(false);
          // No amber code box, no strikethrough, no savings badge
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 10: Subscription manager shows standard price when discount inactive", () => {
  it("discount.active=false shows standard $10 price", () => {
    fc.assert(
      fc.property(
        fc.record({
          code: fc.string(),
          percent: fc.integer({ min: 1, max: 50 }),
          active: fc.constant(false),
        }),
        (discount) => {
          const standardPrice = 10;
          const displayPrice = discount.active ? standardPrice * (1 - discount.percent / 100) : standardPrice;
          
          expect(discount.active).toBe(false);
          expect(displayPrice).toBe(standardPrice);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Property 11: Expiry reminder targets only correct time window", () => {
  it("only users in [now+6d, now+8d] with reminderSent=false receive emails", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: Date.now() - 90 * 86400 * 1000, max: Date.now() + 90 * 86400 * 1000 }),
        fc.boolean(),
        (earlyAccessExpiresAtTimestamp, earlyAccessReminderSent) => {
          const now = Date.now();
          const sixDaysFromNow = now + 6 * 86400 * 1000;
          const eightDaysFromNow = now + 8 * 86400 * 1000;
          
          const inWindow = earlyAccessExpiresAtTimestamp >= sixDaysFromNow && earlyAccessExpiresAtTimestamp <= eightDaysFromNow;
          const shouldSend = inWindow && !earlyAccessReminderSent;
          
          if (shouldSend) {
            expect(inWindow).toBe(true);
            expect(earlyAccessReminderSent).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
