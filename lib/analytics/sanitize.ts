import { ANALYTICS_SOURCE_TYPES, isAnalyticsEventName, type AnalyticsEventName } from "./events";

export type AnalyticsRow = {
  event_name: AnalyticsEventName;
  consent: "full" | "anonymous";
  anon_id: string | null;
  user_id: string | null;
  path: string | null;
  source_id: string | null;
  source_type: string | null;
  source_role: string | null;
  slug: string | null;
  query: string | null;
  value: number | null;
  trip_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_host: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ["play", "stay", "eat", "do"];
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|vercel-screenshot/i;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

/**
 * Turns an untrusted browser payload into a row for analytics_events, or null
 * if it is not a valid event. Account and browser ID are only attached with
 * full consent; anonymous events carry neither.
 */
export function sanitizeAnalyticsPayload(payload: unknown, userId: string | null): AnalyticsRow | null {
  if (!payload || typeof payload !== "object") return null;
  const input = payload as Record<string, unknown>;
  if (!isAnalyticsEventName(input.name)) return null;

  const full = input.consent === "full";
  const anonId = full && typeof input.anonId === "string" && UUID.test(input.anonId) ? input.anonId.toLowerCase() : null;
  const sourceType = typeof input.sourceType === "string" && (ANALYTICS_SOURCE_TYPES as readonly string[]).includes(input.sourceType)
    ? input.sourceType
    : input.sourceType === "product" ? "object" : null;
  const role = typeof input.sourceRole === "string" && ROLES.includes(input.sourceRole) ? input.sourceRole : null;
  const value = typeof input.value === "number" && Number.isFinite(input.value) ? Math.max(0, Math.min(input.value, 1_000_000)) : null;
  const tripId = typeof input.tripId === "string" && UUID.test(input.tripId) ? input.tripId : null;
  const path = text(input.path, 300);

  return {
    event_name: input.name,
    consent: full ? "full" : "anonymous",
    anon_id: anonId,
    user_id: full ? userId : null,
    path: path && path.startsWith("/") ? path : null,
    source_id: text(input.sourceId, 120),
    source_type: sourceType,
    source_role: role,
    slug: text(input.slug, 160),
    query: input.name === "search_performed" ? text(input.query, 120) : null,
    value,
    trip_id: full ? tripId : null,
    utm_source: text(input.utm_source, 80),
    utm_medium: text(input.utm_medium, 80),
    utm_campaign: text(input.utm_campaign, 80),
    referrer_host: text(input.referrerHost, 120)
  };
}
