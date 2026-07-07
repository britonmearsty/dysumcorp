import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { deleteR2Object } from "@/lib/r2-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/shared-files/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.sharedFile.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
      await deleteR2Object(file.storageKey);
    } catch (e) {
      logger.error("Failed to delete from R2:", e);
    }

    await prisma.sharedFile.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting shared file:", error);
    return NextResponse.json(
      { error: "Failed to delete shared file" },
      { status: 500 },
    );
  }
}
