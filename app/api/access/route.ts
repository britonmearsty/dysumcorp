import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-server";
import { checkAccess } from "@/lib/trial";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await checkAccess(session.user.id);

    return NextResponse.json(access);
  } catch (error) {
    console.error("[/api/access] Error:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 },
    );
  }
}
