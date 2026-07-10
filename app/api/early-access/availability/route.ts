import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { getEarlyAccessAvailability } from "@/lib/early-access";

// GET /api/early-access/availability
// Public — no authentication required.
// Returns the number of total, claimed, and remaining early access spots.
export async function GET(): Promise<NextResponse> {
  try {
    const availability = await getEarlyAccessAvailability();

    return NextResponse.json(availability);
  } catch (error) {
    logger.error("[/api/early-access/availability] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}
