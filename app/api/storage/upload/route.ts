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

    // Parse form data
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
