import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";

// GET /api/portals - List all portals for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const take = limit ? parseInt(limit, 10) : undefined;

    const portals = await prisma.portal.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { files: true },
        },
        // REVERSIBILITY: Remove user include to revert trial feature
        user: {
          select: {
            subscriptionPlan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedPortals = portals.map((portal) => ({
      ...portal,
      maxFileSize: portal.maxFileSize.toString(),
    }));

    return NextResponse.json({ portals: serializedPortals });
  } catch (error) {
    console.error("Error fetching portals:", error);

    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}
