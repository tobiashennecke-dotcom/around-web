/**
 * Canonical public origin for metadata, sitemap and robots. Set
 * NEXT_PUBLIC_SITE_URL per environment (final: https://thisisaround.de);
 * a missing or malformed value falls back to localhost instead of breaking
 * the build.
 */
export function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}
