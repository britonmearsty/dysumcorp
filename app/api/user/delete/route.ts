import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.portal.deleteMany({ where: { userId } }),
      prisma.usageTracking.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
