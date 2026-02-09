import { NextResponse } from "next/server";

// This webhook is now handled by Better Auth Creem plugin at /api/auth/creem/webhook
// Keeping this file as a fallback but it should not be configured in Creem dashboard
// Configure webhook URL in Creem dashboard to: YOUR_DOMAIN/api/auth/creem/webhook

export async function POST(req: Request) {
  console.log(
    "⚠️ Custom webhook received - but Better Auth handles this automatically",
  );
  console.log(
    "Please configure webhook URL in Creem dashboard to: /api/auth/creem/webhook",
  );

  return NextResponse.json({
    received: true,
    note: "Better Auth Creem plugin handles webhooks automatically at /api/auth/creem/webhook",
  });
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: "Webhook endpoint (deprecated)",
    note: "Better Auth Creem plugin handles webhooks at /api/auth/creem/webhook",
    configure_in_creem_dashboard: "YOUR_DOMAIN/api/auth/creem/webhook",
  });
}
