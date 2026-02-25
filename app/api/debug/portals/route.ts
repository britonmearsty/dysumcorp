import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminCheck = await isAdmin(request.headers);
    if (!adminCheck.isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id;

    // Get all portals for this user
    const portals = await prisma.portal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get portal count
    const count = await prisma.portal.count({
      where: { userId },
    });

    return NextResponse.json({
      userId,
      count,
      portals,
      message: `Found ${count} portal(s) for user ${userId}`,
    });
  } catch (error) {
    console.error("Error fetching portals:", error);

    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}
