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
 * Best-effort, downstream-of-Supabase forward of one canonical user_event
 * into the v1.26e communication layer (consent-gated Brevo lifecycle
 * events). Only ever called after the Supabase insert already succeeded -
 * if this fails, the product action and the canonical event remain
 * successful regardless.
 *
 * v1.26e.1: the browser is not trusted for ANY lifecycle event property -
 * it only ever supplies the canonical row's own id. The API route looks up
 * that exact row itself and derives event_name/source_id/source_type/
 * source_role/trip_id/occurred_at entirely from the DB, never from this
 * payload.
 */
async function forwardCommunicationEvent(userEventId: string): Promise<void> {
  try {
    await fetch("/api/communication-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEventId })
    });
  } catch {
    // Communication forwarding is best-effort and strictly downstream.
  }
}

/**
 * Best-effort product-history write for the signed-in user. v1.26a tracks
 * authenticated users only - guests silently no-op, as does a missing
 * Supabase connection. Never throws: analytics is secondary to the Save/Trip
 * action it is attached to, and a failed event write must never break it.
 * Do not pass email or other PII in metadata.
 *
 * v1.26e: after a successful Supabase insert, the canonical event id and
 * occurred_at are forwarded (fire-and-forget) to the consent-gated
 * communication layer. A failed Supabase insert never forwards anything.
 */
export async function trackUserEvent(input: TrackUserEventInput): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_events")
      .insert({
        user_id: user.id,
        event_name: input.eventName,
        source_id: input.sourceId || null,
        source_type: input.sourceType || null,
        source_role: input.sourceRole || null,
        trip_id: input.tripId || null,
        metadata: input.metadata || {}
      })
      .select("id,occurred_at")
      .single();

    if (error || !data) return;

    void forwardCommunicationEvent(data.id);
  } catch {
    // Tracking must never surface a failure to the caller.
  }
}
