import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    // Update user in database
    await auth.api.updateUser({
      body: {
        name,
      },
      headers: req.headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
