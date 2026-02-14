import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { getValidToken } from "@/lib/storage-api";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get params from query
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const rootOnly = searchParams.get("rootOnly") === "true";
    const parentFolderId = searchParams.get("parentFolderId");

    // Validate provider
    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      );
    }

    // Map google_drive to google for token lookup
    const tokenProvider = provider === "google_drive" ? "google" : provider === "dropbox" ? "dropbox" : null;
    
    if (!tokenProvider) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'google_drive' or 'dropbox'" },
        { status: 400 },
      );
    }

    // Get valid access token
    const accessToken = await getValidToken(session.user.id, tokenProvider);

    if (!accessToken) {
      return NextResponse.json(
        { error: `No ${provider} account connected or token expired` },
        { status: 403 },
      );
    }

    // List folders based on provider
    if (provider === "google_drive") {
      if (rootOnly) {
        // Return root folder info
        return NextResponse.json({
          id: "root",
          name: "My Drive",
          path: "/",
          subfolders: [],
        });
      }

      // List folders in Google Drive
      const query = parentFolderId && parentFolderId !== "root"
        ? `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&orderBy=name`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      const folders = data.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
        path: `/${file.name}`,
        subfolders: [],
      })) || [];

      return NextResponse.json(folders);
    } else if (provider === "dropbox") {
      // List folders in Dropbox
      const path = parentFolderId || "";
      
      if (rootOnly) {
        return NextResponse.json({
          id: "",
          name: "Dropbox",
          path: "/",
          subfolders: [],
        });
      }

      const response = await fetch(
        "https://api.dropboxapi.com/2/files/list_folder",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: path || "",
            recursive: false,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Dropbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      const folders = data.entries
        ?.filter((entry: any) => entry[".tag"] === "folder")
        .map((folder: any) => ({
          id: folder.path_lower,
          name: folder.name,
          path: folder.path_display,
          subfolders: [],
        })) || [];

      return NextResponse.json(folders);
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (error) {
    console.error("Storage list error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "List failed" },
      { status: 500 },
    );
  }
}
