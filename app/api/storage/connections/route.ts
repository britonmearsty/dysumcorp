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
        // For Dropbox: if no expiration set, assume expired (need refresh)
        // For Google: check actual expiration time
        let isExpired: boolean;

        if (account.providerId === "dropbox") {
          // Dropbox tokens: only treat as expired if expiration is set AND past
          // If no expiration is set, assume token is still valid (long-lived)
          isExpired = !!(expiresAt && expiresAt <= new Date());
        } else {
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
    // Default to 4 hours for Dropbox if not returned
    let expiresAt: Date | null = null;

    if (data.expires_in) {
      expiresAt = new Date(Date.now() + data.expires_in * 1000);
    } else if (provider === "dropbox") {
      // Dropbox tokens are long-lived but still expire (~4 hours)
      // Set default 4 hour expiration if not provided
      expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
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
