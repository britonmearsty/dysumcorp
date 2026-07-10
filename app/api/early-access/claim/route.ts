import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { EARLY_ACCESS_SPOTS, EARLY_ACCESS_DAYS } from "@/lib/early-access";

// Custom error used to signal slot exhaustion inside the transaction.
class NoSpotsError extends Error {
  constructor() {
    super("no_spots_remaining");
    this.name = "NoSpotsError";
  }
}

// POST /api/early-access/claim
// Authenticated — returns 401 if no valid session is found.
//
// Atomically reserves one of the EARLY_ACCESS_SPOTS slots for the requesting
// user. The slot count is checked under a SELECT … FOR UPDATE lock so that
// concurrent requests cannot both read "19 claimed" and both succeed,
// overshooting the cap.
//
// To adjust the spot cap, change EARLY_ACCESS_SPOTS in lib/early-access.ts.
// The constant is read at runtime — no DB migration is required.
export async function POST(request: Request): Promise<NextResponse> {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  const session = await getSessionFromRequest(request);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // ── 2. Idempotency guard (fast-path, outside the transaction) ──────────
    // If the user already has early access, skip the expensive transaction.
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { earlyAccess: true },
    });

    if (existingUser?.earlyAccess === true) {
      return NextResponse.json(
        { error: "already_claimed" },
        { status: 409 },
      );
    }

    // ── 3. Atomic slot reservation ─────────────────────────────────────────
    // Compute the expiry date before entering the transaction so it is
    // consistent with the lock acquisition time.
    const expiresAt = new Date(
      Date.now() + EARLY_ACCESS_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.$transaction(async (tx: any) => {
      // Lock all rows where early_access = true so that no concurrent
      // transaction can insert a new claim until this one commits.
      // NOTE: Adjust the WHERE value to change the spot cap
      //       (currently EARLY_ACCESS_SPOTS = 20 in lib/early-access.ts).
      const [{ count }] = await tx.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM "user"
        WHERE "earlyAccess" = true
        FOR UPDATE
      `;

      if (Number(count) >= EARLY_ACCESS_SPOTS) {
        throw new NoSpotsError();
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          earlyAccess: true,
          earlyAccessExpiresAt: expiresAt,
        },
      });
    });

    // ── 4. Success response ────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof NoSpotsError) {
      return NextResponse.json(
        { error: "no_spots_remaining" },
        { status: 409 },
      );
    }

    logger.error("[/api/early-access/claim] Unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to claim early access" },
      { status: 500 },
    );
  }
}
