/**
 * AROUND v1.26e - which canonical user_events are communication-relevant.
 *
 * Supabase keeps the full User Intelligence history; Brevo only ever
 * receives the subset needed to trigger lifecycle communication, gated by
 * the exact consent flag that covers it. Pure and dependency-free so it can
 * be exercised directly against every EventName.
 *
 * Deliberately absent: account_created (account creation is not consent),
 * content_viewed (a view is weak intent), booking_clicked (booking
 * lifecycle is not yet product-defined). Provider event names are fixed
 * strings, never dynamically generated.
 */

import type { EventName } from "@/lib/analytics/user-events";
import type { CommunicationPreferenceKey } from "@/lib/communication/preferences";

export type BrevoEventPolicy = {
  /** Deterministic Brevo-facing event name. */
  providerEventName: string;
  /** The one communication preference that must be true for this event to forward. */
  requiresPreference: CommunicationPreferenceKey;
};

const EVENT_POLICY: Partial<Record<EventName, BrevoEventPolicy>> = {
  content_saved: { providerEventName: "around_content_saved", requiresPreference: "myAroundUpdates" },
  content_unsaved: { providerEventName: "around_content_unsaved", requiresPreference: "myAroundUpdates" },
  trip_created: { providerEventName: "around_trip_created", requiresPreference: "tripIntelligence" },
  content_added_to_trip: { providerEventName: "around_content_added_to_trip", requiresPreference: "tripIntelligence" },
  trip_dates_set: { providerEventName: "around_trip_dates_set", requiresPreference: "tripIntelligence" }
};

/** Returns null for any event this layer must never forward to Brevo. */
export function getBrevoEventPolicy(eventName: EventName): BrevoEventPolicy | null {
  return EVENT_POLICY[eventName] || null;
}
