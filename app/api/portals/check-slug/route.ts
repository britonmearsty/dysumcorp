import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { validateSlug } from "@/lib/slug-validation";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    const validation = validateSlug(slug);
    if (!validation.isValid) {
      return NextResponse.json({
        available: false,
        valid: false,
        error: validation.error,
      });
    }

    // Check if slug exists in database
    const existingPortal = await prisma.portal.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingPortal) {
      return NextResponse.json({
        available: false,
        valid: true,
        error: "This slug is already taken",
      });
    }

    return NextResponse.json({
      available: true,
      valid: true,
    });
  } catch (error) {
    console.error("Error checking slug:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    );
  }
}
