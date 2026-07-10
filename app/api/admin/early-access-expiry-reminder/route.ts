import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendEarlyAccessExpiryWarning } from "@/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/early-access-expiry-reminder
//
// Admin-only endpoint that identifies early access users whose trial expires
// in the 6–8 day window and sends them a reminder email via Resend.
//
// Body: { adminSecret: string }
// Response: { sent: number, skipped: number, failed: number, results: [...] }
//
// Idempotency: earlyAccessReminderSent is set to true after a confirmed send,
// so re-running the endpoint within the same expiry window is safe.
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Admin secret validation ─────────────────────────────────────────────
  let body: { adminSecret?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.adminSecret || body.adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Identify users in the 6–8 day expiry window ────────────────────────
  const now = new Date();
  const windowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const usersToNotify = await prisma.user.findMany({
    where: {
      earlyAccess: true,
      earlyAccessReminderSent: false,
      earlyAccessExpiresAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      earlyAccessExpiresAt: true,
    },
  });

  // ── 3. Send reminder emails ────────────────────────────────────────────────
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const results: Array<{
    userId: string;
    email: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }> = [];

  for (const user of usersToNotify) {
    // earlyAccessExpiresAt is guaranteed non-null by the query filter above,
    // but TypeScript doesn't narrow it automatically from the Prisma select.
    if (!user.earlyAccessExpiresAt) {
      skipped++;
      results.push({
        userId: user.id,
        email: user.email,
        status: "skipped",
        reason: "earlyAccessExpiresAt is null",
      });
      continue;
    }

    if (!user.email) {
      skipped++;
      results.push({
        userId: user.id,
        email: user.email ?? "(no email)",
        status: "skipped",
        reason: "no email address on record",
      });
      continue;
    }

    try {
      const result = await sendEarlyAccessExpiryWarning({
        to: user.email,
        userName: user.name ?? user.email.split("@")[0],
        expiresAt: user.earlyAccessExpiresAt,
      });

      if (result.success) {
        // Mark the reminder as sent so we don't re-send within the same window.
        await prisma.user.update({
          where: { id: user.id },
          data: { earlyAccessReminderSent: true },
        });

        sent++;
        results.push({ userId: user.id, email: user.email, status: "sent" });
      } else {
        // sendEarlyAccessExpiryWarning returned { success: false } — treat as failure.
        const reason =
          typeof result.error === "string"
            ? result.error
            : "Email service returned failure";

        logger.error(
          `[early-access-expiry-reminder] Failed to send to ${user.email}:`,
          result.error,
        );
        failed++;
        results.push({ userId: user.id, email: user.email, status: "failed", reason });
      }
    } catch (error) {
      // Per-user failures must not abort the batch (Req 9.4).
      logger.error(
        `[early-access-expiry-reminder] Unexpected error for ${user.email}:`,
        error,
      );
      failed++;
      results.push({
        userId: user.id,
        email: user.email,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ sent, skipped, failed, results });
}
