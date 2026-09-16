import { createClient } from "@/lib/supabase/client";
import type { ContentRole } from "@/lib/content-role";

export type EventName =
  | "account_created"
  | "content_viewed"
  | "content_saved"
  | "content_unsaved"
  | "trip_created"
  | "content_added_to_trip"
  | "trip_dates_set"
  | "booking_clicked";

/**
 * DB-facing source type for user_events - matches the
 * user_events_source_type_check constraint exactly. Note there is no
 * "product" variant here: callers normalize product -> object (the same
 * DB normalization saved_items already uses) before tracking an event.
 */
export type EventSourceType =
  | "destination"
  | "place"
  | "story"
  | "person"
  | "object"
  | "collection";

const EVENT_SOURCE_TYPES: readonly EventSourceType[] = [
  "destination", "place", "story", "person", "object", "collection"
];

/** Narrows an arbitrary string to EventSourceType, or undefined if it isn't one. */
export function toEventSourceType(value?: string | null): EventSourceType | undefined {
  return EVENT_SOURCE_TYPES.includes(value as EventSourceType) ? (value as EventSourceType) : undefined;
}

export type TrackUserEventInput = {
  eventName: EventName;
  sourceId?: string;
  sourceType?: EventSourceType;
  sourceRole?: ContentRole;
  tripId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort product-history write for the signed-in user. v1.26a tracks
 * authenticated users only - guests silently no-op, as does a missing
 * Supabase connection. Never throws: analytics is secondary to the Save/Trip
 * action it is attached to, and a failed event write must never break it.
 * Do not pass email or other PII in metadata.
 */
export async function trackUserEvent(input: TrackUserEventInput): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_events").insert({
      user_id: user.id,
      event_name: input.eventName,
      source_id: input.sourceId || null,
      source_type: input.sourceType || null,
      source_role: input.sourceRole || null,
      trip_id: input.tripId || null,
      metadata: input.metadata || {}
    });
  } catch {
    // Tracking must never surface a failure to the caller.
  }
}
