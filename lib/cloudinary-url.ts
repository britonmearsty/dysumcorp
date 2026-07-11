const CLOUDINARY_REGEX =
  /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.*)$/;

const SVG_REGEX = /\.svg(\?|$)/i;
const SVG_MIME = /svg/i;

/**
 * Check if a URL or mime type refers to an SVG.
 */
function isSvg(url: string, mimeType?: string): boolean {
  if (mimeType && SVG_MIME.test(mimeType)) return true;
  return SVG_REGEX.test(url);
}

/**
 * Return an optimized Cloudinary URL for a given logo URL.
 *
 * For raster images:
 *   - Adds `f_auto` (browser-native format — WebP/AVIF)
 *   - Adds `q_auto` (automatic quality compression)
 *   - Adds `w_{width}` (responsive width — defaults to 128 for logos)
 *
 * For SVGs:
 *   - Returns the URL as-is (f_auto breaks SVGs)
 *
 * If the URL is not from Cloudinary, it is returned unchanged.
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  opts?: { width?: number; mimeType?: string },
): string {
  if (!url) return url;

  // Don't transform SVGs — f_auto would convert them to raster
  if (isSvg(url, opts?.mimeType)) return url;

  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url;

  const width = opts?.width ?? 128;
  const transformations = `f_auto,q_auto,w_${width}`;

  // Insert transformations after `/image/upload/`
  const rest = match[1];
  return url.replace(
    `/image/upload/${rest}`,
    `/image/upload/${transformations}/${rest}`,
  );
}
