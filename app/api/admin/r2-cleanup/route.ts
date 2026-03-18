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

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  const orphans = await prisma.r2StagingUpload.findMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
    },
    select: { id: true, stagingKey: true, createdAt: true },
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
        `[r2-cleanup] Deleted orphan stagingKey=${record.stagingKey} age=${Math.round((Date.now() - record.createdAt.getTime()) / 60000)}min`,
      );
      deleted++;
    } catch (err) {
      console.error(`[r2-cleanup] Failed to delete stagingKey=${record.stagingKey}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ processed: orphans.length, deleted, failed });
}
