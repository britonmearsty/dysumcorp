import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creemCustomerId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.uploadSession.deleteMany({
        where: { portal: { userId } },
      }),
      prisma.file.deleteMany({
        where: { portal: { userId } },
      }),
      prisma.portal.deleteMany({ where: { userId } }),
      prisma.usageTracking.deleteMany({ where: { userId } }),
      prisma.r2StagingUpload.deleteMany({ where: { userId } }),
    ]);

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "deleted",
        deletedAt: new Date(),
        name: null,
        image: null,
        portalLogo: null,
        subscriptionPlan:
          user?.subscriptionPlan === "pro" ? "expired" : "trial",
        subscriptionStatus: "cancelled",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
