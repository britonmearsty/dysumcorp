import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getValidToken,
  listGoogleDriveFiles,
  listDropboxFiles,
  type StorageProvider,
} from "@/lib/storage-api";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get provider from query params
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as StorageProvider;

    if (!provider || (provider !== "google" && provider !== "dropbox")) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'google' or 'dropbox'" },
        { status: 400 }
      );
    }

    // Get valid access token
    const accessToken = await getValidToken(session.user.id, provider);
    if (!accessToken) {
      return NextResponse.json(
        { error: `No ${provider} account connected or token expired` },
        { status: 403 }
      );
    }

    // List files from the specified provider
    let files;
    if (provider === "google") {
      files = await listGoogleDriveFiles(accessToken);
    } else {
      files = await listDropboxFiles(accessToken);
    }

    return NextResponse.json({
      success: true,
      provider,
      files,
    });
  } catch (error) {
    console.error("Storage list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "List failed" },
      { status: 500 }
    );
  }
}
