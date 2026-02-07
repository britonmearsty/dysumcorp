import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { auth } from "@/lib/auth-server";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider || (provider !== "google" && provider !== "dropbox")) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Delete the account connection for this provider
    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        providerId: provider,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting storage:", error);

    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 },
    );
  }
}
