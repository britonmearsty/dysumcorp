/**
 * Safe error handling utilities
 * Prevents information leakage in production by sanitizing error messages
 */

/**
 * Returns a generic error message in production, detailed in development
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = "An error occurred",
): string {
  // Always return a generic message - don't leak internal details
  return fallback;
}

/**
 * Creates a safe error response that doesn't leak details in production
 */
export function safeErrorResponse(message: string, status: number = 500) {
  // Map of generic messages for common errors
  const genericMessages: Record<string, string> = {
    "Failed to fetch portal": "Failed to load portal",
    "Failed to update portal": "Failed to update portal",
    "Failed to create portal": "Failed to create portal",
    "Failed to delete portal": "Failed to delete portal",
    "Failed to sync subscription": "Failed to sync subscription",
    "Failed to trigger usage tracking": "Failed to process request",
    "Upload failed": "Upload failed",
    "Failed to prepare upload": "Upload preparation failed",
    "Failed to confirm upload": "Confirmation failed",
    "Failed to load files": "Failed to load files",
    "Failed to delete file": "Failed to delete file",
  };

  // Return generic message or fallback
  return {
    error: genericMessages[message] || "An error occurred",
    status,
  };
}
