import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user account using better-auth
    await auth.api.deleteUser({
      headers: req.headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
