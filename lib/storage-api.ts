import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

/**
 * Storage API utilities for Google Drive and Dropbox
 */

// Types
export type StorageProvider = "google" | "dropbox";

export interface StorageToken {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
}

export interface FileMetadata {
  id: string;
  name: string;
  size?: number;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Get OAuth tokens for a user's storage provider
 */
export async function getStorageTokens(
  userId: string,
  provider: StorageProvider
): Promise<StorageToken | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: provider,
    },
  });

  if (!account || !account.accessToken) {
    return null;
  }

  return {
    accessToken: account.accessToken,
    refreshToken: account.refreshToken || undefined,
    accessTokenExpiresAt: account.accessTokenExpiresAt || undefined,
  };
}

/**
 * Refresh an expired OAuth token
 */
export async function refreshStorageToken(
  userId: string,
  provider: StorageProvider
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: provider,
    },
  });

  if (!account || !account.refreshToken) {
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
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Update the access token in the database
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        accessTokenExpiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
      },
    });

    return data.access_token;
  } catch (error) {
    console.error(`Failed to refresh ${provider} token:`, error);
    return null;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidToken(
  userId: string,
  provider: StorageProvider
): Promise<string | null> {
  const tokens = await getStorageTokens(userId, provider);

  if (!tokens) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  if (
    tokens.accessTokenExpiresAt &&
    tokens.accessTokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
  ) {
    return await refreshStorageToken(userId, provider);
  }

  return tokens.accessToken;
}

// ============================================================================
// Google Drive API Functions
// ============================================================================

/**
 * Upload a file to Google Drive
 */
export async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  fileContent: Buffer | string,
  mimeType: string = "text/plain"
): Promise<FileMetadata> {
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,modifiedTime,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List files from Google Drive
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  pageSize: number = 10
): Promise<FileMetadata[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,size,mimeType,modifiedTime,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive list failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download a file from Google Drive
 */
export async function downloadFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<Buffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive delete failed: ${response.statusText}`);
  }
}

// ============================================================================
// Dropbox API Functions
// ============================================================================

/**
 * Upload a file to Dropbox
 */
export async function uploadToDropbox(
  accessToken: string,
  filePath: string,
  fileContent: Buffer | string
): Promise<FileMetadata> {
  // Convert Buffer to Uint8Array for fetch API compatibility
  const body = typeof fileContent === "string" 
    ? fileContent 
    : new Uint8Array(fileContent);

  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        mode: "add",
        autorename: true,
        mute: false,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(`Dropbox upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    size: data.size,
    modifiedTime: data.client_modified,
  };
}

/**
 * List files from Dropbox
 */
export async function listDropboxFiles(
  accessToken: string,
  path: string = ""
): Promise<FileMetadata[]> {
  const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path || "",
      recursive: false,
      include_media_info: false,
      include_deleted: false,
      include_has_explicit_shared_members: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dropbox list failed: ${response.statusText}`);
  }

  const data = await response.json();
  return (
    data.entries?.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      size: entry.size,
      modifiedTime: entry.client_modified,
    })) || []
  );
}

/**
 * Download a file from Dropbox
 */
export async function downloadFromDropbox(
  accessToken: string,
  filePath: string
): Promise<Buffer> {
  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
      }),
    },
  });

  if (!response.ok) {
    throw new Error(`Dropbox download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Dropbox
 */
export async function deleteFromDropbox(
  accessToken: string,
  filePath: string
): Promise<void> {
  const response = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: filePath.startsWith("/") ? filePath : `/${filePath}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dropbox delete failed: ${response.statusText}`);
  }
}
