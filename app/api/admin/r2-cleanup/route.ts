import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { deleteR2Object } from "@/lib/r2-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/r2-cleanup
 * Cron job: deletes orphaned R2 staging objects older than 2 hours.
 * Requires Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Records stuck in "pending" for > 2 hours — browser never triggered the worker
  const pendingCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  // Records stuck in "transferring" for > 6 hours — worker crashed mid-transfer.
  // 6 hours is generous: even a 5 GB file at 2 Mbps takes ~5.5 hours.
  // Anything older than that is definitively dead.
  const transferringCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const orphans = await prisma.r2StagingUpload.findMany({
    where: {
      OR: [
        { status: "pending", createdAt: { lt: pendingCutoff } },
        { status: "transferring", createdAt: { lt: transferringCutoff } },
        // "uploaded" means r2-complete succeeded but worker was never triggered
        // or the worker callback never fired — treat same as pending after 2h
        { status: "uploaded", createdAt: { lt: pendingCutoff } },
      ],
    },
    select: { id: true, stagingKey: true, status: true, createdAt: true },
  });

  let deleted = 0;
  let failed = 0;

  for (const record of orphans) {
    try {
      await deleteR2Object(record.stagingKey);
      await prisma.r2StagingUpload.update({
        where: { id: record.id },
        data: { status: "failed" },
      });
      console.log(
        `[r2-cleanup] Deleted orphan status=${record.status} stagingKey=${record.stagingKey} age=${Math.round((Date.now() - record.createdAt.getTime()) / 60000)}min`,
      );
      deleted++;
    } catch (err) {
      console.error(
        `[r2-cleanup] Failed to delete stagingKey=${record.stagingKey}:`,
        err,
      );
      failed++;
    }
  }

  return NextResponse.json({ processed: orphans.length, deleted, failed });
}
