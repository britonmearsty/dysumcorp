import { NextRequest, NextResponse } from "next/server";

/**
 * Account Deletion Endpoint - DISABLED
 *
 * Self-service account deletion has been disabled.
 * Users must contact support@trackage.io to request account deletion.
 * Admins can delete accounts directly in the database.
 */

export async function DELETE(req: NextRequest) {
  // Account deletion is now admin-handled only - users must contact support
  return NextResponse.json(
    {
      error:
        "Account deletion is no longer available via self-service. Please contact support@trackage.io to request account deletion.",
    },
    { status: 403 },
  );
}
