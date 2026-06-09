import { logger } from "@/lib/logger";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

// Wrap handlers with error logging
export async function GET(request: NextRequest) {
  const url = request.nextUrl.href;

  logger.log("[AUTH] GET request to:", url);

  try {
    const response = await handler.GET(request);

    logger.log("[AUTH] GET response status:", response.status);

    return response;
  } catch (error) {
    logger.error("Auth GET error:", error);
    logger.error(
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

  logger.log("[AUTH] POST request to:", url);

  try {
    const response = await handler.POST(request);

    logger.log("[AUTH] POST response status:", response.status);

    return response;
  } catch (error) {
    logger.error("Auth POST error:", error);
    logger.error(
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
