import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPasswordWithMigration } from "@/lib/password-utils";

// POST /api/portals/[id]/password - Verify portal password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Get portal
    const portal = await prisma.portal.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // No password set on portal
    if (!portal.password) {
      return NextResponse.json({ valid: true });
    }

    // Verify password with migration support for legacy SHA-256 hashes
    const result = await verifyPasswordWithMigration(password, portal.password);

    if (!result.valid) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // If password was migrated, update the stored hash
    if (result.newHash) {
      await prisma.portal.update({
        where: { id },
        data: { password: result.newHash },
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying portal password:", error);

    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 },
    );
  }
}
