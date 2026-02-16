/**
 * Upload Manager - Hybrid upload system
 * Automatically chooses between API upload (< 4MB) and direct upload (>= 4MB)
 */

export interface UploadOptions {
  file: File;
  portalId: string;
  password?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  onProgress?: (progress: number) => void;
  provider?: "google" | "dropbox";
}

export interface UploadResult {
  success: boolean;
  file?: any;
  error?: string;
  method: "api" | "direct";
}

const SIZE_THRESHOLD = 4 * 1024 * 1024; // 4 MB

/**
 * Upload file using the appropriate method based on file size
 */
export async function uploadFile(
  options: UploadOptions
): Promise<UploadResult> {
  const { file, portalId, password, uploaderName, uploaderEmail, onProgress, provider } = options;

  // Decide upload method based on file size
  if (file.size < SIZE_THRESHOLD) {
    // Small file: Use API upload (simple, fast)
    return uploadViaAPI(options);
  } else {
    // Large file: Use direct upload (no size limits)
    return uploadDirectToCloud(options);
  }
}

/**
 * Upload via API route (for files < 4MB)
 */
async function uploadViaAPI(options: UploadOptions): Promise<UploadResult> {
  const { file, portalId, password, uploaderName, uploaderEmail, onProgress } = options;

  try {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("portalId", portalId);
    
    if (password) formData.append("passwords", password);
    if (uploaderName) formData.append("uploaderName", uploaderName);
    if (uploaderEmail) formData.append("uploaderEmail", uploaderEmail);

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
 * Upload directly to cloud storage (for files >= 4MB)
 */
async function uploadDirectToCloud(options: UploadOptions): Promise<UploadResult> {
  const { file, portalId, password, uploaderName, uploaderEmail, onProgress, provider } = options;

  try {
    // Step 1: Get upload URL from API
    const uploadUrlResponse = await fetch("/api/storage/direct-upload", {
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
      throw new Error("Failed to get upload URL");
    }

    const uploadData = await uploadUrlResponse.json();

    // Step 2: Upload directly to cloud storage
    let storageUrl: string;

    if (uploadData.provider === "google") {
      // Google Drive resumable upload
      const uploadResult = await uploadToGoogleDrive(
        uploadData.uploadUrl,
        file,
        onProgress
      );
      storageUrl = uploadResult.webViewLink || uploadResult.id;
    } else {
      // Dropbox upload
      const uploadResult = await uploadToDropbox(
        uploadData.accessToken,
        uploadData.path,
        file,
        onProgress
      );
      storageUrl = uploadResult.id;
    }

    // Step 3: Confirm upload and save metadata
    const confirmResponse = await fetch("/api/storage/confirm-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageUrl,
        password,
        uploaderName,
        uploaderEmail,
      }),
    });

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
    console.error("Direct upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      method: "direct",
    };
  }
}

/**
 * Upload to Google Drive using resumable upload
 */
async function uploadToGoogleDrive(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
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
        reject(new Error(`Google Drive upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during Google Drive upload"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

/**
 * Upload to Dropbox
 */
async function uploadToDropbox(
  accessToken: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
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
        reject(new Error(`Dropbox upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during Dropbox upload"));
    });

    xhr.open("POST", "https://content.dropboxapi.com/2/files/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader(
      "Dropbox-API-Arg",
      JSON.stringify({
        path: path.startsWith("/") ? path : `/${path}`,
        mode: "add",
        autorename: true,
        mute: false,
      })
    );
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.send(file);
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: Omit<UploadOptions, "file">
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile({ ...options, file });
    results.push(result);
  }

  return results;
}
