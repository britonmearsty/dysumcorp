import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { deleteR2Object } from "@/lib/r2-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/shared-files/[id] - Delete a share bundle
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

    const bundle = await prisma.shareBundle.findFirst({
      where: { id, userId: session.user.id },
      include: { files: true },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    for (const file of bundle.files) {
      try {
        await deleteR2Object(file.storageKey);
      } catch (e) {
        logger.error("Failed to delete from R2:", e);
      }
    }

    await prisma.shareBundle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting share bundle:", error);
    return NextResponse.json(
      { error: "Failed to delete share bundle" },
      { status: 500 },
    );
  }
}
