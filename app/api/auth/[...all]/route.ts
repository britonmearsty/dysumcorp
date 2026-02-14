import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

// Wrap handlers with error logging
export async function GET(request: NextRequest) {
  try {
    return await handler.GET(request);
  } catch (error) {
    console.error("Auth GET error:", error);

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
  try {
    return await handler.POST(request);
  } catch (error) {
    console.error("Auth POST error:", error);

    return NextResponse.json(
      {
        error: "Authentication error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
