import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getUserUsageStats } from "@/lib/usage-tracking";
import { applyAdminRateLimit } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // Rate limit admin endpoints
    const rateLimitResponse = await applyAdminRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const { userId } = await params;

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 },
      );
    }

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
