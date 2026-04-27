import { NextResponse } from "next/server";

// Creem has been replaced by Polar.
// Webhooks are now handled at /api/webhooks/polar
export async function POST() {
  return NextResponse.json(
    { error: "Creem webhooks are no longer supported. Use /api/webhooks/polar" },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    { status: "deprecated", note: "Creem replaced by Polar. See /api/webhooks/polar" },
  );
}
