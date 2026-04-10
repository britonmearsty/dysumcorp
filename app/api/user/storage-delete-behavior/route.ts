import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storageDeleteBehavior: true },
    });

    return NextResponse.json({
      storageDeleteBehavior: user?.storageDeleteBehavior ?? "ask",
    });
  } catch (error) {
    console.error("Error fetching storage delete behavior:", error);

    return NextResponse.json(
      { error: "Failed to fetch preference" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storageDeleteBehavior } = await req.json();

    if (!["ask", "always", "never"].includes(storageDeleteBehavior)) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageDeleteBehavior },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating storage delete behavior:", error);

    return NextResponse.json(
      { error: "Failed to update preference" },
      { status: 500 },
    );
  }
}
