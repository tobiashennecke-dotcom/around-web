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

type SanitizedInput = {
  eventName: EventName | null;
  sourceId?: string;
  sourceType?: string;
  sourceRole?: string;
  tripId?: string;
  userEventId?: string;
  occurredAt?: string;
};

function sanitizeBody(body: unknown): SanitizedInput {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const eventName = typeof record.eventName === "string" && (KNOWN_EVENT_NAMES as string[]).includes(record.eventName)
    ? (record.eventName as EventName)
    : null;

  return {
    eventName,
    sourceId: typeof record.sourceId === "string" ? record.sourceId : undefined,
    sourceType: typeof record.sourceType === "string" ? record.sourceType : undefined,
    sourceRole: typeof record.sourceRole === "string" ? record.sourceRole : undefined,
    tripId: typeof record.tripId === "string" ? record.tripId : undefined,
    userEventId: typeof record.userEventId === "string" ? record.userEventId : undefined,
    occurredAt: typeof record.occurredAt === "string" ? record.occurredAt : undefined
  };
}

/**
 * Consent-gated, allowlisted forwarding of a canonical Supabase user_event
 * into Brevo. Never accepts an arbitrary Brevo event name, list id, contact
 * id, or API key from the browser - only canonical AROUND event values.
 * Must never throw into the calling product action: every path below
 * returns a plain JSON result.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ forwarded: false, reason: "provider_disabled" });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ forwarded: false, reason: "unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ forwarded: false, reason: "invalid_body" }, { status: 400 });
  }

  const input = sanitizeBody(rawBody);
  if (!input.eventName) {
    return NextResponse.json({ forwarded: false, reason: "unknown_event" }, { status: 400 });
  }

  const policy = getBrevoEventPolicy(input.eventName);
  if (!policy) {
    return NextResponse.json({ forwarded: false, reason: "not_forwardable" });
  }

  const preferences = await getCommunicationPreferences(supabase, user.id);
  if (!preferences[policy.requiresPreference]) {
    return NextResponse.json({ forwarded: false, reason: "no_consent" });
  }

  if (!isBrevoConfigured()) {
    return NextResponse.json({ forwarded: false, reason: "provider_disabled" });
  }

  const eventProperties: Record<string, string> = {};
  if (input.sourceId) eventProperties.source_id = input.sourceId;
  if (input.sourceType) eventProperties.source_type = input.sourceType;
  if (input.sourceRole) eventProperties.source_role = input.sourceRole;
  if (input.tripId) eventProperties.trip_id = input.tripId;
  if (input.userEventId) eventProperties.user_event_id = input.userEventId;

  const result = await brevoRequest("/events", {
    method: "POST",
    body: {
      event_name: policy.providerEventName,
      event_date: input.occurredAt || new Date().toISOString(),
      identifiers: { email_id: user.email, ext_id: user.id },
      ...(Object.keys(eventProperties).length ? { event_properties: eventProperties } : {})
    }
  });

  return NextResponse.json({ forwarded: result.ok });
}
