import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import {
  getValidToken,
  uploadToGoogleDrive,
  uploadToDropbox,
  type StorageProvider,
} from "@/lib/storage-api";
import { checkStorageLimit, getUserPlanType } from "@/lib/plan-limits";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const contentType = request.headers.get("content-type");

    // Check if this is a folder creation request (JSON) or file upload (FormData)
    if (contentType?.includes("application/json")) {
      // Folder creation
      const body = await request.json();
      const { provider, folderName, parentFolderId } = body;

      if (!provider || !folderName) {
        return NextResponse.json(
          { error: "Provider and folderName are required" },
          { status: 400 },
        );
      }

      // Map google_drive to google
      const tokenProvider = provider === "google_drive" ? "google" : provider;

      // Get valid access token
      const accessToken = await getValidToken(userId, tokenProvider);

      if (!accessToken) {
        return NextResponse.json(
          { error: `No ${provider} account connected or token expired` },
          { status: 403 },
        );
      }

      // Create folder based on provider
      if (provider === "google_drive") {
        const metadata = {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: parentFolderId && parentFolderId !== "root" ? [parentFolderId] : ["root"],
        };

        const response = await fetch(
          "https://www.googleapis.com/drive/v3/files?fields=id,name",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(metadata),
          },
        );

        if (!response.ok) {
          throw new Error(`Google Drive folder creation failed: ${response.statusText}`);
        }

        const folder = await response.json();
        return NextResponse.json({
          id: folder.id,
          name: folder.name,
          path: `/${folder.name}`,
          subfolders: [],
        });
      } else if (provider === "dropbox") {
        const path = parentFolderId
          ? `${parentFolderId}/${folderName}`
          : `/${folderName}`;

        const response = await fetch(
          "https://api.dropboxapi.com/2/files/create_folder_v2",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path }),
          },
        );

        if (!response.ok) {
          throw new Error(`Dropbox folder creation failed: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json({
          id: data.metadata.path_lower,
          name: data.metadata.name,
          path: data.metadata.path_display,
          subfolders: [],
        });
      }

      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    // File upload (existing logic)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const provider = formData.get("provider") as StorageProvider;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!provider || (provider !== "google" && provider !== "dropbox")) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'google' or 'dropbox'" },
        { status: 400 },
      );
    }

    // Check storage limit before uploading
    const planType = await getUserPlanType(userId);
    const storageCheck = await checkStorageLimit(userId, planType, file.size);

    if (!storageCheck.allowed) {
      return NextResponse.json(
        {
          error: storageCheck.reason,
          upgrade: true,
          currentPlan: planType,
          currentUsage: storageCheck.current,
          limit: storageCheck.limit,
        },
        { status: 403 },
      );
    }

    // Get valid access token
    const accessToken = await getValidToken(session.user.id, provider);

    if (!accessToken) {
      return NextResponse.json(
        { error: `No ${provider} account connected or token expired` },
        { status: 403 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to the specified provider
    let result;

    if (provider === "google") {
      result = await uploadToGoogleDrive(
        accessToken,
        file.name,
        buffer,
        file.type || "application/octet-stream",
      );
    } else {
      result = await uploadToDropbox(accessToken, file.name, buffer);
    }

    return NextResponse.json({
      success: true,
      provider,
      file: result,
    });
  } catch (error) {
    console.error("Storage upload error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
