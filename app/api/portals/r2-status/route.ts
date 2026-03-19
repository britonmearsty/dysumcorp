import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUploadToken } from "@/lib/upload-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/portals/r2-status?stagingKey=...&uploadToken=...
 * Polled by the browser to check whether the Worker has finished the transfer.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stagingKey = searchParams.get("stagingKey");
    const uploadToken = searchParams.get("uploadToken");

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

    // Ensure the token was issued for this exact staging key
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
      return NextResponse.json({ error: "Staging record not found" }, { status: 404 });
    }

    if (staging.status === "completed") {
      // Use the direct fileId FK set by r2-confirm — no fuzzy matching
      const file = staging.fileId
        ? await prisma.file.findUnique({
            where: { id: staging.fileId },
            select: {
              id: true,
              name: true,
              size: true,
              mimeType: true,
              storageUrl: true,
              uploadedAt: true,
              uploadSessionId: true,
            },
          })
        : null;

      return NextResponse.json({
        status: "completed",
        file: file ? { ...file, size: file.size.toString() } : null,
      });
    }

    return NextResponse.json({ status: staging.status });
  } catch (error) {
    console.error("[r2-status] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
