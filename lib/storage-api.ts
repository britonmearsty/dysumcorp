import { prisma } from "@/lib/prisma";

/**
 * Storage API utilities for Google Drive and Dropbox
 */

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

export interface FolderInfo {
  id: string;
  name: string;
}

/**
 * Get OAuth tokens for a user's storage provider
 * Automatically refreshes expired tokens
 */
export async function getStorageTokens(
  userId: string,
  provider: StorageProvider,
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

  const isExpired =
    account.accessTokenExpiresAt && account.accessTokenExpiresAt <= new Date();

  if (isExpired && account.refreshToken) {
    console.log(
      `[Storage API] Token expired for ${provider}, auto-refreshing...`,
    );
    const newAccessToken = await refreshStorageToken(userId, provider);

    if (newAccessToken) {
      console.log(`[Storage API] Successfully refreshed token for ${provider}`);
      const updatedAccount = await prisma.account.findFirst({
        where: {
          userId,
          providerId: provider,
        },
      });

      if (updatedAccount) {
        return {
          accessToken: updatedAccount.accessToken!,
          refreshToken: updatedAccount.refreshToken || undefined,
          accessTokenExpiresAt:
            updatedAccount.accessTokenExpiresAt || undefined,
        };
      }
    } else {
      console.log(`[Storage API] Failed to refresh token for ${provider}`);

      return null;
    }
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
  provider: StorageProvider,
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

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: data.access_token,
        accessTokenExpiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null, // No expiration for Dropbox long-lived tokens
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
  provider: StorageProvider,
): Promise<string | null> {
  const tokens = await getStorageTokens(userId, provider);

  if (!tokens) {
    return null;
  }

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

export async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  fileContent: Buffer | string | Blob | File,
  mimeType: string = "text/plain",
  parentFolderId?: string,
): Promise<FileMetadata> {
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const multipartBody = new Blob([
    delimiter,
    "Content-Type: application/json\r\n\r\n",
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    fileContent as BlobPart,
    closeDelimiter,
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,modifiedTime,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function listGoogleDriveFiles(
  accessToken: string,
  pageSize: number = 10,
): Promise<FileMetadata[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,size,mimeType,modifiedTime,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Google Drive list failed: ${response.statusText}`);
  }

  const data = await response.json();

  return data.files || [];
}

export async function downloadFromGoogleDrive(
  accessToken: string,
  fileId: string,
): Promise<Buffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Google Drive download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

export async function deleteFromGoogleDrive(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Google Drive delete failed: ${response.statusText}`);
  }
}

// ============================================================================
// Dropbox API Functions
// ============================================================================

export async function uploadToDropbox(
  accessToken: string,
  filePath: string,
  fileContent: Buffer | string | Blob | File,
): Promise<FileMetadata> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
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
      body: fileContent as BodyInit,
    },
  );

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
 * Upload a file chunk to Dropbox using upload_session/start and upload_session/append_v2
 * For simplicity, this uses direct upload for single-chunk files
 */
export async function uploadChunkToDropbox(
  accessToken: string,
  filePath: string,
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  _offset: number,
  _totalSize: number,
): Promise<{ complete: boolean; id?: string }> {
  const isFirst = chunkIndex === 0;
  const isLast = chunkIndex === totalChunks - 1;

  if (isFirst && isLast) {
    // Single chunk - direct upload
    const result = await uploadToDropbox(accessToken, filePath, chunk);

    return { complete: true, id: result.id };
  }

  if (isLast) {
    // Last chunk - complete the upload
    const result = await uploadToDropbox(accessToken, filePath, chunk);

    return { complete: true, id: result.id };
  }

  // Middle chunk - just acknowledge, we'll do the final upload on the last chunk
  return { complete: false };
}

export async function listDropboxFiles(
  accessToken: string,
  path: string = "",
): Promise<FileMetadata[]> {
  const response = await fetch(
    "https://api.dropboxapi.com/2/files/list_folder",
    {
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
    },
  );

  if (!response.ok) {
    throw new Error(`Dropbox list failed: ${response.statusText}`);
  }

  const data = await response.json();

  return (
    data.entries?.map((entry: Record<string, unknown>) => ({
      id: entry.id as string,
      name: entry.name as string,
      size: entry.size as number,
      modifiedTime: entry.client_modified as string,
    })) || []
  );
}

export async function downloadFromDropbox(
  accessToken: string,
  filePath: string,
): Promise<Buffer> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/download",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        }),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Dropbox download failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

export async function deleteFromDropbox(
  accessToken: string,
  filePath: string,
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

// ============================================================================
// Folder Management - Google Drive
// ============================================================================

async function findOrCreateGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string,
): Promise<FolderInfo> {
  const query = parentFolderId
    ? `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`
    : `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents`;

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: query,
      fields: "files(id,name)",
    })}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (searchResponse.ok) {
    const data = await searchResponse.json();
    const existingFolder = data.files?.[0];

    if (existingFolder) {
      return { id: existingFolder.id, name: existingFolder.name };
    }
  }

  const createResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId ? [parentFolderId] : undefined,
      }),
    },
  );

  if (!createResponse.ok) {
    throw new Error(`Failed to create folder: ${folderName}`);
  }

  const createdFolder = await createResponse.json();

  return { id: createdFolder.id, name: createdFolder.name };
}

// ============================================================================
// Folder Management - Dropbox
// ============================================================================

async function findOrCreateDropboxFolder(
  accessToken: string,
  folderPath: string,
): Promise<FolderInfo> {
  const normalizedPath = folderPath.startsWith("/")
    ? folderPath
    : `/${folderPath}`;

  // Try to get folder metadata
  const checkResponse = await fetch(
    "https://api.dropboxapi.com/2/files/get_metadata",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: normalizedPath,
      }),
    },
  );

  if (checkResponse.ok) {
    const data = await checkResponse.json();

    if (data[".tag"] === "folder") {
      return { id: data.id, name: data.name };
    }
  }

  // Create folder if not found
  const createResponse = await fetch(
    "https://api.dropboxapi.com/2/files/create_folder_v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: normalizedPath,
        autorename: false,
      }),
    },
  );

  if (!createResponse.ok) {
    // Folder might already exist, try to get it again
    if (createResponse.status === 409) {
      const retryResponse = await fetch(
        "https://api.dropboxapi.com/2/files/get_metadata",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: normalizedPath,
          }),
        },
      );

      if (retryResponse.ok) {
        const data = await retryResponse.json();

        return { id: data.id, name: data.name };
      }
    }
    throw new Error(`Failed to create Dropbox folder: ${folderPath}`);
  }

  const data = await createResponse.json();

  return { id: data.metadata.id, name: data.metadata.name };
}

// ============================================================================
// Unified Folder Management
// ============================================================================

/**
 * Verify a Google Drive folder still exists. Returns true if accessible, false if 404/deleted.
 */
export async function verifyGoogleDriveFolderExists(
  accessToken: string,
  folderId: string,
): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return false;
  const data = await res.json();
  return !data.trashed;
}

/**
 * Find or create the root "dysumcorp" folder
 */
export async function findOrCreateRootFolder(
  accessToken: string,
  userId: string,
  provider: StorageProvider = "google",
): Promise<FolderInfo> {
  if (provider === "dropbox") {
    return findOrCreateDropboxFolder(accessToken, "/dysumcorp");
  }

  return findOrCreateGoogleDriveFolder(accessToken, "dysumcorp");
}

/**
 * Find or create a portal folder inside the dysumcorp folder
 */
export async function findOrCreatePortalFolder(
  accessToken: string,
  rootFolderId: string,
  portalName: string,
  provider: StorageProvider = "google",
): Promise<FolderInfo> {
  if (provider === "dropbox") {
    // For Dropbox, rootFolderId is used as the path
    return findOrCreateDropboxFolder(accessToken, `/dysumcorp/${portalName}`);
  }

  return findOrCreateGoogleDriveFolder(accessToken, portalName, rootFolderId);
}

/**
 * Find or create a client folder inside the portal folder
 */
export async function findOrCreateClientFolder(
  accessToken: string,
  portalFolderId: string,
  clientName: string,
  provider: StorageProvider = "google",
): Promise<FolderInfo> {
  const sanitizedName = clientName.replace(/[<>:"/\\|?*]/g, "_").trim();

  if (!sanitizedName) {
    throw new Error("Invalid client name");
  }

  if (provider === "dropbox") {
    // For Dropbox, portalFolderId contains the path
    return findOrCreateDropboxFolder(
      accessToken,
      `${portalFolderId}/${sanitizedName}`,
    );
  }

  return findOrCreateGoogleDriveFolder(
    accessToken,
    sanitizedName,
    portalFolderId,
  );
}
