import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user to get email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

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
        refreshToken: true,
        accessTokenExpiresAt: true,
      },
    });

    console.log(
      `[Storage Connections] Found ${accounts.length} accounts for user ${session.user.id}`,
    );

    // Transform accounts and auto-refresh expired tokens
    const connectedAccounts = await Promise.all(
      accounts.map(async (account) => {
        let accessToken = account.accessToken;
        let expiresAt = account.accessTokenExpiresAt;

        // Check if token is expired
        let isExpired: boolean;

        if (account.providerId === "dropbox") {
          // Dropbox tokens: treat as expired if:
          // 1. Expiration is set AND past, OR
          // 2. No expiration is set (means token was never refreshed, assume it needs refresh)
          // This ensures we proactively refresh Dropbox tokens
          isExpired = !expiresAt || (expiresAt && expiresAt <= new Date());
        } else {
          // Google: only expired if expiration time is set and past
          isExpired = !!(expiresAt && expiresAt <= new Date());
        }

        // Auto-refresh if token is expired and refresh token exists
        if (isExpired && account.refreshToken) {
          console.log(
            `[Storage Connections] Token expired for ${account.providerId}, attempting refresh...`,
          );

          try {
            const newToken = await refreshAccessToken(
              account.providerId as "google" | "dropbox",
              account,
            );

            if (newToken) {
              console.log(
                `[Storage Connections] Successfully refreshed token for ${account.providerId}`,
              );
              accessToken = newToken.accessToken;
              expiresAt = newToken.expiresAt;
              isExpired = false;
            } else {
              console.log(
                `[Storage Connections] Failed to refresh token for ${account.providerId}`,
              );
            }
          } catch (error) {
            console.error(
              `[Storage Connections] Error refreshing token for ${account.providerId}:`,
              error,
            );
          }
        } else if (
          account.providerId === "dropbox" &&
          !expiresAt &&
          accessToken &&
          account.refreshToken
        ) {
          // Dropbox token has no expiration set - set one now to enable proactive refresh
          console.log(
            `[Storage Connections] Setting expiration for Dropbox token without expiration`,
          );
          const newExpiresAt = new Date(Date.now() + 3.5 * 60 * 60 * 1000);
          await prisma.account.update({
            where: { id: account.id },
            data: { accessTokenExpiresAt: newExpiresAt },
          });
          expiresAt = newExpiresAt;
        }

        const hasValidToken = !!(accessToken && !isExpired);

        console.log(
          `[Storage Connections] ${account.providerId}: hasToken=${!!accessToken}, expiresAt=${expiresAt}, isValid=${hasValidToken}`,
        );

        return {
          provider: account.providerId as "google" | "dropbox",
          providerAccountId: account.accountId,
          email: user?.email || undefined,
          name: user?.name || undefined,
          isConnected: hasValidToken,
          storageAccountId: account.id,
          storageStatus: hasValidToken ? "ACTIVE" : "DISCONNECTED",
          hasValidOAuth: hasValidToken,
        };
      }),
    );

    console.log(
      `[Storage Connections] Returning ${connectedAccounts.length} accounts, ${connectedAccounts.filter((a) => a.isConnected).length} connected`,
    );

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

// Helper function to refresh access token
async function refreshAccessToken(
  provider: "google" | "dropbox",
  account: { id: string; refreshToken: string | null },
): Promise<{ accessToken: string; expiresAt: Date | null } | null> {
  if (!account.refreshToken) {
    return null;
  }

  try {
    let tokenUrl: string;
    let clientId: string;
    let clientSecret: string;

    if (provider === "google") {
      tokenUrl = "https://oauth2.googleapis.com/token";
      clientId = process.env.GOOGLE_CLIENT_ID!;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    } else {
      tokenUrl = "https://api.dropboxapi.com/oauth2/token";
      clientId = process.env.DROPBOX_CLIENT_ID!;
      clientSecret = process.env.DROPBOX_CLIENT_SECRET!;
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `Token refresh failed for ${provider}:`,
        response.status,
        errorText,
      );

      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // Google returns expires_in, Dropbox doesn't (long-lived tokens)
    // Always set expiration for Dropbox to ensure proactive refresh
    let expiresAt: Date | null = null;

    if (data.expires_in) {
      expiresAt = new Date(Date.now() + data.expires_in * 1000);
    } else if (provider === "dropbox") {
      // Dropbox tokens are long-lived but still expire
      // Set 3.5 hour expiration to refresh before actual expiration
      expiresAt = new Date(Date.now() + 3.5 * 60 * 60 * 1000);
    }

    // Update the access token in the database
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresAt: expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      expiresAt,
    };
  } catch (error) {
    console.error(`Failed to refresh ${provider} token:`, error);

    return null;
  }
}
