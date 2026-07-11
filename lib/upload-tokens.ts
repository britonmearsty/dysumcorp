import { logger } from "./logger";
import crypto from "crypto";

export interface UploadToken {
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes?: string;
  stagingKey?: string; // R2 object key — included in HMAC
  /** Set at presign time to avoid re-querying owner access on confirm legs */
  ownerAccessAllowed?: boolean;
  expiresAt: number;
  signature: string;
}

const SECRET = process.env.BETTER_AUTH_SECRET || "fallback-secret-key";

/**
 * Generate a secure upload token that allows the client to confirm an upload.
 * Token expires in 1 hour and is HMAC-signed to prevent tampering.
 * When stagingKey is provided it is included in the signed payload.
 */
export function generateUploadToken(data: {
  portalId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail: string;
  uploaderName: string;
  uploaderNotes?: string;
  stagingKey?: string;
  ownerAccessAllowed?: boolean;
}): string {
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  // Stability: always include optional fields in the HMAC payload as empty strings if missing.
  // This avoids signature mismatches between different environments or object shapes.
  const tokenData = {
    portalId: data.portalId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    uploaderEmail: data.uploaderEmail,
    uploaderName: data.uploaderName,
    uploaderNotes: data.uploaderNotes || "",
    stagingKey: data.stagingKey || "",
    ownerAccessAllowed: data.ownerAccessAllowed ?? false,
    expiresAt,
  };

  // Canonical JSON: fixed key order
  const keys = [
    "portalId",
    "fileName",
    "fileSize",
    "mimeType",
    "uploaderEmail",
    "uploaderName",
    "uploaderNotes",
    "stagingKey",
    "ownerAccessAllowed",
    "expiresAt",
  ];

  const canonicalJson = JSON.stringify(tokenData, keys);

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(canonicalJson)
    .digest("hex");

  const token: UploadToken = { ...tokenData, signature };

  return Buffer.from(JSON.stringify(token)).toString("base64");
}

/**
 * Validate and decode an upload token.
 * Returns the token data if valid, null if invalid or expired.
 */
export function validateUploadToken(encodedToken: string): UploadToken | null {
  try {
    const tokenJson = Buffer.from(encodedToken, "base64").toString("utf-8");
    const token: UploadToken = JSON.parse(tokenJson);

    if (Date.now() > token.expiresAt) {
      logger.error("[Upload Token] Token expired");

      return null;
    }

    const dataToSign = {
      portalId: token.portalId,
      fileName: token.fileName,
      fileSize: token.fileSize,
      mimeType: token.mimeType,
      uploaderEmail: token.uploaderEmail,
      uploaderName: token.uploaderName,
      uploaderNotes: token.uploaderNotes || "",
      stagingKey: token.stagingKey || "",
      ownerAccessAllowed: token.ownerAccessAllowed ?? false,
      expiresAt: token.expiresAt,
    };

    const keys = [
      "portalId",
      "fileName",
      "fileSize",
      "mimeType",
      "uploaderEmail",
      "uploaderName",
      "uploaderNotes",
      "stagingKey",
      "ownerAccessAllowed",
      "expiresAt",
    ];

    const canonicalJson = JSON.stringify(dataToSign, keys);

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(canonicalJson)
      .digest("hex");

    if (token.signature === expectedSignature) {
      return {
        ...token,
        uploaderNotes: token.uploaderNotes || undefined,
        stagingKey: token.stagingKey || undefined,
      };
    }

    // Legacy tokens issued before ownerAccessAllowed was added to the payload
    if (token.ownerAccessAllowed === undefined) {
      const legacyData = {
        portalId: token.portalId,
        fileName: token.fileName,
        fileSize: token.fileSize,
        mimeType: token.mimeType,
        uploaderEmail: token.uploaderEmail,
        uploaderName: token.uploaderName,
        uploaderNotes: token.uploaderNotes || "",
        stagingKey: token.stagingKey || "",
        expiresAt: token.expiresAt,
      };

      const legacyKeys = [
        "portalId",
        "fileName",
        "fileSize",
        "mimeType",
        "uploaderEmail",
        "uploaderName",
        "uploaderNotes",
        "stagingKey",
        "expiresAt",
      ];

      const legacyJson = JSON.stringify(legacyData, legacyKeys);
      const legacySignature = crypto
        .createHmac("sha256", SECRET)
        .update(legacyJson)
        .digest("hex");

      if (token.signature === legacySignature) {
        return {
          ...token,
          uploaderNotes: token.uploaderNotes || undefined,
          stagingKey: token.stagingKey || undefined,
        };
      }
    }

    logger.error("[Upload Token] Invalid signature");

    return null;
  } catch (error) {
    logger.error("[Upload Token] Failed to validate token:", error);

    return null;
  }
}
