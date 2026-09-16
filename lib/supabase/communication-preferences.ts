import type { SupabaseClient } from "@supabase/supabase-js";
import {
  communicationPreferencesFromRow,
  communicationPreferencesToRow,
  type CommunicationPreferences
} from "@/lib/communication/preferences";

const SELECT_COLUMNS = "around_journal,my_around_updates,trip_intelligence,around_drops";

/**
 * Reads the given user's canonical communication preferences. Works with
 * either the browser or server Supabase client - both are protected by the
 * same "select own row only" RLS policy.
 *
 * "No preference row exists" (a missing row, e.g. the bootstrap trigger
 * hasn't run yet, no query error) is a safe all-false state. "The database
 * could not tell us" (an actual query error) is NOT the same thing and must
 * not be silently treated as all-false - callers need to know consent
 * couldn't actually be read, so this throws instead.
 */
export async function getCommunicationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunicationPreferences> {
  const { data, error } = await supabase
    .from("communication_preferences")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return communicationPreferencesFromRow(null);
  return communicationPreferencesFromRow(data);
}

/**
 * Writes the given user's complete communication preferences. Upserts since
 * the row may not exist yet; RLS requires auth.uid() = user_id for both the
 * insert and update paths this can take.
 *
 * The canonical write path for UI changes is PUT /api/communication-preferences
 * (server client), which keeps the Supabase update and the best-effort Brevo
 * sync in one flow - this helper itself has no opinion on that.
 */
export async function updateCommunicationPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: CommunicationPreferences
): Promise<CommunicationPreferences> {
  const row = communicationPreferencesToRow(preferences);
  const { data, error } = await supabase
    .from("communication_preferences")
    .upsert({ user_id: userId, ...row }, { onConflict: "user_id" })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) throw error || new Error("communication_preferences upsert returned no row");
  return communicationPreferencesFromRow(data);
}
