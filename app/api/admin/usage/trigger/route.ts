import { NextResponse } from "next/server";

import { triggerUsageTracking } from "@/lib/usage-tracking";
import { isAdmin } from "@/lib/admin";
import { applyAdminRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit admin endpoints
    const rateLimitResponse = await applyAdminRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const adminCheck = await isAdmin(request.headers);

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    await triggerUsageTracking();

    return NextResponse.json({
      success: true,
      message: "Usage tracking update triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering usage tracking:", error);

    return NextResponse.json(
      { error: "Failed to trigger usage tracking" },
      { status: 500 },
    );
  }
}
