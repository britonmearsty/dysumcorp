import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getUserUsageStats } from "@/lib/usage-tracking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const adminCheck = await isAdmin(request.headers);

    if (!adminCheck.isAdmin && adminCheck.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const stats = await getUserUsageStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting usage stats:", error);

    return NextResponse.json(
      { error: "Failed to get usage stats" },
      { status: 500 },
    );
  }
}
