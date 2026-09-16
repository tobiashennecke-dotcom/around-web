import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCommunicationPreferences, updateCommunicationPreferences } from "@/lib/supabase/communication-preferences";
import { isValidCommunicationPreferences } from "@/lib/communication/preferences";
import { syncCommunicationPreferencesToBrevo, type BrevoSyncResult } from "@/lib/brevo/contact-sync";

/**
 * Canonical read/write for the signed-in user's communication preferences.
 * Email is always read from the authenticated Supabase session - never
 * accepted from the request body. Supabase is authoritative: a Brevo sync
 * failure never rolls back or blocks the saved consent.
 */

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const preferences = await getCommunicationPreferences(supabase, user.id);
  return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!isValidCommunicationPreferences(body)) {
    return NextResponse.json({ error: "invalid_preferences" }, { status: 400 });
  }

  let saved;
  try {
    saved = await updateCommunicationPreferences(supabase, user.id, body);
  } catch {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  let providerSync: BrevoSyncResult = "disabled";
  if (user.email) {
    try {
      providerSync = await syncCommunicationPreferencesToBrevo({ userId: user.id, email: user.email, preferences: saved });
    } catch {
      providerSync = "failed";
    }
  }

  return NextResponse.json({ preferences: saved, providerSync });
}
