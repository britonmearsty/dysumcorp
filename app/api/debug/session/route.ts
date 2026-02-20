import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      sessionData: session
        ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
            },
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking session:", error);

    return NextResponse.json(
      {
        error: "Failed to check session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
