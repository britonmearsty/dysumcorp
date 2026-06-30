import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SECRET = process.env.BETTER_AUTH_SECRET || "fallback-secret-key-at-least-32-chars-long";

// Ensure secret is 32 bytes
const ENCRYPTION_KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Return IV + AuthTag + EncryptedText as a single hex string
  return iv.toString("hex") + tag.toString("hex") + encrypted;
}

/**
 * Decrypt a string using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
  try {
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), "hex");
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), "hex");
    const encryptedText = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // If decryption fails, it might be plain text (for migration) or a different key
    return encryptedData;
  }
}

/**
 * Check if a string looks like it's encrypted (for migration purposes)
 * We assume hex string of at least IV + Tag length
 */
export function isEncrypted(text: string): boolean {
  // IV (12 bytes/24 hex) + Tag (16 bytes/32 hex) = 56 hex chars minimum
  const hexRegex = /^[0-9a-fA-F]{56,}$/;
  return hexRegex.test(text);
}
