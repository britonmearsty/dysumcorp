/**
 * Upload Manager - Hybrid upload system
 * Automatically chooses between API upload (< 4MB) and direct upload (>= 4MB)
 * Enhanced with chunked uploading and retries for reliability
 */

export interface UploadOptions {
  file: File;
  portalId: string;
  password?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  onProgress?: (progress: number) => void;
  provider?: "google" | "dropbox";
  skipNotification?: boolean;
}

export interface UploadResult {
  success: boolean;
  file?: any;
  error?: string;
  method: "api" | "direct";
}

const SIZE_THRESHOLD = 0; // Force all files through direct upload to bypass Vercel limits
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Upload file using the appropriate method based on file size
 */
export async function uploadFile(
  options: UploadOptions,
): Promise<UploadResult> {
  const { file } = options;

  // Decide upload method based on file size
  if (file.size < SIZE_THRESHOLD) {
    // Small file: Use API upload (simple, fast)
    return uploadViaAPI(options);
  } else {
    // Large file: Use direct upload with chunking and retries
    return uploadDirectToCloudChunked(options);
  }
}

/**
 * Upload via API route (for files < 4MB)
 */
async function uploadViaAPI(options: UploadOptions): Promise<UploadResult> {
  const {
    file,
    portalId,
    password,
    uploaderName,
    uploaderEmail,
    onProgress,
    skipNotification,
  } = options;

  try {
    const formData = new FormData();

    formData.append("files", file);
    formData.append("portalId", portalId);

    if (password) formData.append("passwords", password);
    if (uploaderName) formData.append("uploaderName", uploaderName);
    if (uploaderEmail) formData.append("uploaderEmail", uploaderEmail);
    if (skipNotification) formData.append("skipNotification", "true");

    // Create XMLHttpRequest for progress tracking
    const result = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;

          onProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });

      xhr.open("POST", "/api/portals/upload");
      xhr.send(formData);
    });

    return {
      success: true,
      file: result.files?.[0],
      method: "api",
    };
  } catch (error) {
    console.error("API upload error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      method: "api",
    };
  }
}

/**
 * Helper for exponential backoff retries
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(
      `Retry attempt remaining: ${retries}. Retrying in ${delay}ms...`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));

    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Upload directly to cloud storage using chunking and retries
 */
async function uploadDirectToCloudChunked(
  options: UploadOptions,
): Promise<UploadResult> {
  const {
    file,
    portalId,
    password,
    uploaderName,
    uploaderEmail,
    onProgress,
    provider,
    skipNotification,
  } = options;

  try {
    // Step 1: Get upload session info from our API
    const uploadUrlResponse = await fetch("/api/portals/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        portalId,
        provider: provider || "google",
      }),
    });

    if (!uploadUrlResponse.ok) {
      const errorData = await uploadUrlResponse.json();

      throw new Error(errorData.error || "Failed to get upload session");
    }

    const uploadData = await uploadUrlResponse.json();
    let storageUrl = "";
    let storageFileId = "";

    // Step 2: Perform chunked upload based on provider
    if (uploadData.provider === "google") {
      const result = await uploadToGoogleDriveChunked(
        uploadData.uploadUrl,
        file,
        onProgress,
      );

      storageUrl =
        result.webViewLink ||
        `https://drive.google.com/file/d/${result.id}/view`;
      storageFileId = result.id;
    } else if (uploadData.provider === "dropbox") {
      const result = await uploadToDropboxChunked(
        uploadData.accessToken,
        uploadData.path,
        file,
        onProgress,
      );

      storageUrl = "";
      storageFileId = result.id;
    }

    // Step 3: Confirm upload and save metadata
    const confirmResponse = await withRetry(() =>
      fetch("/api/portals/confirm-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageUrl,
          storageFileId,
          password,
          uploaderName,
          uploaderEmail,
          skipNotification,
        }),
      }),
    );

    if (!confirmResponse.ok) {
      throw new Error("Failed to confirm upload");
    }

    const confirmData = await confirmResponse.json();

    return {
      success: true,
      file: confirmData.file,
      method: "direct",
    };
  } catch (error) {
    console.error("Direct chunked upload error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      method: "direct",
    };
  }
}

/**
 * Google Drive Chunked Upload (Resumable)
 */
async function uploadToGoogleDriveChunked(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<any> {
  const totalSize = file.size;
  let uploadedBytes = 0;

  while (uploadedBytes < totalSize) {
    const chunk = file.slice(
      uploadedBytes,
      Math.min(uploadedBytes + CHUNK_SIZE, totalSize),
    );
    const chunkStart = uploadedBytes;
    const chunkEnd = chunkStart + chunk.size - 1;

    await withRetry(async () => {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: chunk,
      });

      // Google returns 308 Resume Incomplete for intermediate chunks
      if (!response.ok && response.status !== 308) {
        throw new Error(`Google Drive upload failed: ${response.statusText}`);
      }

      if (uploadedBytes + chunk.size === totalSize) {
        // Last chunk
        return await response.json();
      }
    });

    uploadedBytes += chunk.size;
    if (onProgress) {
      onProgress(Math.min((uploadedBytes / totalSize) * 100, 99));
    }
  }

  // After loop, we need to get the final response if the last chunk didn't return it
  // But in the logic above, we should have it. Let's refine to return the result.
  // We'll verify the last chunk's JSON response.
  const finalResponse = await withRetry(() =>
    fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes */${totalSize}`,
      },
    }),
  );

  if (onProgress) onProgress(100);

  return await finalResponse.json();
}

/**
 * Dropbox Chunked Upload (Upload Session)
 */
async function uploadToDropboxChunked(
  accessToken: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<any> {
  const totalSize = file.size;

  // Step 1: Start Session
  const startResponse = await withRetry(() =>
    fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream",
      },
    }),
  );

  if (!startResponse.ok) {
    throw new Error(
      `Dropbox start session failed: ${startResponse.statusText}`,
    );
  }

  const { session_id } = await startResponse.json();
  let uploadedBytes = 0;

  // Step 2: Append Chunks
  while (uploadedBytes < totalSize - CHUNK_SIZE) {
    const chunk = file.slice(uploadedBytes, uploadedBytes + CHUNK_SIZE);

    await withRetry(() =>
      fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({
            cursor: { session_id, offset: uploadedBytes },
            close: false,
          }),
          "Content-Type": "application/octet-stream",
        },
        body: chunk,
      }),
    );

    uploadedBytes += chunk.size;
    if (onProgress) onProgress((uploadedBytes / totalSize) * 100);
  }

  // Step 3: Finish Session
  const finalChunk = file.slice(uploadedBytes);
  const finishResponse = await withRetry(() =>
    fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id, offset: uploadedBytes },
          commit: {
            path: path.startsWith("/") ? path : `/${path}`,
            mode: "add",
            autorename: true,
          },
        }),
        "Content-Type": "application/octet-stream",
      },
      body: finalChunk,
    }),
  );

  if (!finishResponse.ok) {
    throw new Error(`Dropbox finish failed: ${finishResponse.statusText}`);
  }

  if (onProgress) onProgress(100);

  return await finishResponse.json();
}

/**
 * Upload multiple files and send a single batch notification report
 */
export async function uploadFiles(
  files: File[],
  options: Omit<UploadOptions, "file">,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const successfulFiles: Array<{ name: string; size: number }> = [];

  for (const file of files) {
    const result = await uploadFile({
      ...options,
      file,
      skipNotification: true, // Skip individual notification for batch uploads
    });

    results.push(result);

    if (result.success) {
      successfulFiles.push({ name: file.name, size: file.size });
    }
  }

  // Send batch notification if there were successes
  if (successfulFiles.length > 0) {
    try {
      await fetch("/api/portals/batch-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: options.portalId,
          files: successfulFiles,
          uploaderName: options.uploaderName,
          uploaderEmail: options.uploaderEmail,
        }),
      });
      console.log(
        `[Upload Manager] Batch notification sent for ${successfulFiles.length} files`,
      );
    } catch (error) {
      console.error(
        "[Upload Manager] Failed to send batch notification:",
        error,
      );
      // Don't fail the whole process if notification fails
    }
  }

  return results;
}
