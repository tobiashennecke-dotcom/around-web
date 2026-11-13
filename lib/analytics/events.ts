/**
 * Analytics event vocabulary. Shared by the browser helper (track.ts), the
 * API route (/api/events) and the DB check constraint on analytics_events
 * (supabase/migrations/20261113_analytics_events.sql). Keep all three in sync.
 */
export const ANALYTICS_EVENT_NAMES = [
  "page_viewed",
  "content_viewed",
  "story_read",
  "search_performed",
  "content_saved",
  "content_unsaved",
  "save_limit_hint",
  "save_limit_reached",
  "login_prompt_shown",
  "login_prompt_dismissed",
  "account_created",
  "trip_created",
  "content_added_to_trip",
  "trip_dates_set",
  "booking_clicked",
  "onboarding_completed",
  "onboarding_skipped",
  "profile_updated"
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}

export const ANALYTICS_SOURCE_TYPES = ["destination", "place", "story", "person", "object", "collection"] as const;

/** Content routes whose views count as content_viewed. */
export const CONTENT_ROUTE_TYPES: Record<string, (typeof ANALYTICS_SOURCE_TYPES)[number]> = {
  destinations: "destination",
  places: "place",
  stories: "story",
  people: "person",
  objects: "object",
  collections: "collection"
};

/** "/stories/soma-bay-mars" -> { sourceType: "story", slug: "soma-bay-mars" } */
export function contentFromPath(pathname: string): { sourceType: (typeof ANALYTICS_SOURCE_TYPES)[number]; slug: string } | null {
  const match = /^\/([a-z]+)\/([^/?#]+)\/?$/.exec(pathname);
  if (!match) return null;
  const sourceType = CONTENT_ROUTE_TYPES[match[1]];
  return sourceType ? { sourceType, slug: decodeURIComponent(match[2]) } : null;
}
