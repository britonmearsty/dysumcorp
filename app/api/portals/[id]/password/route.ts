import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPasswordWithMigration } from "@/lib/password-utils";
import { applyPasswordRateLimit } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/validation";

// POST /api/portals/[id]/password - Verify portal password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid portal ID format" },
        { status: 400 },
      );
    }

    // Rate limit per portal to prevent brute-force attacks
    const rateLimitResponse = await applyPasswordRateLimit(id);
    if (rateLimitResponse) return rateLimitResponse;

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Get portal (by UUID or slug)
    const portal = await prisma.portal.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
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
