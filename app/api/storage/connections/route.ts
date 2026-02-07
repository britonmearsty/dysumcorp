import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth-server";
import { getStorageTokens } from "@/lib/storage-api";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has connected Google Drive and Dropbox
    const googleTokens = await getStorageTokens(session.user.id, "google");
    const dropboxTokens = await getStorageTokens(session.user.id, "dropbox");

    return NextResponse.json({
      google: !!googleTokens,
      dropbox: !!dropboxTokens,
    });
  } catch (error) {
    console.error("Error checking storage connections:", error);

    return NextResponse.json(
      { error: "Failed to check connections" },
      { status: 500 },
    );
  }
}
