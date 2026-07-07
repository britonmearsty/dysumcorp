import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password-utils";

export const dynamic = "force-dynamic";

// POST /api/shared/verify-password/[token]
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const file = await prisma.sharedFile.findUnique({
      where: { shareToken: token },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.expiresAt && file.expiresAt < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 410 },
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    if (!file.passwordHash) {
      return NextResponse.json(
        { error: "File is not password protected" },
        { status: 400 },
      );
    }

    const valid = await verifyPassword(password, file.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    const verifiedToken = `${token}:${Date.now() + 3600000}`;

    return NextResponse.json({ verified: true, verifiedToken });
  } catch (error) {
    logger.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 },
    );
  }
}
