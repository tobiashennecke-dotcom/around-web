import { createClient } from "@/lib/supabase/client";

export type EventName =
  | "account_created"
  | "content_viewed"
  | "content_saved"
  | "content_unsaved"
  | "trip_created"
  | "content_added_to_trip"
  | "trip_dates_set"
  | "booking_clicked";

export type TrackUserEventInput = {
  eventName: EventName;
  sourceId?: string;
  sourceType?: string;
  sourceRole?: string;
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
