import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { hashPassword, validatePassword } from "@/lib/password-utils";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// PUT /api/files/[id]/password - Set password protection on a file
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

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Password does not meet security requirements",
          details: validation.errors,
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

    // Hash and set the password
    const passwordHash = hashPassword(password);

    await prisma.file.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password protection added successfully",
    });
  } catch (error) {
    console.error("Error setting file password:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 },
    );
  }
}

// DELETE /api/files/[id]/password - Remove password protection from a file
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

    // Remove password protection
    await prisma.file.update({
      where: { id },
      data: { passwordHash: null },
    });

    return NextResponse.json({
      success: true,
      message: "Password protection removed successfully",
    });
  } catch (error) {
    console.error("Error removing file password:", error);
    return NextResponse.json(
      { error: "Failed to remove password" },
      { status: 500 },
    );
  }
}
