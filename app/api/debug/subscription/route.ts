import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminCheck = await isAdmin(request.headers);

    if (!adminCheck.isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        polarCustomerId: true,
        polarSubscriptionId: true,
        polarCurrentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      userFromDB: user,
      userFromSession: session.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to fetch debug info" },
      { status: 500 },
    );
  }
}
