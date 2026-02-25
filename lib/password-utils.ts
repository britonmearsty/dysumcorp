import * as crypto from "crypto";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * IMPORTANT: This is async because bcrypt uses CPU-intensive hashing
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a hash is in legacy SHA-256 format (for migration)
 * SHA-256 hashes are 64 characters, bcrypt hashes start with $2
 */
export function isLegacyHash(hash: string): boolean {
  return hash.length === 64 && !hash.startsWith("$2");
}

/**
 * Verify password with support for legacy SHA-256 hashes (for migration)
 * Automatically upgrades to bcrypt on successful verification
 */
export async function verifyPasswordWithMigration(
  password: string,
  hash: string,
): Promise<{ valid: boolean; newHash?: string }> {
  if (isLegacyHash(hash)) {
    const legacyHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (legacyHash === hash) {
      const newHash = await hashPassword(password);

      return { valid: true, newHash };
    }

    return { valid: false };
  }

  const valid = await verifyPassword(password, hash);

  return { valid };
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);

    password += charset[randomIndex];
  }

  return password;
}

/**
 * Check if a password meets security requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
