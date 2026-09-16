import "server-only";

/**
 * AROUND v1.27a - Sanity Content Lake read-security status helpers.
 *
 * Pure inspection only: these never return a secret value, never log a
 * token, and are never exposed to the browser (server-only).
 */

/** True only when a server-only Sanity read token is actually configured. */
export function isSanityAuthenticatedReadConfigured(): boolean {
  return Boolean(process.env.SANITY_API_READ_TOKEN);
}

/**
 * True when the server must refuse to make an anonymous Content Lake read
 * rather than silently proceeding without a token. Off by default - this
 * is set explicitly, only during the actual public -> private dataset
 * cutover (see docs/SANITY_SECURITY.md), never enabled automatically here.
 */
export function isSanityAuthenticatedReadsRequired(): boolean {
  const value = (process.env.SANITY_REQUIRE_AUTHENTICATED_READS || "").trim().toLowerCase();
  return value === "1" || value === "true";
}
