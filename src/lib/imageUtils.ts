/**
 * Optimize Supabase Storage image URLs with transformation parameters.
 * Falls back to original URL for non-Supabase images.
 */
export function getOptimizedImageUrl(
  url: string | null,
  options: { width?: number; height?: number; quality?: number } = {}
): string | null {
  if (!url) return null;

  const { width = 400, height = 250, quality = 60 } = options;

  // Only transform Supabase Storage URLs
  if (url.includes('supabase') && url.includes('/storage/')) {
    // Use Supabase Image Transformation API
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&height=${height}&resize=cover&quality=${quality}`;
  }

  return url;
}
