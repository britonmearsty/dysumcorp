import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portals/r2-retry
 * Body: { stagingKey, uploadToken }
 *
 * Retries a failed transfer by resetting the staging record status
 * and re-triggering the worker. Only works for FAILED transfers.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8);
  console.log(`[r2-retry:${requestId}] POST /api/portals/r2-retry`);

  try {
    const body = await request.json();
    const { stagingKey, uploadToken } = body;

    if (!stagingKey || !uploadToken) {
      return NextResponse.json(
        { error: "stagingKey and uploadToken are required" },
        { status: 400 },
      );
    }

    const token = validateUploadToken(uploadToken);
    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired upload token" },
        { status: 401 },
      );
    }

    if (token.stagingKey !== stagingKey) {
      return NextResponse.json(
        { error: "stagingKey does not match token" },
        { status: 403 },
      );
    }

    const staging = await prisma.r2StagingUpload.findUnique({
      where: { stagingKey },
    });

    if (!staging) {
      return NextResponse.json(
        { error: "Staging record not found" },
        { status: 404 },
      );
    }

    // Only allow retry for FAILED transfers
    if (staging.status !== "FAILED") {
      return NextResponse.json(
        { error: `Cannot retry: status is ${staging.status}, must be FAILED` },
        { status: 400 },
      );
    }

    // Reset status to UPLOADED and clear error, increment attempts
    await prisma.r2StagingUpload.update({
      where: { stagingKey },
      data: {
        status: "UPLOADED",
        lastError: null,
        attempts: { increment: 1 },
      },
    });

    // Trigger the worker to pick up the transfer
    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      console.error(`[r2-retry:${requestId}] WORKER_URL not configured`);
      return NextResponse.json(
        { error: "Worker not configured" },
        { status: 500 },
      );
    }

    const res = await fetch(`${workerUrl}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadToken,
        stagingKey,
        portalId: token.portalId,
        fileName: token.fileName,
        fileSize: token.fileSize,
        mimeType: token.mimeType,
        uploaderName: token.uploaderName,
        uploaderEmail: token.uploaderEmail,
        uploaderNotes: token.uploaderNotes,
        callbackUrl: `${process.env.VERCEL_APP_URL}/api/portals/r2-confirm`,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error ?? "Worker rejected retry" },
        { status: res.status },
      );
    }

    console.log(`[r2-retry:${requestId}] ✓ Retry triggered for ${stagingKey}`);
    return NextResponse.json({ success: true, status: "UPLOADED" });
  } catch (error) {
    console.error(`[r2-retry:${requestId}] ❌ UNCAUGHT ERROR:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
