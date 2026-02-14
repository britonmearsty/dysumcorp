import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// PUT /api/files/[id]/expiration - Set expiration date on a file
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expiresAt } = await request.json();

    if (!expiresAt) {
      return NextResponse.json(
        { error: "Expiration date is required" },
        { status: 400 },
      );
    }

    // Validate expiration date is in the future
    const expirationDate = new Date(expiresAt);

    if (expirationDate <= new Date()) {
      return NextResponse.json(
        {
          error: "Expiration date must be in the future",
        },
        { status: 400 },
      );
    }

    // Check if user owns the file
    const file = await prisma.file.findFirst({
      where: {
        id,
        portal: {
          userId: session.user.id,
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Set the expiration date
    await prisma.file.update({
      where: { id },
      data: { expiresAt: expirationDate },
    });

    return NextResponse.json({
      success: true,
      message: "Expiration date set successfully",
      expiresAt: expirationDate,
    });
  } catch (error) {
    console.error("Error setting file expiration:", error);

    return NextResponse.json(
      { error: "Failed to set expiration date" },
      { status: 500 },
    );
  }
}

// DELETE /api/files/[id]/expiration - Remove expiration date from a file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns the file
    const file = await prisma.file.findFirst({
      where: {
        id,
        portal: {
          userId: session.user.id,
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Remove expiration date
    await prisma.file.update({
      where: { id },
      data: { expiresAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Expiration date removed successfully",
    });
  } catch (error) {
    console.error("Error removing file expiration:", error);

    return NextResponse.json(
      { error: "Failed to remove expiration date" },
      { status: 500 },
    );
  }
}
