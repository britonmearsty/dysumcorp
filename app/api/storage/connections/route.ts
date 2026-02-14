import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { auth } from "@/lib/auth-server";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all OAuth accounts for the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        providerId: {
          in: ["google", "dropbox"],
        },
      },
      select: {
        id: true,
        providerId: true,
        accountId: true,
        accessToken: true,
        accessTokenExpiresAt: true,
      },
    });

    console.log(`[Storage Connections] Found ${accounts.length} accounts for user ${session.user.id}`);

    // Transform accounts into the expected format
    const connectedAccounts = accounts.map((account) => {
      const hasValidToken = !!(
        account.accessToken &&
        (!account.accessTokenExpiresAt ||
          account.accessTokenExpiresAt > new Date())
      );

      console.log(`[Storage Connections] ${account.providerId}: hasToken=${!!account.accessToken}, expiresAt=${account.accessTokenExpiresAt}, isValid=${hasValidToken}`);

      return {
        provider: account.providerId as "google" | "dropbox",
        providerAccountId: account.accountId,
        isConnected: hasValidToken,
        storageAccountId: account.id,
        storageStatus: hasValidToken ? "ACTIVE" : "DISCONNECTED",
        hasValidOAuth: hasValidToken,
      };
    });

    console.log(`[Storage Connections] Returning ${connectedAccounts.length} accounts, ${connectedAccounts.filter(a => a.isConnected).length} connected`);

    return NextResponse.json({
      accounts: connectedAccounts,
    });
  } catch (error) {
    console.error("Error checking storage connections:", error);

    return NextResponse.json(
      { error: "Failed to check connections" },
      { status: 500 },
    );
  }
}
