/**
 * Canonical public origin for metadata, sitemap and robots. Set
 * NEXT_PUBLIC_SITE_URL per environment (final: https://thisisaround.de).
 * Without it, Vercel's production domain is used, then the deployment URL,
 * and only outside Vercel localhost. A malformed value never breaks the build.
 */
function candidates(): string[] {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelDeployment = process.env.VERCEL_URL;
  return [
    process.env.NEXT_PUBLIC_SITE_URL,
    vercelProduction ? `https://${vercelProduction}` : undefined,
    vercelDeployment ? `https://${vercelDeployment}` : undefined
  ].filter((value): value is string => Boolean(value && value.trim()));
}

export function siteUrl(): URL {
  for (const value of candidates()) {
    try {
      return new URL(value);
    } catch {
      // try the next candidate
    }
  }
  return new URL("http://localhost:3000");
}
