import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

// Wrap handlers with error logging
export async function GET(request: NextRequest) {
  const url = request.nextUrl.href;

  console.log("[AUTH] GET request to:", url);

  try {
    const response = await handler.GET(request);

    console.log("[AUTH] GET response status:", response.status);

    return response;
  } catch (error) {
    console.error("Auth GET error:", error);
    console.error(
      "Auth GET error stack:",
      error instanceof Error ? error.stack : "unknown",
    );

    return NextResponse.json(
      {
        error: "Authentication error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.href;

  console.log("[AUTH] POST request to:", url);

  try {
    const response = await handler.POST(request);

    console.log("[AUTH] POST response status:", response.status);

    return response;
  } catch (error) {
    console.error("Auth POST error:", error);
    console.error(
      "Auth POST error stack:",
      error instanceof Error ? error.stack : "unknown",
    );

    return NextResponse.json(
      {
        error: "Authentication error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
