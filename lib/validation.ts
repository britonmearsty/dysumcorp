/**
 * Validation utilities for security
 */

import { NextResponse } from "next/server";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * Prevents IDOR and malformed ID attacks
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate and return UUID or return error response
 */
export function validateUUID(
  id: string,
): { valid: true; id: string } | { valid: false; error: NextResponse } {
  if (!isValidUUID(id)) {
    return {
      valid: false,
      error: NextResponse.json({ error: "Invalid ID format" }, { status: 400 }),
    };
  }
  return { valid: true, id };
}

// For use in Next.js 15+ route handlers with params promise
export async function validateIdParam(
  params: Promise<{ id: string }>,
): Promise<{ id: string } | NextResponse> {
  const { id } = await params;
  const validation = validateUUID(id);
  if (!validation.valid) {
    return validation.error;
  }
  return { id: validation.id };
}
