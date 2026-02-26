import crypto from "crypto";

export interface UploadToken {
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes?: string;
  expiresAt: number;
  signature: string;
}

const SECRET = process.env.BETTER_AUTH_SECRET || "fallback-secret-key";

/**
 * Generate a secure upload token that allows the client to confirm an upload
 * Token expires in 1 hour and is signed to prevent tampering
 */
export function generateUploadToken(data: {
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes?: string;
}): string {
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

  const tokenData = {
    portalId: data.portalId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    uploaderEmail: data.uploaderEmail,
    uploaderName: data.uploaderName,
    uploaderNotes: data.uploaderNotes,
    expiresAt,
  };

  // Create HMAC signature to prevent tampering
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(tokenData))
    .digest("hex");

  const token: UploadToken = {
    ...tokenData,
    signature,
  };

  // Encode as base64 for easy transmission
  return Buffer.from(JSON.stringify(token)).toString("base64");
}

/**
 * Validate and decode an upload token
 * Returns the token data if valid, null if invalid or expired
 */
export function validateUploadToken(
  encodedToken: string,
): UploadToken | null {
  try {
    // Decode from base64
    const tokenJson = Buffer.from(encodedToken, "base64").toString("utf-8");
    const token: UploadToken = JSON.parse(tokenJson);

    // Check expiration
    if (Date.now() > token.expiresAt) {
      console.error("[Upload Token] Token expired");
      return null;
    }

    // Verify signature
    const dataToSign = {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      mimeType: token.mimeType,
      uploaderEmail: token.uploaderEmail,
      uploaderName: token.uploaderName,
      uploaderNotes: token.uploaderNotes,
      expiresAt: token.expiresAt,
    };

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(JSON.stringify(dataToSign))
      .digest("hex");

    if (token.signature !== expectedSignature) {
      console.error("[Upload Token] Invalid signature");
      return null;
    }

    return token;
  } catch (error) {
    console.error("[Upload Token] Failed to validate token:", error);
    return null;
  }
}
