/**
 * Slug Validation Utilities
 * Handles validation and sanitization of portal URL slugs
 */

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
  'api',
  'admin',
  'dashboard',
  'auth',
  'login',
  'logout',
  'signup',
  'register',
  'settings',
  'profile',
  'portal',
  'portals',
  'file',
  'files',
  'upload',
  'download',
  'static',
  'public',
  'assets',
  'images',
  'css',
  'js',
  'fonts',
  'favicon',
  'robots',
  'sitemap',
  'about',
  'contact',
  'help',
  'support',
  'terms',
  'privacy',
  'pricing',
  'blog',
  'docs',
  'documentation',
];

export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Sanitize a string to be a valid slug
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters except hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start and end
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate a slug format and content
 */
export function validateSlug(slug: string): SlugValidationResult {
  // Check if empty
  if (!slug || slug.trim().length === 0) {
    return {
      isValid: false,
      error: 'Slug cannot be empty',
    };
  }

  // Check minimum length
  if (slug.length < 3) {
    return {
      isValid: false,
      error: 'Slug must be at least 3 characters long',
    };
  }

  // Check maximum length
  if (slug.length > 50) {
    return {
      isValid: false,
      error: 'Slug must be 50 characters or less',
    };
  }

  // Check if it contains only valid characters
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      isValid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  // Check if it starts or ends with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      isValid: false,
      error: 'Slug cannot start or end with a hyphen',
    };
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return {
      isValid: false,
      error: 'Slug cannot contain consecutive hyphens',
    };
  }

  // Check if it's a reserved slug
  if (RESERVED_SLUGS.includes(slug)) {
    return {
      isValid: false,
      error: 'This slug is reserved and cannot be used',
    };
  }

  // Check if it's only numbers (could be confused with IDs)
  if (/^\d+$/.test(slug)) {
    return {
      isValid: false,
      error: 'Slug cannot be only numbers',
    };
  }

  return {
    isValid: true,
    sanitized: slug,
  };
}

/**
 * Generate a slug from a name
 */
export function generateSlugFromName(name: string): string {
  return sanitizeSlug(name);
}
