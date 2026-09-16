import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCommunicationPreferences } from "@/lib/supabase/communication-preferences";
import { getBrevoEventPolicy } from "@/lib/brevo/event-policy";
import { brevoRequest, isBrevoConfigured } from "@/lib/brevo/server";
import type { EventName } from "@/lib/analytics/user-events";

const KNOWN_EVENT_NAMES: EventName[] = [
  "account_created",
  "content_viewed",
  "content_saved",
  "content_unsaved",
  "trip_created",
  "content_added_to_trip",
  "trip_dates_set",
  "booking_clicked"
];

function toEventName(value: unknown): EventName | null {
  return typeof value === "string" && (KNOWN_EVENT_NAMES as string[]).includes(value) ? (value as EventName) : null;
}

/**
 * Consent-gated, allowlisted forwarding of one canonical Supabase
 * user_events row into Brevo.
 *
 * v1.26e.1: the browser is not trusted for ANY lifecycle event property. It
 * supplies only the row's own id; every value that reaches Brevo - event
 * name, source id/type/role, trip id, occurred_at - is looked up from that
 * exact row, scoped to the authenticated user (both via RLS and an
 * explicit user_id filter). A userEventId that doesn't exist, or belongs to
 * someone else, or that RLS would hide, all resolve to the same outcome:
 * nothing forwarded.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ forwarded: false, reason: "provider_disabled" });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ forwarded: false, reason: "unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ forwarded: false, reason: "invalid_body" }, { status: 400 });
  }

  const userEventId = rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>).userEventId : undefined;
  if (typeof userEventId !== "string" || !userEventId) {
    return NextResponse.json({ forwarded: false, reason: "invalid_body" }, { status: 400 });
  }

  const { data: row, error: rowError } = await supabase
    .from("user_events")
    .select("id,event_name,source_id,source_type,source_role,trip_id,occurred_at")
    .eq("id", userEventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (rowError || !row) {
    return NextResponse.json({ forwarded: false, reason: "event_not_found" });
  }

  const eventName = toEventName(row.event_name);
  if (!eventName) {
    return NextResponse.json({ forwarded: false, reason: "unknown_event" });
  }

  const policy = getBrevoEventPolicy(eventName);
  if (!policy) {
    return NextResponse.json({ forwarded: false, reason: "not_forwardable" });
  }

  let preferences;
  try {
    preferences = await getCommunicationPreferences(supabase, user.id);
  } catch {
    // "Could not tell us" is not the same as "no consent" - fail closed,
    // never forward on an unreadable preference state.
    return NextResponse.json({ forwarded: false, reason: "preferences_unavailable" });
  }

  if (!preferences[policy.requiresPreference]) {
    return NextResponse.json({ forwarded: false, reason: "no_consent" });
  }

  if (!isBrevoConfigured() || !user.email) {
    return NextResponse.json({ forwarded: false, reason: "provider_disabled" });
  }

  const eventProperties: Record<string, string> = { user_event_id: row.id };
  if (row.source_id) eventProperties.source_id = row.source_id;
  if (row.source_type) eventProperties.source_type = row.source_type;
  if (row.source_role) eventProperties.source_role = row.source_role;
  if (row.trip_id) eventProperties.trip_id = row.trip_id;

  const result = await brevoRequest("/events", {
    method: "POST",
    body: {
      event_name: policy.providerEventName,
      event_date: row.occurred_at,
      identifiers: { email_id: user.email, ext_id: user.id },
      event_properties: eventProperties
    }
  });

  return NextResponse.json({ forwarded: result.ok });
}
