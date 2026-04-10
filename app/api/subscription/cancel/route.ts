import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cancellation is handled directly via the Creem customer portal.
// Direct API cancellation is not supported — use CustomerPortalButton on the frontend.
export async function POST() {
  return NextResponse.json(
    { error: "Please use the customer portal to manage your subscription." },
    { status: 410 },
  );
}
